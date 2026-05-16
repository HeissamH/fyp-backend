import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { roles, rolePermissions, userRoles } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateRoleSchema } from "@/lib/validators/roles";
import { logAction } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    
    const hasPerm = await checkPermission(auth.user.roleIds, "role.read");
    if (!hasPerm) return errorResponse("Forbidden", 403);
    
    const resolvedParams = await params;
    const roleId = resolvedParams.id;

    const roleResult = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (roleResult.length === 0) return errorResponse("Role not found", 404);
    
    const roleObj = roleResult[0];

    // Fetch associated permissions
    const perms = await db.select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
      
    return successResponse({
      ...roleObj,
      permissions: perms.map(p => p.permissionId)
    });
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    
    const hasPerm = await checkPermission(auth.user.roleIds, "role.update");
    if (!hasPerm) return errorResponse("Forbidden", 403);

    const resolvedParams = await params;
    const roleId = resolvedParams.id;
    
    const roleResult = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (roleResult.length === 0) return errorResponse("Role not found", 404);
    
    const body = await req.json();
    const isSystemRole = roleResult[0].name === "admin" || roleResult[0].name === "super-admin";
    if (isSystemRole && (body.name || body.description)) {
       return errorResponse("Core system role name/description cannot be changed.", 403);
    }

    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

    await db.transaction(async (tx) => {
      if (Object.keys(validation.data).length > 0) {
        await tx.update(roles)
          .set({ ...validation.data, updatedAt: new Date() })
          .where(eq(roles.id, roleId));
      }

      if (body.permissions && Array.isArray(body.permissions)) {
        // Clear old permissions natively
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
        
        if (body.permissions.length > 0) {
          const permsToAttach = body.permissions.map((permId: string) => ({
            roleId,
            permissionId: permId
          }));
          await tx.insert(rolePermissions).values(permsToAttach);
        }
      }
    });

    await logAction({ userId: auth.user.userId, action: "UPDATE_ROLE", entity: "ROLE", entityId: roleId });
    return successResponse(null, "Role updated successfully");
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    
    const hasPerm = await checkPermission(auth.user.roleIds, "role.delete");
    if (!hasPerm) return errorResponse("Forbidden", 403);

    const resolvedParams = await params;
    const roleId = resolvedParams.id;

    // Check if role is used by users
    const usersCount = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(and(eq(userRoles.roleId, roleId), isNull(userRoles.revokedAt)))
      .limit(1);
    if (usersCount.length > 0) {
      return errorResponse("Cannot delete role. It is currently assigned to one or more users.", 400);
    }
    
    const roleResult = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (roleResult.length === 0) return errorResponse("Role not found", 404);
    
    if (roleResult[0].name === "admin" || roleResult[0].name === "student") {
       return errorResponse("Core system roles cannot be deleted.", 403);
    }

    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      await tx.delete(roles).where(eq(roles.id, roleId));
    });

    await logAction({ userId: auth.user.userId, action: "DELETE_ROLE", entity: "ROLE", entityId: roleId });
    return successResponse(null, "Role deleted successfully");
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}
