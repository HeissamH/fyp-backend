import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { resolveRecipientUserIds } from "@/lib/utils/post-recipients";
import { notifyUsers } from "@/lib/notifications/send";
import { NOTIFICATION_TYPES, buildNotificationPayload } from "@/lib/notifications/types";

function excerpt(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Fan-out inbox + push when a post is published. Safe to call async after HTTP response. */
export async function notifyPostPublished(postId: string): Promise<void> {
  try {
    const [post] = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        status: posts.status,
        authorId: posts.authorId,
      })
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
      .limit(1);

    if (!post || post.status !== "PUBLISHED") return;

    const userIds = await resolveRecipientUserIds(postId, { excludeUserId: post.authorId });
    if (userIds.length === 0) return;

    const body = post.title?.trim() ? post.title.trim() : excerpt(post.content);

    await notifyUsers(
      userIds,
      buildNotificationPayload({
        title: "New post",
        body,
        type: NOTIFICATION_TYPES.POST,
        targetId: post.id,
      }),
    );
  } catch (err) {
    console.error(`notifyPostPublished failed for ${postId}:`, err);
  }
}
