import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { permissions, permissionGroups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    
    const hasPerm = await checkPermission(auth.user.roleIds, "permission.read");
    if (!hasPerm) return errorResponse("Forbidden", 403);

    const resolvedParams = await params;

    const permResult = await db.select({
      id: permissions.id,
      name: permissions.name,
      description: permissions.description,
      groupId: permissions.groupId,
      groupName: permissionGroups.name
    }).from(permissions)
    .leftJoin(permissionGroups, eq(permissions.groupId, permissionGroups.id))
    .where(eq(permissions.id, resolvedParams.id))
    .limit(1);

    if (permResult.length === 0) return errorResponse("Permission not found", 404);
    
    return successResponse(permResult[0]);
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT() { return errorResponse("Permissions are logically immutable.", 403); }
export async function DELETE() { return errorResponse("Permissions are logically immutable.", 403); }
