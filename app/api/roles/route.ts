import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { roles, rolePermissions, permissions, userRoles, users } from "@/lib/db/schema";
import { eq, desc, sql, and, isNull } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { createRoleSchema } from "@/lib/validators/roles";
import { logAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }

    const hasPerm = await checkPermission(auth.user.roleIds, "role.read");
    if (!hasPerm) return errorResponse("Forbidden", 403);

    const rolesList = await db.select().from(roles).orderBy(desc(roles.createdAt));

    // Fetch all role permissions
    const perms = await db.select({
      roleId: rolePermissions.roleId,
      permissionId: rolePermissions.permissionId,
      name: permissions.name,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    const userCounts = await db
      .select({
        roleId: userRoles.roleId,
        count: sql<number>`count(distinct ${userRoles.userId})`,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(and(isNull(userRoles.revokedAt), isNull(users.deletedAt)))
      .groupBy(userRoles.roleId);

    const enrichedRoles = rolesList.map(role => {
      const rolePerms = perms.filter(p => p.roleId === role.id);
      const userCount = userCounts.find(u => u.roleId === role.id)?.count || 0;
      return {
        ...role,
        permissions: rolePerms.map(p => ({ id: p.permissionId, name: p.name })),
        usersCount: Number(userCount)
      };
    });

    return successResponse(enrichedRoles);
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    
    const hasPerm = await checkPermission(auth.user.roleIds, "role.create");
    if (!hasPerm) return errorResponse("Forbidden", 403);

    const body = await req.json();
    const validation = createRoleSchema.safeParse(body);
    if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

    // Check if role name already exists
    const existing = await db.select().from(roles).where(eq(roles.name, validation.data.name)).limit(1);
    if (existing.length > 0) return errorResponse("Role with this name already exists", 409);

    let newRoleId = "";
    let newRoleData = null;

    await db.transaction(async (tx) => {
      const inserted = await tx.insert(roles)
        .values(validation.data)
        .returning();
      newRoleId = inserted[0].id;
      newRoleData = inserted[0];
      
      // If permissions are specified, attach them
      if (body.permissions && Array.isArray(body.permissions) && body.permissions.length > 0) {
        const permsToAttach = body.permissions.map((permId: string) => ({
          roleId: newRoleId,
          permissionId: permId
        }));
        await tx.insert(rolePermissions).values(permsToAttach);
      }
    });

    await logAction({
      userId: auth.user.userId,
      action: "CREATE_ROLE",
      entity: "ROLE",
      entityId: newRoleId,
      ipAddress: req.headers.get("x-real-ip") || "Unknown"
    });

    return successResponse(newRoleData, "Role created successfully", 201);
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}
