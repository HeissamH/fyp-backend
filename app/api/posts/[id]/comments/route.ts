import { db } from "@/lib/db";
import { comments, users, posts } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { createCommentSchema } from "@/lib/validators/comments";
import { logAction } from "@/lib/audit";

export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;

  const p = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1);
  if (p.length === 0) return errorResponse("Post not found", 404);

  const list = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      authorId: users.id,
      authorName: users.fullName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(
      and(
        eq(comments.targetId, id),
        eq(comments.targetType, "POST"),
        isNull(comments.deletedAt),
      ),
    )
    .orderBy(desc(comments.createdAt));

  return successResponse(list);
});

export const POST = withAuth(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const validation = createCommentSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const p = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1);
  if (p.length === 0) return errorResponse("Post not found", 404);

  const [created] = await db
    .insert(comments)
    .values({
      authorId: ctx.user.userId,
      targetId: id,
      targetType: "POST",
      content: validation.data.content,
    })
    .returning();

  await logAction({
    userId: ctx.user.userId,
    action: "CREATE_COMMENT",
    entity: "COMMENT",
    entityId: created.id,
    metadata: { targetId: id, targetType: "POST" },
  });

  const [withAuthor] = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      authorId: users.id,
      authorName: users.fullName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.id, created.id));

  return successResponse(withAuthor, "Comment posted successfully", 201);
});
