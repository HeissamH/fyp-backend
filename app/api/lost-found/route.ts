import { db } from "@/lib/db";
import { lostFoundItems, lostFoundMedia, users, categories, media } from "@/lib/db/schema";
import { eq, and, isNull, desc, sql, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";
import { createLostFoundSchema } from "@/lib/validators/lost-found";
import { logAction } from "@/lib/audit";



export const GET = withAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, pageSize, offset } = parsePagination(sp);
  const type = sp.get("type");
  const status = sp.get("status") || "ALL";
  const categoryId = sp.get("categoryId");

  const conditions = [
    isNull(lostFoundItems.deletedAt),
    sql`(${lostFoundItems.status} = 'OPEN' OR (${lostFoundItems.status} = 'RESOLVED' AND ${lostFoundItems.resolvedAt} > NOW() - INTERVAL '24 hours'))`
  ];
  if (type) conditions.push(eq(lostFoundItems.type, type));
  if (status && status !== "ALL") conditions.push(eq(lostFoundItems.status, status));
  if (categoryId) conditions.push(eq(lostFoundItems.categoryId, categoryId));

  const whereClause = and(...conditions);

  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(lostFoundItems).where(whereClause);
  const total = Number(totalResult[0].count);

  const list = await db.select({
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
    reporterId: users.id,
    reporterName: users.fullName,
  })
  .from(lostFoundItems)
  .leftJoin(users, eq(lostFoundItems.reporterId, users.id))
  .leftJoin(categories, eq(lostFoundItems.categoryId, categories.id))
  .where(whereClause)
  .orderBy(desc(lostFoundItems.createdAt))
  .limit(pageSize).offset(offset);

  const isAdmin = ctx.user.roleNames.includes("admin");

  // Fetch cover images for all items in one query
  const itemIds = list.map(i => i.id);
  const coverImages = itemIds.length > 0
    ? await db.select({
        itemId: lostFoundMedia.itemId,
        mediaId: media.id,
        url: media.url,
        type: media.type,
        mimeType: media.mimeType,
        filename: media.filename,
      })
      .from(lostFoundMedia)
      .innerJoin(media, eq(lostFoundMedia.mediaId, media.id))
      .where(inArray(lostFoundMedia.itemId, itemIds))
    : [];

  // Build a map: itemId → first media record found
  const coverMap = new Map<string, any>();
  for (const img of coverImages) {
    if (!coverMap.has(img.itemId)) {
      coverMap.set(img.itemId, { id: img.mediaId, url: img.url, type: img.type, mimeType: img.mimeType, filename: img.filename });
    }
  }

  const data = list.map(item => {
    return {
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
      category: item.categoryId ? { id: item.categoryId, name: item.categoryName } : null,
      reporter: item.isAnonymous && !isAdmin ? null : { id: item.reporterId, fullName: item.reporterName },
      coverImage: coverMap.get(item.id) || null,
    };
  });

  return successResponse(data);
});


export const POST = withAuth(async (req, ctx) => {
  const body = await req.json();
  const validation = createLostFoundSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const d = validation.data;

  const [created] = await db.transaction(async (tx) => {
    const [item] = await tx.insert(lostFoundItems).values({
      reporterId: ctx.user.userId,
      type: d.type,
      title: d.title,
      description: d.description,
      categoryId: d.categoryId || null,
      locationSeen: d.locationSeen || null,
      dateLostOrFound: d.dateLostOrFound,
      isAnonymous: d.isAnonymous,
      contactInfo: d.contactInfo || null,
    }).returning();

    if (d.mediaIds && d.mediaIds.length > 0) {
      await tx.insert(lostFoundMedia).values(
        d.mediaIds.map(mId => ({ itemId: item.id, mediaId: mId }))
      );
    }

    return [item];
  });

  await logAction({
    userId: ctx.user.userId,
    action: "CREATE_LOST_FOUND",
    entity: "LOST_FOUND",
    entityId: created.id,
    metadata: { type: d.type, anonymous: d.isAnonymous },
  });

  return successResponse(created, "Item reported successfully", 201);
});
