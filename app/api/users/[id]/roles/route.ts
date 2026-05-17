import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userRoles, roles } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { assignUserRoleSchema } from "@/lib/validators/user-roles";
import { logAction } from "@/lib/audit";

export const POST = withPermission(async (req: NextRequest, ctx) => {
  const { id: targetUserId } = await ctx.params;

  const body = await req.json();
  const validation = assignUserRoleSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const roleIdToAssign = validation.data.roleId;

  const [roleRow] = await db.select().from(roles).where(eq(roles.id, roleIdToAssign)).limit(1);
  if (!roleRow) return errorResponse("Role not found", 404);

  const existing = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, targetUserId), eq(userRoles.roleId, roleIdToAssign)))
    .limit(1);

  const row = existing[0];

  if (row && row.revokedAt === null) {
    return successResponse(null, "User already has this role", 200);
  }

  if (row) {
    await db
      .update(userRoles)
      .set({
        revokedAt: null,
        assignedBy: ctx.user.userId,
        assignedAt: new Date(),
      })
      .where(eq(userRoles.id, row.id));
  } else {
    await db.insert(userRoles).values({
      userId: targetUserId,
      roleId: roleIdToAssign,
      assignedBy: ctx.user.userId,
    });
  }

  await logAction({
    userId: ctx.user.userId,
    action: "ASSIGN_ROLE",
    entity: "USER_ROLE",
    entityId: targetUserId,
    metadata: { targetUserId, roleId: roleIdToAssign },
    ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown",
    userAgent: req.headers.get("user-agent") || "Unknown",
  });

  return successResponse(null, "Role assigned successfully", 201);
}, "user.update");

export const DELETE = withPermission(async (req: NextRequest, ctx) => {
  const { id: targetUserId } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const validation = assignUserRoleSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const roleIdToRevoke = validation.data.roleId;

  const activeCountRow = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userRoles)
    .where(and(eq(userRoles.userId, targetUserId), isNull(userRoles.revokedAt)));

  const activeCount = Number(activeCountRow[0]?.n ?? 0);

  const [assignment] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, targetUserId), eq(userRoles.roleId, roleIdToRevoke)))
    .limit(1);

  if (!assignment || assignment.revokedAt != null) {
    return errorResponse("User does not have this active role", 404);
  }

  if (activeCount <= 1) {
    return errorResponse("Cannot revoke the user's last remaining role.", 400);
  }

  await db.update(userRoles).set({ revokedAt: new Date() }).where(eq(userRoles.id, assignment.id));

  await logAction({
    userId: ctx.user.userId,
    action: "REVOKE_ROLE",
    entity: "USER_ROLE",
    entityId: targetUserId,
    metadata: { targetUserId, roleId: roleIdToRevoke },
    ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown",
    userAgent: req.headers.get("user-agent") || "Unknown",
  });

  return successResponse(null, "Role revoked successfully", 200);
}, "user.update");
