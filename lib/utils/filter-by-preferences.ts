import { db } from "@/lib/db";
import { userNotificationPreferences } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export type NotificationPreferenceKey = "posts" | "announcements" | "stories" | "lostFound";

function preferenceColumn(key: NotificationPreferenceKey) {
  switch (key) {
    case "posts":
      return userNotificationPreferences.posts;
    case "announcements":
      return userNotificationPreferences.announcements;
    case "stories":
      return userNotificationPreferences.stories;
    case "lostFound":
      return userNotificationPreferences.lostFound;
  }
}

/** Remove users who opted out of a given notification category. */
export async function filterByPreferences(
  userIds: string[],
  preferenceKey: NotificationPreferenceKey,
): Promise<string[]> {
  if (userIds.length === 0) return [];

  const column = preferenceColumn(preferenceKey);
  const optedOut = await db
    .select({ userId: userNotificationPreferences.userId })
    .from(userNotificationPreferences)
    .where(and(inArray(userNotificationPreferences.userId, userIds), eq(column, false)));

  const optedOutSet = new Set(optedOut.map((r) => r.userId));
  return userIds.filter((id) => !optedOutSet.has(id));
}