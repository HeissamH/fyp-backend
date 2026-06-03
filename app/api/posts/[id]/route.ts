import { db } from "@/lib/db";
import { posts, postAudiences, users, media, reactions, comments, userRoles, roles } from "@/lib/db/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updatePostSchema } from "@/lib/validators/posts";
import { logAction } from "@/lib/audit";
import { after } from "next/server";
import { notifyPostPublished } from "@/lib/notifications/notify-post-published";
import {
  getActiveGroupIdsForUser,
  getUserPostProfile,
  buildPostAudienceConditions,
  matchingPostIdsSubquery,
} from "@/lib/utils/post-audience";

async function canViewPost(
  userId: string,
  post: { id: string; authorId: string; status: string },
  profile: NonNullable<Awaited<ReturnType<typeof getUserPostProfile>>>,
): Promise<boolean> {
  if (profile.roleNames.includes("admin") || profile.roleNames.includes("staff")) return true;
  if (post.authorId === userId) return true;
  if (post.status !== "PUBLISHED") return false;

  const groupIds = await getActiveGroupIdsForUser(userId);
  const audienceConditions = buildPostAudienceConditions(profile, groupIds);
  const matchSub = matchingPostIdsSubquery(audienceConditions);

  const [row] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, post.id), inArray(posts.id, matchSub)))
    .limit(1);

  return !!row;
}

export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const userId = ctx.user.userId;
  const profile = await getUserPostProfile(userId);
  if (!profile) return errorResponse("User not found", 404);

  const [row] = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      status: posts.status,
      isPinned: posts.isPinned,
      viewCount: posts.viewCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorName: users.fullName,
      mediaId: media.id,
      mediaUrl: media.url,
      likeCount: sql<number>`CAST((SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'POST') AS INT)`,
      commentCount: sql<number>`CAST((SELECT count(*) FROM ${comments} WHERE ${comments.targetId} = ${posts.id} AND ${comments.targetType} = 'ANNOUNCEMENT') AS INT)`,
      isLiked: sql<boolean>`EXISTS(SELECT 1 FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'POST' AND ${reactions.userId} = ${userId})`,
      roleName: sql<string>`(SELECT r.name FROM ${userRoles} ur JOIN ${roles} r ON ur.role_id = r.id WHERE ur.user_id = ${users.id} AND ur.revoked_at IS NULL ORDER BY r.name ASC LIMIT 1)`,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(media, eq(posts.mediaId, media.id))
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1);

  if (!row) return errorResponse("Post not found", 404);

  const allowed = await canViewPost(userId, { id: row.id, authorId: row.authorId, status: row.status }, profile);
  if (!allowed) return errorResponse("Post not found", 404);

  db.update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, id))
    .execute()
    .catch(() => {});

  return successResponse({
    id: row.id,
    title: row.title,
    content: row.content,
    type: row.type,
    status: row.status,
    isPinned: row.isPinned,
    viewCount: row.viewCount,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    isLiked: row.isLiked,
    author: { id: row.authorId, fullName: row.authorName, roles: row.roleName ? [{ name: row.roleName }] : [] },
    media: row.mediaUrl ? { id: row.mediaId, url: row.mediaUrl } : null,
  });
});

export const PUT = withPermission(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const validation = updatePostSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const existing = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1);
  if (existing.length === 0) return errorResponse("Post not found", 404);

  const d = validation.data;
  let publishedAt: Date | undefined | null = undefined;
  if (d.status === "PUBLISHED" && existing[0].status !== "PUBLISHED") {
    publishedAt = new Date();
  }

  const updated = await db.transaction(async (tx) => {
    const [post] = await tx
      .update(posts)
      .set({
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.content !== undefined ? { content: d.content } : {}),
        ...(d.type !== undefined ? { type: d.type } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.mediaId !== undefined ? { mediaId: d.mediaId } : {}),
        ...(publishedAt !== undefined ? { publishedAt } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .returning();

    if (!post) return null;

    if (d.audiences && d.audiences.length > 0) {
      await tx.delete(postAudiences).where(eq(postAudiences.postId, id));
      await tx.insert(postAudiences).values(
        d.audiences.map((a) => ({
          postId: id,
          targetType: a.targetType,
          collegeId: a.collegeId ?? null,
          departmentId: a.departmentId ?? null,
          programmeId: a.programmeId ?? null,
          yearOfStudy: a.yearOfStudy ?? null,
          roleTarget: a.roleTarget ?? null,
          groupId: a.groupId ?? null,
        })),
      );
    }
    return post;
  });

  if (!updated) return errorResponse("Post not found", 404);

  await logAction({
    userId: ctx.user.userId,
    action: "UPDATE_POST",
    entity: "POST",
    entityId: id,
  });

  if (publishedAt !== undefined && publishedAt !== null) {
    after(() => notifyPostPublished(id));
  }

  return successResponse(updated, "Post updated successfully");
}, "post.update");

export const DELETE = withPermission(async (_req, ctx) => {
  const { id } = await ctx.params;

  const [deleted] = await db
    .update(posts)
    .set({ deletedAt: new Date() })
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .returning({ id: posts.id });

  if (!deleted) return errorResponse("Post not found", 404);

  await logAction({
    userId: ctx.user.userId,
    action: "DELETE_POST",
    entity: "POST",
    entityId: id,
  });

  return successResponse(null, "Post deleted successfully");
}, "post.delete");
