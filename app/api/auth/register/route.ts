import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, roles, userRoles } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { registerSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/password";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Validation failed", 400, validation.error.format());
    }

    const data = validation.data;

    const existingUserResult = await db
      .select()
      .from(users)
      .where(or(eq(users.email, data.email), eq(users.registrationNumber, data.registrationNumber)))
      .limit(1);

    if (existingUserResult.length > 0) {
      return errorResponse("Email or Registration Number already exists", 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const studentRoleResult = await db.select().from(roles).where(eq(roles.name, "student")).limit(1);
    const studentRole = studentRoleResult[0];

    if (!studentRole) {
      return errorResponse("Default student role not found. Contact administrator.", 500);
    }

    const [newUser] = await db
      .insert(users)
      .values({
        fullName: data.fullName,
        registrationNumber: data.registrationNumber,
        sex: data.sex,
        email: data.email,
        password: hashedPassword,
        ...(data.collegeId != null && { collegeId: data.collegeId }),
        programmeId: data.programmeId,
        yearOfStudy: data.yearOfStudy,
        isActive: true,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        registrationNumber: users.registrationNumber,
        email: users.email,
        programmeId: users.programmeId,
        yearOfStudy: users.yearOfStudy,
        createdAt: users.createdAt,
      });

    await db.insert(userRoles).values({
      userId: newUser.id,
      roleId: studentRole.id,
    });

    await logAction({
      userId: newUser.id,
      action: "CREATE_USER",
      entity: "USER",
      entityId: newUser.id,
      metadata: { registration: true },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown",
      userAgent: req.headers.get("user-agent") || "Unknown",
    });

    return successResponse(
      {
        ...newUser,
        roles: [{ id: studentRole.id, name: studentRole.name }],
      },
      "User registered successfully",
      201,
    );
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse("Internal server error", 500);
  }
}
