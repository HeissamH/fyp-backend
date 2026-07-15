import { db } from "@/lib/db";
import { posts, postAudiences, users, media, reactions, comments, userRoles, roles } from "@/lib/db/schema";
import { eq, and, or, isNull, desc, ilike, inArray, sql } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";
import { createPostSchema } from "@/lib/validators/posts";
import { logAction } from "@/lib/audit";
import { notifyPostPublished } from "@/lib/notifications/notify-post-published";
import {
  getActiveGroupIdsForUser,
  getUserPostProfile,
  buildPostAudienceConditions,
  matchingPostIdsSubquery,
  isClassRepresentative,
  isCollegeScopedLeader,
  roleNamesInclude,
} from "@/lib/utils/post-audience";

export const GET = withAuth(async (req, ctx) => {
  const { page, pageSize, offset } = parsePagination(new URL(req.url).searchParams);
  const search = new URL(req.url).searchParams.get("search");
  const authorIdParam = new URL(req.url).searchParams.get("authorId");

  const userId = ctx.user.userId;
  const profile = await getUserPostProfile(userId);
  if (!profile) return errorResponse("User not found", 404);

  const isAdminOrStaff =
    roleNamesInclude(profile.roleNames, "admin", "staff", "super admin");

  const conditions = [isNull(posts.deletedAt)];

  if (!isAdminOrStaff) {
    const groupIds = await getActiveGroupIdsForUser(userId);
    const audienceConditions = buildPostAudienceConditions(profile, groupIds);
    const matchSub = matchingPostIdsSubquery(audienceConditions);

    // Non-admins can see:
    // 1. Any post they authored
    // 2. Or any post that is PUBLISHED AND matches their audience
    conditions.push(
      or(
        eq(posts.authorId, userId),
        and(inArray(posts.id, matchSub), eq(posts.status, "PUBLISHED")),
      )!,
    );
  }

  if (search) conditions.push(ilike(posts.title, `%${search}%`));
  if (authorIdParam) conditions.push(eq(posts.authorId, authorIdParam));

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
      authorAvatarUrl: users.avatarUrl,
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
    author: { id: p.authorId, fullName: p.authorName, avatarUrl: p.authorAvatarUrl, roles: p.roleName ? [{ name: p.roleName }] : [] },
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

  let finalAudiences = d.audiences;
  const profile = await getUserPostProfile(ctx.user.userId);
  const elevated =
    profile && roleNamesInclude(profile.roleNames, "admin", "staff", "super admin");

  if (profile && isClassRepresentative(profile.roleNames) && !elevated) {
    if (!profile.programmeId || profile.yearOfStudy == null) {
      return errorResponse(
        "Class Representatives must have a programme and year of study assigned to their profile.",
        403,
      );
    }
    // Force the target to only their programme & year
    finalAudiences = [
      {
        targetType: "PROGRAMME_YEAR",
        programmeId: profile.programmeId,
        yearOfStudy: profile.yearOfStudy,
      },
    ];
  } else if (profile && isCollegeScopedLeader(profile.roleNames) && !elevated) {
    // Daruso_leader / college rep: role.college_id or profile college (incl. via programme)
    const userCollegeId = profile.roleCollegeId ?? profile.collegeId;
    if (!userCollegeId) {
      return errorResponse(
        "College leaders must have a college assigned to their role or profile.",
        403,
      );
    }
    // Force the target to only their college
    finalAudiences = [
      {
        targetType: "COLLEGE",
        collegeId: userCollegeId,
      },
    ];
  }

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

    const audienceRows = finalAudiences.map((a) => ({
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

  if (isPublishing) {
    // Await push so FCM is not dropped by serverless freeze after response.
    // Campus fan-out is small; typically <1s for one college.
    await notifyPostPublished(created.id);
  }

  return successResponse(created, "Post created successfully", 201);
}, "post.create");
