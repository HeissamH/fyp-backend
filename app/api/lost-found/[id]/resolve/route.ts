import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { lostFoundItems } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";

export const POST = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;

  const [existing] = await db
    .select({ reporterId: lostFoundItems.reporterId, status: lostFoundItems.status })
    .from(lostFoundItems)
    .where(and(eq(lostFoundItems.id, id), isNull(lostFoundItems.deletedAt)))
    .limit(1);
  if (!existing) return errorResponse("Item not found", 404);
  if (existing.status === "RESOLVED") return errorResponse("Item is already resolved", 400);

  const isAdmin = ctx.user.roleNames.includes("admin");
  if (existing.reporterId !== ctx.user.userId && !isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  await db.update(lostFoundItems).set({ status: "RESOLVED", resolvedAt: new Date(), updatedAt: new Date() }).where(eq(lostFoundItems.id, id));

  await logAction({ userId: ctx.user.userId, action: "RESOLVE_LOST_FOUND", entity: "LOST_FOUND", entityId: id });
  return successResponse(null, "Item marked as resolved");
});
