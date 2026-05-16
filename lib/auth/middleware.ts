import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./jwt";
import { db } from "../db";
import { users, roles, rolePermissions, permissions, userRoles } from "../db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { errorResponse } from "../utils/api-response";

/** User context after auth — `roleIds` and `roleNames` always loaded from DB (active assignments only). */
export type AuthenticatedUser = {
  userId: string;
  email: string;
  roleIds: string[];
  roleNames: string[];
  isActive: boolean;
};

export interface AuthResult {
  user?: AuthenticatedUser;
  error?: string;
  status?: number;
}

export interface AuthContext {
  user: AuthenticatedUser;
}

type RouteContext = { params: Promise<Record<string, string>> };
type AuthenticatedHandler = (
  req: NextRequest,
  ctx: RouteContext & AuthContext,
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }
    return handler(req, { ...ctx, user: auth.user });
  };
}

export function withPermission(handler: AuthenticatedHandler, permissionName: string) {
  return withAuth(async (req, ctx) => {
    const hasPerm = await checkPermission(ctx.user.roleIds, permissionName);
    if (!hasPerm) return errorResponse("Forbidden. Missing required permission.", 403);
    return handler(req, ctx);
  });
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing or invalid authorization header", status: 401 };
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return { error: "Invalid or expired token", status: 401 };
    }

    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    const user = userResult[0];

    if (!user || user.deletedAt) {
      return { error: "User no longer exists", status: 401 };
    }

    if (!user.isActive) {
      return { error: "User account is inactive", status: 403 };
    }

    return { user: { ...decoded, roleId: user.roleId, isActive: user.isActive } };
  } catch (error) {
    return { error: "Authentication failed", status: 500 };
  }
}

export async function checkPermission(roleIds: string[], permissionName: string): Promise<boolean> {
  if (roleIds.length === 0) return false;

  const result = await db
    .select({ id: rolePermissions.id })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(inArray(rolePermissions.roleId, roleIds), eq(permissions.name, permissionName)))
    .limit(1);

  return result.length > 0;
}
