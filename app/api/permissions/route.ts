import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { permissions, permissionGroups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);

    const hasPerm = await checkPermission(auth.user.roleIds, "permission.read");
    if (!hasPerm) return errorResponse("Forbidden", 403);

    const result = await db.select({
      id: permissions.id,
      name: permissions.name,
      description: permissions.description,
      scope: permissions.scope,
      groupId: permissions.groupId,
      groupName: permissionGroups.name
    })
    .from(permissions)
    .leftJoin(permissionGroups, eq(permissions.groupId, permissionGroups.id));
    
    return successResponse(result);
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  return errorResponse("System permissions are predefined and cannot be created dynamically via API.", 403);
}
