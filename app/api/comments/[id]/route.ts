import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateCommentSchema } from "@/lib/validators/comments";
import { logAction } from "@/lib/audit";

// ─── PATCH /api/comments/[id] ────────────────────────────────────────────────
export const PATCH = withAuth(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();

  const validation = updateCommentSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse("Validation failed", 400, validation.error.format());
  }

  const [existing] = await db
    .select({ authorId: comments.authorId })
    .from(comments)
    .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
    .limit(1);

  if (!existing) return errorResponse("Comment not found", 404);

  const isAdmin = ctx.user.roleNames.includes("admin");
  if (existing.authorId !== ctx.user.userId && !isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  await db
    .update(comments)
    .set({ content: validation.data.content, updatedAt: new Date() })
    .where(eq(comments.id, id));

  await logAction({
    userId: ctx.user.userId,
    action: "UPDATE_COMMENT",
    entity: "COMMENT",
    entityId: id,
  });

  return successResponse(null, "Comment updated successfully");
});

// ─── DELETE /api/comments/[id] ───────────────────────────────────────────────
export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;

  const [existing] = await db
    .select({ authorId: comments.authorId })
    .from(comments)
    .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
    .limit(1);

  if (!existing) return errorResponse("Comment not found", 404);

  const isAdmin = ctx.user.roleNames.includes("admin");
  if (existing.authorId !== ctx.user.userId && !isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  // Soft-delete; cascade handles deleting child replies via DB FK
  await db
    .update(comments)
    .set({ deletedAt: new Date() })
    .where(eq(comments.id, id));

  await logAction({
    userId: ctx.user.userId,
    action: "DELETE_COMMENT",
    entity: "COMMENT",
    entityId: id,
  });

  return successResponse(null, "Comment deleted");
});
