import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export const PUT = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, ctx.user.userId)))
    .returning({ id: notifications.id });

  if (!updated) return errorResponse("Notification not found", 404);

  return successResponse(null, "Notification marked as read");
});
