import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  announcements,
  announcementAudiences,
  announcementMedia,
  users,
  roles,
  categories,
  media,
  userRoles,
} from "@/lib/db/schema";
import { eq, and, or, isNull, desc, ilike, inArray, sql, ne } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";
import { createAnnouncementSchema } from "@/lib/validators/announcements";
import { generateSlug } from "@/lib/utils/slug";
import { logAction } from "@/lib/audit";
import { notifyUsers } from "@/lib/notifications/send";

export const GET = withAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const { page, pageSize, offset } = parsePagination(searchParams);
  const typeFilter = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");
  const isForYou = searchParams.get("isForYou") === "true";

  const userId = ctx.user.userId;

  const [userBasic] = await db
    .select({
      collegeId: users.collegeId,
      programmeId: users.programmeId,
      yearOfStudy: users.yearOfStudy,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!userBasic) return errorResponse("User not found", 404);

  const rolesForUser = await db
    .select({ name: roles.name, collegeId: userRoles.collegeId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt)));

  const roleNames = rolesForUser.map((r) => r.name);
  const roleCollegeId = rolesForUser.find((r) => r.collegeId !== null)?.collegeId ?? null;
  const userProfile = { ...userBasic, roleNames, roleCollegeId };

  const isAdminOrStaff = roleNames.includes("admin") || roleNames.includes("staff");

  const conditions = [isNull(announcements.deletedAt)];

  if (!isAdminOrStaff) {

    const audienceConditions = [];

    if (isForYou) {
      if (userProfile.programmeId && userProfile.yearOfStudy) {
        audienceConditions.push(
          and(
            eq(announcementAudiences.targetType, "PROGRAMME_YEAR"),
            eq(announcementAudiences.programmeId, userProfile.programmeId),
            eq(announcementAudiences.yearOfStudy, userProfile.yearOfStudy),
          ),
        );
      }
    } else {
      audienceConditions.push(eq(announcementAudiences.targetType, "ALL"));
      if (userProfile.collegeId || userProfile.roleCollegeId) {
        const collegeIds = [userProfile.collegeId, userProfile.roleCollegeId].filter(Boolean) as string[];
        audienceConditions.push(
          and(eq(announcementAudiences.targetType, "COLLEGE"), inArray(announcementAudiences.collegeId, collegeIds)),
        );
      }
      if (userProfile.programmeId) {
        audienceConditions.push(
          and(eq(announcementAudiences.targetType, "PROGRAMME"), eq(announcementAudiences.programmeId, userProfile.programmeId)),
        );
        if (userProfile.yearOfStudy) {
          audienceConditions.push(
            and(
              eq(announcementAudiences.targetType, "PROGRAMME_YEAR"),
              eq(announcementAudiences.programmeId, userProfile.programmeId),
              eq(announcementAudiences.yearOfStudy, userProfile.yearOfStudy),
            ),
          );
        }
      }
      if (roleNames.length > 0) {
        audienceConditions.push(and(eq(announcementAudiences.targetType, "ROLE"), inArray(announcementAudiences.roleTarget, roleNames)));
      }
    }

    if (audienceConditions.length === 0) {
      return paginatedResponse([], 0, page, pageSize);
    }

    const matchingAnnouncementIds = db
      .select({ id: announcementAudiences.announcementId })
      .from(announcementAudiences)
      .where(or(...audienceConditions));

    conditions.push(
      or(
        eq(announcements.authorId, userId),
        and(inArray(announcements.id, matchingAnnouncementIds), eq(announcements.status, "PUBLISHED"))
      )
    );
  }

  if (typeFilter) conditions.push(eq(announcements.type, typeFilter));
  if (categoryId) conditions.push(eq(announcements.categoryId, categoryId));
  if (search) conditions.push(ilike(announcements.title, `%${search}%`));

  const whereClause = and(...conditions);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(announcements)
    .where(whereClause);
  const total = Number(totalResult[0].count);

  const list = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      slug: announcements.slug,
      excerpt: announcements.excerpt,
      type: announcements.type,
      status: announcements.status,
      isPinned: announcements.isPinned,
      viewCount: announcements.viewCount,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
      authorId: users.id,
      authorName: users.fullName,
      authorAvatarUrl: users.avatarUrl,
      categoryId: categories.id,
      categoryName: categories.name,
      coverImageId: media.id,
      coverImageUrl: media.url,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.authorId, users.id))
    .leftJoin(categories, eq(announcements.categoryId, categories.id))
    .leftJoin(media, eq(announcements.coverImageId, media.id))
    .where(whereClause)
    .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt), desc(announcements.createdAt))
    .limit(pageSize)
    .offset(offset);

  const data = list.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    type: a.type,
    status: a.status,
    isPinned: a.isPinned,
    viewCount: a.viewCount,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
    author: { id: a.authorId, fullName: a.authorName, avatarUrl: a.authorAvatarUrl },
    category: a.categoryId ? { id: a.categoryId, name: a.categoryName } : null,
    coverImage: a.coverImageUrl ? { id: a.coverImageId, url: a.coverImageUrl } : null,
  }));

  return paginatedResponse(data, total, page, pageSize);
});

export const POST = withPermission(async (req, ctx) => {
  const body = await req.json();
  const validation = createAnnouncementSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const d = validation.data;
  const slug = generateSlug(d.title);

  const existing = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.slug, slug))
    .limit(1);
  if (existing.length > 0) return errorResponse("An announcement with a similar title already exists", 409);

  const isPublishing = d.status === "PUBLISHED";
  const publishedAt = isPublishing ? new Date() : null;

  const [created] = await db.transaction(async (tx) => {
    const [ann] = await tx
      .insert(announcements)
      .values({
        title: d.title,
        slug,
        content: d.content,
        excerpt: d.excerpt || null,
        type: d.type,
        status: d.status,
        authorId: ctx.user.userId,
        categoryId: d.categoryId || null,
        coverImageId: d.coverImageId || null,
        academicYearId: d.academicYearId || null,
        publishedAt,
      })
      .returning();

    const audienceRows = d.audiences.map((a) => ({
      announcementId: ann.id,
      targetType: a.targetType,
      collegeId: a.collegeId || null,
      programmeId: a.programmeId || null,
      yearOfStudy: a.yearOfStudy || null,
      semester: a.semester || null,
      roleTarget: a.roleTarget || null,
    }));
    await tx.insert(announcementAudiences).values(audienceRows);

    if (d.mediaIds && d.mediaIds.length > 0) {
      await tx.insert(announcementMedia).values(d.mediaIds.map((mId) => ({ announcementId: ann.id, mediaId: mId })));
    }

    return [ann];
  });

  await logAction({
    userId: ctx.user.userId,
    action: "CREATE_ANNOUNCEMENT",
    entity: "ANNOUNCEMENT",
    entityId: created.id,
    metadata: { title: d.title, type: d.type, status: d.status },
  });

  if (isPublishing) {
    const targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(ne(users.id, ctx.user.userId));

    if (targetUsers.length > 0) {
      await notifyUsers(targetUsers.map((u) => u.id), {
        title: "New Announcement",
        body: d.title,
        type: "announcement",
        targetId: created.id,
      });
    }
  }

  return successResponse(created, "Announcement created successfully", 201);
}, "announcement.create");
