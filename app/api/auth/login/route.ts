import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, roles, userRoles } from "@/lib/db/schema";
import { eq, and, isNull, or, sql } from "drizzle-orm";
import { loginSchema } from "@/lib/validators/auth";
import { comparePassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";
import {
  isLikelyEmail,
  normalizeEmail,
  normalizeRegNumber,
} from "@/lib/utils/student-identity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        validation.error.issues[0]?.message || "Validation failed",
        400,
        validation.error.format(),
      );
    }

    const { password } = validation.data;
    const rawId = (
      validation.data.identifier ||
      validation.data.email ||
      ""
    ).trim();

    if (!rawId) {
      return errorResponse("Email or registration number is required", 400);
    }

    const byEmail = isLikelyEmail(rawId);
    const identifier = byEmail
      ? normalizeEmail(rawId)
      : normalizeRegNumber(rawId);

    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        isActive: users.isActive,
        fullName: users.fullName,
        emailVerifiedAt: users.emailVerifiedAt,
        registrationNumber: users.registrationNumber,
      })
      .from(users)
      .where(
        and(
          byEmail
            ? sql`lower(${users.email}) = ${identifier}`
            : or(
                eq(users.registrationNumber, identifier),
                sql`lower(${users.registrationNumber}) = ${identifier.toLowerCase()}`,
              ),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return errorResponse("Invalid credentials", 401);
    }

    if (!user.isActive) {
      return errorResponse("Account is suspended or inactive", 403);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return errorResponse("Invalid credentials", 401);
    }

    // New self-registered users must verify email before login.
    // Grandfathered users have emailVerifiedAt set from migration.
    if (!user.emailVerifiedAt) {
      return errorResponse(
        "Verify your email before logging in. Check your inbox for the code, or resend it from the verification screen.",
        403,
        {
          code: "EMAIL_NOT_VERIFIED",
          email: user.email,
        },
      );
    }

    const roleRows = await db
      .select({ id: roles.id, name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(userRoles.userId, user.id), isNull(userRoles.revokedAt)));

    const roleIds = roleRows.map((r) => r.id);

    const token = signToken({
      userId: user.id,
      email: user.email,
      roleIds,
    });

    await logAction({
      userId: user.id,
      action: "LOGIN",
      entity: "USER",
      entityId: user.id,
      ipAddress:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "Unknown",
      userAgent: req.headers.get("user-agent") || "Unknown",
    });

    return successResponse(
      {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          registrationNumber: user.registrationNumber,
          roles: roleRows.map((r) => ({ id: r.id, name: r.name })),
        },
      },
      "Login successful",
      200,
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
