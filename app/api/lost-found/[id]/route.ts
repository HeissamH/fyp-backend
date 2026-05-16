import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { lostFoundItems, lostFoundMedia, users, categories, media } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateLostFoundSchema } from "@/lib/validators/lost-found";
import { logAction } from "@/lib/audit";

export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;

  const [item] = await db
    .select({
      id: lostFoundItems.id,
      type: lostFoundItems.type,
      title: lostFoundItems.title,
      description: lostFoundItems.description,
      categoryId: lostFoundItems.categoryId,
      categoryName: categories.name,
      locationSeen: lostFoundItems.locationSeen,
      status: lostFoundItems.status,
      dateLostOrFound: lostFoundItems.dateLostOrFound,
      isAnonymous: lostFoundItems.isAnonymous,
      contactInfo: lostFoundItems.contactInfo,
      viewCount: lostFoundItems.viewCount,
      resolvedAt: lostFoundItems.resolvedAt,
      createdAt: lostFoundItems.createdAt,
      updatedAt: lostFoundItems.updatedAt,
      reporterId: users.id,
      reporterName: users.fullName,
    })
    .from(lostFoundItems)
    .leftJoin(users, eq(lostFoundItems.reporterId, users.id))
    .leftJoin(categories, eq(lostFoundItems.categoryId, categories.id))
    .where(and(eq(lostFoundItems.id, id), isNull(lostFoundItems.deletedAt)))
    .limit(1);

  if (!item) return errorResponse("Item not found", 404);

  db.update(lostFoundItems)
    .set({ viewCount: sql`${lostFoundItems.viewCount} + 1` })
    .where(eq(lostFoundItems.id, id))
    .execute()
    .catch(() => {});

  const isAdmin = ctx.user.roleNames.includes("admin");

  const itemMedia = await db
    .select({
      id: media.id,
      url: media.url,
      type: media.type,
      mimeType: media.mimeType,
      filename: media.filename,
    })
    .from(lostFoundMedia)
    .innerJoin(media, eq(lostFoundMedia.mediaId, media.id))
    .where(eq(lostFoundMedia.itemId, id));

  return successResponse({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    locationSeen: item.locationSeen,
    status: item.status,
    dateLostOrFound: item.dateLostOrFound,
    isAnonymous: item.isAnonymous,
    contactInfo: item.contactInfo,
    viewCount: item.viewCount,
    resolvedAt: item.resolvedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    category: item.categoryId ? { id: item.categoryId, name: item.categoryName } : null,
    reporter: item.isAnonymous && !isAdmin ? null : { id: item.reporterId, fullName: item.reporterName },
    media: itemMedia,
  });
});

export const PUT = withAuth(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const validation = updateLostFoundSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const [existing] = await db
    .select({ reporterId: lostFoundItems.reporterId, status: lostFoundItems.status })
    .from(lostFoundItems)
    .where(and(eq(lostFoundItems.id, id), isNull(lostFoundItems.deletedAt)))
    .limit(1);
  if (!existing) return errorResponse("Item not found", 404);

  const isAdmin = ctx.user.roleNames.includes("admin");
  if (existing.reporterId !== ctx.user.userId && !isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  const d = validation.data;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (d.title !== undefined) updateData.title = d.title;
  if (d.description !== undefined) updateData.description = d.description;
  if (d.categoryId !== undefined) updateData.categoryId = d.categoryId;
  if (d.locationSeen !== undefined) updateData.locationSeen = d.locationSeen;
  if (d.type !== undefined) updateData.type = d.type;
  if (d.isAnonymous !== undefined) updateData.isAnonymous = d.isAnonymous;
  if (d.contactInfo !== undefined) updateData.contactInfo = d.contactInfo;

  await db.transaction(async (tx) => {
    await tx.update(lostFoundItems).set(updateData).where(eq(lostFoundItems.id, id));
    if (d.mediaIds) {
      await tx.delete(lostFoundMedia).where(eq(lostFoundMedia.itemId, id));
      if (d.mediaIds.length > 0) {
        await tx.insert(lostFoundMedia).values(d.mediaIds.map((mId: string) => ({ itemId: id, mediaId: mId })));
      }
    }
  });

  await logAction({ userId: ctx.user.userId, action: "UPDATE_LOST_FOUND", entity: "LOST_FOUND", entityId: id });
  return successResponse(null, "Item updated successfully");
});

export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;

  const [existing] = await db
    .select({ reporterId: lostFoundItems.reporterId })
    .from(lostFoundItems)
    .where(and(eq(lostFoundItems.id, id), isNull(lostFoundItems.deletedAt)))
    .limit(1);
  if (!existing) return errorResponse("Item not found", 404);

  const isAdmin = ctx.user.roleNames.includes("admin");

  if (existing.reporterId !== ctx.user.userId && !isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  await db.update(lostFoundItems).set({ deletedAt: new Date() }).where(eq(lostFoundItems.id, id));

  await logAction({ userId: ctx.user.userId, action: "DELETE_LOST_FOUND", entity: "LOST_FOUND", entityId: id });
  return successResponse(null, "Item deleted successfully");
});
