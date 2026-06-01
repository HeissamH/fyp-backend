import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api-response";

export const PUT = withAuth(async (_req, ctx) => {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, ctx.user.userId));

  return successResponse(null, "All notifications marked as read");
});
