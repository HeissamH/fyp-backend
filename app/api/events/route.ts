import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { events, eventRsvps, users, eventCategories, media } from "@/lib/db/schema";
import { eq, and, or, isNull, gt, desc, sql, count, ne } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";
import { createEventSchema } from "@/lib/validators/events";
import { generateSlug } from "@/lib/utils/slug";
import { logAction } from "@/lib/audit";
import { after } from "next/server";
import { notifyUsers } from "@/lib/notifications/send";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, pageSize, offset } = parsePagination(sp);
  const categoryId = sp.get("categoryId");
  const status = sp.get("status") || "PUBLISHED";
  const upcoming = sp.get("upcoming");

  const conditions = [isNull(events.deletedAt)];
  if (categoryId) conditions.push(eq(events.categoryId, categoryId));
  if (status && status !== "ALL") conditions.push(eq(events.status, status));
  if (upcoming === "true") conditions.push(gt(events.startDateTime, new Date()));

  const whereClause = and(...conditions);

  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(events).where(whereClause);
  const total = Number(totalResult[0].count);

  // Get RSVP counts per event
  const list = await db.select({
    id: events.id,
    title: events.title,
    slug: events.slug,
    description: events.description,
    categoryId: events.categoryId,
    categoryName: eventCategories.name,
    categoryIcon: eventCategories.iconName,
    status: events.status,
    location: events.location,
    locationUrl: events.locationUrl,
    startDateTime: events.startDateTime,
    endDateTime: events.endDateTime,
    maxAttendees: events.maxAttendees,
    isPinned: events.isPinned,
    viewCount: events.viewCount,
    publishedAt: events.publishedAt,
    createdAt: events.createdAt,
    organizerId: users.id,
    organizerName: users.fullName,
    coverImageId: media.id,
    coverImageUrl: media.url,
  })
  .from(events)
  .leftJoin(users, eq(events.organizerId, users.id))
  .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
  .leftJoin(media, eq(events.coverImageId, media.id))
  .where(whereClause)
  .orderBy(desc(events.isPinned), desc(events.startDateTime))
  .limit(pageSize).offset(offset);

  // Get RSVP counts in a separate query
  const eventIds = list.map(e => e.id);
  let rsvpCounts: { eventId: string; going: number }[] = [];
  if (eventIds.length > 0) {
    rsvpCounts = await db.select({
      eventId: eventRsvps.eventId,
      going: sql<number>`count(*)`,
    })
    .from(eventRsvps)
    .where(and(
      eq(eventRsvps.status, "GOING"),
      or(...eventIds.map(id => eq(eventRsvps.eventId, id)))
    ))
    .groupBy(eventRsvps.eventId) as any;
  }

  const goingMap = new Map(rsvpCounts.map(r => [r.eventId, Number(r.going)]));

  const data = list.map(e => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description,
    status: e.status,
    location: e.location,
    locationUrl: e.locationUrl,
    startDateTime: e.startDateTime,
    endDateTime: e.endDateTime,
    maxAttendees: e.maxAttendees,
    isPinned: e.isPinned,
    viewCount: e.viewCount,
    publishedAt: e.publishedAt,
    createdAt: e.createdAt,
    goingCount: goingMap.get(e.id) || 0,
    organizer: { id: e.organizerId, fullName: e.organizerName },
    category: e.categoryId ? { id: e.categoryId, name: e.categoryName, iconName: e.categoryIcon } : null,
    coverImage: e.coverImageUrl ? { id: e.coverImageId, url: e.coverImageUrl } : null,
  }));

  return paginatedResponse(data, total, page, pageSize);
});

export const POST = withPermission(async (req, ctx) => {
  try {
    const body = await req.json();
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      const first =
        validation.error.issues[0]?.message || "Validation failed";
      return errorResponse(first, 400, validation.error.format());
    }

    const d = validation.data;
    if (new Date(d.endDateTime).getTime() < new Date(d.startDateTime).getTime()) {
      return errorResponse("End time must be after start time", 400);
    }

    // Unique slug even when titles collide
    let slug = generateSlug(d.title);
    const existing = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1);
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const isPublishing = d.status === "PUBLISHED";

    const [created] = await db
      .insert(events)
      .values({
        title: d.title,
        slug,
        description: d.description,
        categoryId: d.categoryId,
        status: d.status,
        organizerId: ctx.user.userId,
        coverImageId: d.coverImageId || null,
        location: d.location || null,
        locationUrl: d.locationUrl || null,
        startDateTime: new Date(d.startDateTime),
        endDateTime: new Date(d.endDateTime),
        maxAttendees: d.maxAttendees ?? null,
        academicYearId: d.academicYearId || null,
        publishedAt: isPublishing ? new Date() : null,
      })
      .returning();

    await logAction({
      userId: ctx.user.userId,
      action: "CREATE_EVENT",
      entity: "EVENT",
      entityId: created.id,
      metadata: { title: d.title, status: d.status },
    });

    if (isPublishing) {
      const eventId = created.id;
      const title = d.title;
      const authorId = ctx.user.userId;
      after(async () => {
        try {
          const targetUsers = await db
            .select({ id: users.id })
            .from(users)
            .where(ne(users.id, authorId));

          if (targetUsers.length === 0) return;
          await notifyUsers(
            targetUsers.map((u) => u.id),
            {
              title: "Upcoming Event",
              body: title,
              type: "EVENT",
              targetId: eventId,
            },
          );
        } catch (e) {
          console.error("Event publish notify failed:", e);
        }
      });
    }

    // Shape response like GET list items so the app can parse reliably
    return successResponse(
      {
        id: created.id,
        title: created.title,
        slug: created.slug,
        description: created.description,
        status: created.status,
        location: created.location,
        locationUrl: created.locationUrl,
        startDateTime: created.startDateTime,
        endDateTime: created.endDateTime,
        maxAttendees: created.maxAttendees,
        isPinned: created.isPinned,
        viewCount: created.viewCount,
        publishedAt: created.publishedAt,
        createdAt: created.createdAt,
        goingCount: 0,
        organizer: {
          id: ctx.user.userId,
          fullName: ctx.user.email || "Organizer",
        },
        category: null,
        coverImage: null,
      },
      "Event created successfully",
      201,
    );
  } catch (error: any) {
    console.error("Create event error:", error);
    return errorResponse(
      error?.message || "Failed to create event",
      500,
    );
  }
}, "event.create");
