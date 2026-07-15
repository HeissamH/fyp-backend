import { db } from "@/lib/db";
import { reactions, stories } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

/**
 * POST /api/stories/:id/reactions
 * Toggle LIKE on a story (Instagram-style heart).
 */
export const POST = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const userId = ctx.user.userId;

  const story = await db
    .select({ id: stories.id })
    .from(stories)
    .where(
      and(
        eq(stories.id, id),
        isNull(stories.deletedAt),
        gt(stories.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (story.length === 0) {
    return errorResponse("Story not found or expired", 404);
  }

  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(
      and(
        eq(reactions.userId, userId),
        eq(reactions.targetId, id),
        eq(reactions.targetType, "STORY"),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
    return successResponse({ action: "unliked", isLiked: false }, "Reaction removed");
  }

  await db.insert(reactions).values({
    userId,
    targetId: id,
    targetType: "STORY",
    type: "LIKE",
  });

  return successResponse({ action: "liked", isLiked: true }, "Reaction added", 201);
});
