import { db } from "@/lib/db";
import { userNotificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateNotificationPreferencesSchema } from "@/lib/validators/notifications";

const DEFAULT_PREFERENCES = {
  posts: true,
  announcements: true,
  stories: true,
  lostFound: true,
};

export const GET = withAuth(async (_req, ctx) => {
  const [prefs] = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, ctx.user.userId))
    .limit(1);

  return successResponse(
    prefs
      ? {
          userId: prefs.userId,
          posts: prefs.posts,
          announcements: prefs.announcements,
          stories: prefs.stories,
          lostFound: prefs.lostFound,
        }
      : { userId: ctx.user.userId, ...DEFAULT_PREFERENCES },
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
      announcements: d.announcements ?? true,
      stories: d.stories ?? true,
      lostFound: d.lostFound ?? true,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userNotificationPreferences.userId,
      set: {
        ...(d.posts !== undefined ? { posts: d.posts } : {}),
        ...(d.announcements !== undefined ? { announcements: d.announcements } : {}),
        ...(d.stories !== undefined ? { stories: d.stories } : {}),
        ...(d.lostFound !== undefined ? { lostFound: d.lostFound } : {}),
        updatedAt: now,
      },
    })
    .returning();

  return successResponse(
    {
      userId: saved.userId,
      posts: saved.posts,
      announcements: saved.announcements,
      stories: saved.stories,
      lostFound: saved.lostFound,
    },
    "Preferences updated",
  );
});