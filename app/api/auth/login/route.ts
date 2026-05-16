import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, roles, userRoles } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { loginSchema } from "@/lib/validators/auth";
import { comparePassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Validation failed", 400, validation.error.format());
    }

    const { email, password } = validation.data;

    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        isActive: users.isActive,
        fullName: users.fullName,
      })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
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
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown",
      userAgent: req.headers.get("user-agent") || "Unknown",
    });

    return successResponse(
      {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
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
