import { db } from "@/lib/db";
import { userNotificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateNotificationPreferencesSchema } from "@/lib/validators/notifications";

export const GET = withAuth(async (_req, ctx) => {
  const [prefs] = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, ctx.user.userId))
    .limit(1);

  return successResponse(
    prefs ?? { userId: ctx.user.userId, posts: true },
    "Preferences retrieved",
  );
});

export const PUT = withAuth(async (req, ctx) => {
  const body = await req.json();
  const validation = updateNotificationPreferencesSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const d = validation.data;
  const now = new Date();

  const [saved] = await db
    .insert(userNotificationPreferences)
    .values({
      userId: ctx.user.userId,
      posts: d.posts ?? true,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userNotificationPreferences.userId,
      set: {
        ...(d.posts !== undefined ? { posts: d.posts } : {}),
        updatedAt: now,
      },
    })
    .returning();

  return successResponse(saved, "Preferences updated");
});
