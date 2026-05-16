import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";

export const DELETE = withAuth(async (_req, ctx) => {
  const { id, commentId } = await ctx.params;
  const userId = ctx.user.userId;

  const [comment] = await db
    .select({ id: comments.id, authorId: comments.authorId })
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.targetId, id), eq(comments.targetType, "LOST_FOUND"), isNull(comments.deletedAt)))
    .limit(1);

  if (!comment) return errorResponse("Comment not found", 404);

  const isAdmin = ctx.user.roleNames.includes("admin");
  if (comment.authorId !== userId && !isAdmin) return errorResponse("Forbidden", 403);

  await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, commentId));
  await logAction({ userId, action: "DELETE_COMMENT", entity: "COMMENT", entityId: commentId });
  return successResponse(null, "Comment deleted");
});
