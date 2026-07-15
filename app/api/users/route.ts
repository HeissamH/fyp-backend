import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, roles, userRoles } from "@/lib/db/schema";
import { eq, ilike, or, and, desc, isNull, inArray, sql } from "drizzle-orm";
import { authenticateRequest, checkPermission, withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";
import { hashPassword } from "@/lib/auth/password";
import { adminCreateUserSchema } from "@/lib/validators/users";
import { logAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }

    const hasPermission = await checkPermission(auth.user.roleIds, "user.read");
    if (!hasPermission) {
      return errorResponse("Forbidden. Missing required permission.", 403);
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const { page, pageSize, offset } = parsePagination(searchParams);
    const qsSearch = searchParams.get("search") || "";
    const roleFilterId = searchParams.get("roleId");

    const conditions: ReturnType<typeof and>[] = [isNull(users.deletedAt)];

    if (qsSearch) {
      const orCond = or(ilike(users.fullName, `%${qsSearch}%`), ilike(users.registrationNumber, `%${qsSearch}%`), ilike(users.email, `%${qsSearch}%`));
      if (orCond) conditions.push(orCond);
    }

    if (roleFilterId) {
      const userIdsHavingRoleSub = db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(and(eq(userRoles.roleId, roleFilterId), isNull(userRoles.revokedAt)));
      conditions.push(inArray(users.id, userIdsHavingRoleSub));
    }

    const whereClause = and(...conditions);

    const totalRecordsResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
    const totalRecords = Number(totalRecordsResult[0].count);

    const usersList = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        registrationNumber: users.registrationNumber,
        sex: users.sex,
        email: users.email,
        isActive: users.isActive,
        programmeId: users.programmeId,
        yearOfStudy: users.yearOfStudy,
        currentSemester: users.currentSemester,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    const ids = usersList.map((u) => u.id);
    const roleRows =
      ids.length === 0
        ? []
        : await db
            .select({ userId: userRoles.userId, roleId: roles.id, roleName: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(and(inArray(userRoles.userId, ids), isNull(userRoles.revokedAt)));

    const rolesByUser = new Map<string, { id: string; name: string }[]>();
    for (const r of roleRows) {
      const list = rolesByUser.get(r.userId) ?? [];
      list.push({ id: r.roleId, name: r.roleName });
      rolesByUser.set(r.userId, list);
    }

    const withRoles = usersList.map((u) => ({
      ...u,
      roles: rolesByUser.get(u.id) ?? [],
    }));

    return paginatedResponse(withRoles, totalRecords, page, pageSize);
  } catch (error) {
    console.error("Users list error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export const POST = withPermission(async (req: NextRequest, ctx) => {
  try {
    const body = await req.json();
    const validation = adminCreateUserSchema.safeParse(body);
    if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

    const data = validation.data;

    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, data.email),
          data.registrationNumber ? eq(users.registrationNumber, data.registrationNumber) : sql`false`
        )
      )
      .limit(1);

    if (existingUser.length > 0) return errorResponse("Email or Registration Number already exists", 409);

    const hashedPassword = await hashPassword(data.password);

    const [newUser] = await db
      .insert(users)
      .values({
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        registrationNumber: data.registrationNumber || `N/A-${Date.now()}`,
        sex: data.sex || "FEMALE",
        collegeId: data.collegeId,
        departmentId: data.departmentId,
        programmeId: data.programmeId,
        yearOfStudy: data.yearOfStudy,
        isActive: true,
      })
      .returning();

    if (data.roleIds && data.roleIds.length > 0) {
      const roleInserts = data.roleIds.map(roleId => ({
        userId: newUser.id,
        roleId: roleId,
        assignedBy: ctx.user.userId,
      }));
      await db.insert(userRoles).values(roleInserts);
    }

    await logAction({
      userId: ctx.user.userId,
      action: "CREATE_USER",
      entity: "USER",
      entityId: newUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "Unknown",
      userAgent: req.headers.get("user-agent") || "Unknown",
    });

    return successResponse(newUser, "User created successfully", 201);
  } catch (error) {
    console.error("User creation error:", error);
    return errorResponse("Internal server error", 500);
  }
}, "user.create");
