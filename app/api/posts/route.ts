import { db } from "@/lib/db";
import { posts, postAudiences, users, media, reactions, comments } from "@/lib/db/schema";
import { eq, and, isNull, desc, ilike, inArray, sql } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";
import { createPostSchema } from "@/lib/validators/posts";
import { logAction } from "@/lib/audit";
import {
  getActiveGroupIdsForUser,
  getUserPostProfile,
  buildPostAudienceConditions,
  matchingPostIdsSubquery,
} from "@/lib/utils/post-audience";

export const GET = withAuth(async (req, ctx) => {
  const { page, pageSize, offset } = parsePagination(new URL(req.url).searchParams);
  const search = new URL(req.url).searchParams.get("search");

  const userId = ctx.user.userId;
  const profile = await getUserPostProfile(userId);
  if (!profile) return errorResponse("User not found", 404);

  const isAdminOrStaff =
    profile.roleNames.includes("admin") || profile.roleNames.includes("staff");

  const conditions = [isNull(posts.deletedAt)];

  if (!isAdminOrStaff) {
    const groupIds = await getActiveGroupIdsForUser(userId);
    const audienceConditions = buildPostAudienceConditions(profile, groupIds);
    const matchSub = matchingPostIdsSubquery(audienceConditions);
    conditions.push(inArray(posts.id, matchSub));
    conditions.push(eq(posts.status, "PUBLISHED"));
  }

  if (search) conditions.push(ilike(posts.title, `%${search}%`));

  const whereClause = and(...conditions);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(whereClause);
  const total = Number(totalResult[0].count);

  const list = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      status: posts.status,
      isPinned: posts.isPinned,
      viewCount: posts.viewCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.fullName,
      mediaId: media.id,
      mediaUrl: media.url,
      likeCount: sql<number>`CAST((SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'POST') AS INT)`,
      commentCount: sql<number>`CAST((SELECT count(*) FROM ${comments} WHERE ${comments.targetId} = ${posts.id} AND ${comments.targetType} = 'ANNOUNCEMENT') AS INT)`,
      isLiked: sql<boolean>`EXISTS(SELECT 1 FROM ${reactions} WHERE ${reactions.targetId} = ${posts.id} AND ${reactions.targetType} = 'POST' AND ${reactions.userId} = ${userId})`,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(media, eq(posts.mediaId, media.id))
    .where(whereClause)
    .orderBy(desc(posts.isPinned), desc(posts.publishedAt), desc(posts.createdAt))
    .limit(pageSize)
    .offset(offset);

  const data = list.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    type: p.type,
    status: p.status,
    isPinned: p.isPinned,
    viewCount: p.viewCount,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    isLiked: p.isLiked,
    author: { id: p.authorId, fullName: p.authorName },
    media: p.mediaUrl ? { id: p.mediaId, url: p.mediaUrl } : null,
  }));

  return paginatedResponse(data, total, page, pageSize);
});

export const POST = withPermission(async (req, ctx) => {
  const body = await req.json();
  const validation = createPostSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const d = validation.data;
  const isPublishing = d.status === "PUBLISHED";
  const publishedAt = isPublishing ? new Date() : null;

  const [created] = await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(posts)
      .values({
        title: d.title ?? null,
        content: d.content,
        type: d.type,
        status: d.status,
        authorId: ctx.user.userId,
        mediaId: d.mediaId ?? null,
        publishedAt,
      })
      .returning();

    const audienceRows = d.audiences.map((a) => ({
      postId: post.id,
      targetType: a.targetType,
      collegeId: a.collegeId ?? null,
      departmentId: a.departmentId ?? null,
      programmeId: a.programmeId ?? null,
      yearOfStudy: a.yearOfStudy ?? null,
      roleTarget: a.roleTarget ?? null,
      groupId: a.groupId ?? null,
    }));
    await tx.insert(postAudiences).values(audienceRows);
    return [post];
  });

  await logAction({
    userId: ctx.user.userId,
    action: "CREATE_POST",
    entity: "POST",
    entityId: created.id,
    metadata: { type: d.type, status: d.status },
  });

  return successResponse(created, "Post created successfully", 201);
}, "post.create");
