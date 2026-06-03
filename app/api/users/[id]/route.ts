import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, roles, colleges, departments, programmes, userRoles } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";
import { updateUserSchema } from "@/lib/validators/users";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }
    const resolvedParams = await params;
    const userId = resolvedParams.id === "me" ? auth.user.userId : resolvedParams.id;

    if (auth.user.userId !== userId) {
      const hasPerm = await checkPermission(auth.user.roleIds, "user.read");
      if (!hasPerm) return errorResponse("Forbidden", 403);
    }

    const [dbUser] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        registrationNumber: users.registrationNumber,
        sex: users.sex,
        email: users.email,
        isActive: users.isActive,
        collegeId: users.collegeId,
        programmeId: users.programmeId,
        yearOfStudy: users.yearOfStudy,
        currentSemester: users.currentSemester,
        avatarUrl: users.avatarUrl,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!dbUser) return errorResponse("User not found", 404);

    const roleRows = await db
      .select({ id: roles.id, name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt)));

    const primary = roleRows[0];

    // Resolve programme name
    let programmeInfo: { id: string; name: string; code: string } | null = null;
    let collegeInfo: { id: string; name: string; shortName: string } | null = null;

    if (dbUser.programmeId) {
      // Join programme → department → college in one query
      const [prog] = await db.select({
        progId: programmes.id,
        progName: programmes.name,
        progCode: programmes.code,
        collegeId: departments.collegeId,
        collegeName: colleges.name,
        collegeShortName: colleges.shortName,
      })
      .from(programmes)
      .innerJoin(departments, eq(programmes.departmentId, departments.id))
      .innerJoin(colleges, eq(departments.collegeId, colleges.id))
      .where(eq(programmes.id, dbUser.programmeId))
      .limit(1);

      if (prog) {
        programmeInfo = { id: prog.progId, name: prog.progName, code: prog.progCode };
        collegeInfo = { id: prog.collegeId, name: prog.collegeName, shortName: prog.collegeShortName };
      }
    }

    // If user has a direct collegeId but no programme, fetch college directly
    if (!collegeInfo && dbUser.collegeId) {
      const [col] = await db.select({ id: colleges.id, name: colleges.name, shortName: colleges.shortName })
        .from(colleges).where(eq(colleges.id, dbUser.collegeId)).limit(1);
      if (col) collegeInfo = col;
    }

    return successResponse({
      id: dbUser.id,
      fullName: dbUser.fullName,
      registrationNumber: dbUser.registrationNumber,
      sex: dbUser.sex,
      email: dbUser.email,
      isActive: dbUser.isActive,
      roles: roleRows.map((r) => ({ id: r.id, name: r.name })),
      roleId: primary?.id ?? null,
      roleName: primary?.name ?? null,
      collegeId: collegeInfo?.id || dbUser.collegeId,
      college: collegeInfo,
      programmeId: dbUser.programmeId,
      programme: programmeInfo,
      yearOfStudy: dbUser.yearOfStudy,
      currentSemester: dbUser.currentSemester,
      avatarUrl: dbUser.avatarUrl,
      phoneNumber: dbUser.phoneNumber,
      createdAt: dbUser.createdAt,
    });
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    const resolvedParams = await params;
    const userId = resolvedParams.id === "me" ? auth.user.userId : resolvedParams.id;

    if (auth.user.userId !== userId) {
      const hasPerm = await checkPermission(auth.user.roleIds, "user.update");
      if (!hasPerm) return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

    // Only admins can change roleId or isActive
    const isAdmin = await checkPermission(auth.user.roleIds, "role.update");
    if (!isAdmin && validation.data.isActive !== undefined) {
      return errorResponse("Action not allowed", 403);
    }

    if (validation.data.email) {
      const existing = await db.select().from(users).where(and(eq(users.email, validation.data.email), ne(users.id, userId))).limit(1);
      if (existing.length > 0) return errorResponse("Email already taken", 409);
    }

    const [updatedUser] = await db
      .update(users)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning({ id: users.id, fullName: users.fullName, email: users.email });

    if (!updatedUser) return errorResponse("User not found", 404);

    await logAction({
      userId: auth.user.userId,
      action: "UPDATE_USER",
      entity: "USER",
      entityId: userId,
      ipAddress: req.headers.get("x-forwarded-for") || "Unknown",
    });

    return successResponse(updatedUser, "User updated successfully");
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);

    const hasPerm = await checkPermission(auth.user.roleIds, "user.delete");
    if (!hasPerm) return errorResponse("Forbidden", 403);

    const resolvedParams = await params;
    const userId = resolvedParams.id === "me" ? auth.user.userId : resolvedParams.id;

    const [deletedUser] = await db
      .update(users)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning({ id: users.id });

    if (!deletedUser) return errorResponse("User not found or already deleted", 404);

    await logAction({ userId: auth.user.userId, action: "DELETE_USER", entity: "USER", entityId: userId });

    return successResponse(null, "User deleted successfully");
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}
