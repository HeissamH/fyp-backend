import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  announcements, announcementAudiences, announcementMedia,
  users, categories, media,
} from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateAnnouncementSchema } from "@/lib/validators/announcements";
import { logAction } from "@/lib/audit";

export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;

  const result = await db.select({
    id: announcements.id,
    title: announcements.title,
    slug: announcements.slug,
    content: announcements.content,
    excerpt: announcements.excerpt,
    type: announcements.type,
    status: announcements.status,
    isPinned: announcements.isPinned,
    viewCount: announcements.viewCount,
    publishedAt: announcements.publishedAt,
    academicYearId: announcements.academicYearId,
    createdAt: announcements.createdAt,
    updatedAt: announcements.updatedAt,
    authorId: users.id,
    authorName: users.fullName,
    categoryId: categories.id,
    categoryName: categories.name,
    coverImageId: media.id,
    coverImageUrl: media.url,
  })
  .from(announcements)
  .leftJoin(users, eq(announcements.authorId, users.id))
  .leftJoin(categories, eq(announcements.categoryId, categories.id))
  .leftJoin(media, eq(announcements.coverImageId, media.id))
  .where(and(eq(announcements.id, id), isNull(announcements.deletedAt)))
  .limit(1);

  if (result.length === 0) return errorResponse("Announcement not found", 404);

  const ann = result[0];

  // Increment viewCount (fire-and-forget)
  db.update(announcements)
    .set({ viewCount: sql`${announcements.viewCount} + 1` })
    .where(eq(announcements.id, id))
    .execute()
    .catch(() => {});

  // Fetch audiences
  const audiences = await db.select().from(announcementAudiences)
    .where(eq(announcementAudiences.announcementId, id));

  // Fetch media
  const mediaItems = await db.select({
    id: media.id,
    url: media.url,
    type: media.type,
    mimeType: media.mimeType,
    filename: media.filename,
  })
  .from(announcementMedia)
  .innerJoin(media, eq(announcementMedia.mediaId, media.id))
  .where(eq(announcementMedia.announcementId, id));

  return successResponse({
    id: ann.id,
    title: ann.title,
    slug: ann.slug,
    content: ann.content,
    excerpt: ann.excerpt,
    type: ann.type,
    status: ann.status,
    isPinned: ann.isPinned,
    viewCount: ann.viewCount,
    publishedAt: ann.publishedAt,
    createdAt: ann.createdAt,
    updatedAt: ann.updatedAt,
    author: { id: ann.authorId, fullName: ann.authorName },
    category: ann.categoryId ? { id: ann.categoryId, name: ann.categoryName } : null,
    coverImage: ann.coverImageUrl ? { id: ann.coverImageId, url: ann.coverImageUrl } : null,
    audiences,
    media: mediaItems,
  });
});

export const PUT = withPermission(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const validation = updateAnnouncementSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const existing = await db.select({
    authorId: announcements.authorId,
    status: announcements.status,
  }).from(announcements).where(and(eq(announcements.id, id), isNull(announcements.deletedAt))).limit(1);
  if (existing.length === 0) return errorResponse("Announcement not found", 404);

  // Check ownership
  const isAdminUser = ctx.user.roleNames.includes("admin");

  if (existing[0].authorId !== ctx.user.userId && !isAdminUser) {
    return errorResponse("Forbidden", 403);
  }

  const d = validation.data;

  // Determine publishedAt
  let publishedAt = undefined;
  if (d.status === "PUBLISHED" && existing[0].status !== "PUBLISHED") {
    publishedAt = new Date();
  }

  await db.transaction(async (tx) => {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (d.title !== undefined) updateData.title = d.title;
    if (d.content !== undefined) updateData.content = d.content;
    if (d.excerpt !== undefined) updateData.excerpt = d.excerpt;
    if (d.type !== undefined) updateData.type = d.type;
    if (d.status !== undefined) updateData.status = d.status;
    if (d.categoryId !== undefined) updateData.categoryId = d.categoryId;
    if (d.coverImageId !== undefined) updateData.coverImageId = d.coverImageId;
    if (d.academicYearId !== undefined) updateData.academicYearId = d.academicYearId;
    if (publishedAt) updateData.publishedAt = publishedAt;

    await tx.update(announcements).set(updateData).where(eq(announcements.id, id));

    // Update audiences if provided
    if (d.audiences) {
      await tx.delete(announcementAudiences).where(eq(announcementAudiences.announcementId, id));
      if (d.audiences.length > 0) {
        await tx.insert(announcementAudiences).values(
          d.audiences.map(a => ({
            announcementId: id,
            targetType: a.targetType,
            collegeId: a.collegeId || null,
            programmeId: a.programmeId || null,
            yearOfStudy: a.yearOfStudy || null,
            semester: a.semester || null,
            roleTarget: a.roleTarget || null,
          }))
        );
      }
    }

    // Update media links if provided
    if (d.mediaIds) {
      await tx.delete(announcementMedia).where(eq(announcementMedia.announcementId, id));
      if (d.mediaIds.length > 0) {
        await tx.insert(announcementMedia).values(
          d.mediaIds.map(mId => ({ announcementId: id, mediaId: mId }))
        );
      }
    }
  });

  await logAction({
    userId: ctx.user.userId,
    action: "UPDATE_ANNOUNCEMENT",
    entity: "ANNOUNCEMENT",
    entityId: id,
  });

  return successResponse(null, "Announcement updated successfully");
}, "announcement.update");

export const DELETE = withPermission(async (req, ctx) => {
  const { id } = await ctx.params;

  const existing = await db.select({ id: announcements.id })
    .from(announcements)
    .where(and(eq(announcements.id, id), isNull(announcements.deletedAt)))
    .limit(1);

  if (existing.length === 0) return errorResponse("Announcement not found", 404);

  await db.update(announcements)
    .set({ deletedAt: new Date() })
    .where(eq(announcements.id, id));

  await logAction({
    userId: ctx.user.userId,
    action: "DELETE_ANNOUNCEMENT",
    entity: "ANNOUNCEMENT",
    entityId: id,
  });

  return successResponse(null, "Announcement deleted successfully");
}, "announcement.delete");
