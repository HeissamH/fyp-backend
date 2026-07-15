import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { eventCategories, events } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { generateSlug } from "@/lib/utils/slug";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const updateEventCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  iconName: z.string().min(1).max(50).optional(),
});

export const PUT = withPermission(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const validation = updateEventCategorySchema.safeParse(body);
  if (!validation.success) {
    return errorResponse("Validation failed", 400, validation.error.format());
  }

  const [existing] = await db.select().from(eventCategories).where(eq(eventCategories.id, id)).limit(1);
  if (!existing) return errorResponse("Event category not found", 404);

  const { name, iconName } = validation.data;
  const updateData: Record<string, any> = {};

  if (name !== undefined) {
    updateData.name = name;
    updateData.slug = generateSlug(name);
    const dup = await db.select({ id: eventCategories.id })
      .from(eventCategories)
      .where(and(eq(eventCategories.slug, updateData.slug), sql`${eventCategories.id} != ${id}`))
      .limit(1);
    if (dup.length > 0) return errorResponse("An event category with this name already exists", 409);
  }
  if (iconName !== undefined) updateData.iconName = iconName;

  await db.update(eventCategories).set(updateData).where(eq(eventCategories.id, id));

  await logAction({
    userId: ctx.user.userId,
    action: "UPDATE_EVENT_CATEGORY",
    entity: "EVENT_CATEGORY",
    entityId: id,
  });

  return successResponse(null, "Event category updated successfully");
}, "college.manage");

export const DELETE = withPermission(async (req, ctx) => {
  const { id } = await ctx.params;

  const [existing] = await db.select().from(eventCategories).where(eq(eventCategories.id, id)).limit(1);
  if (!existing) return errorResponse("Event category not found", 404);

  const eventCount = await db.select({ count: sql<number>`count(*)` })
    .from(events)
    .where(and(eq(events.categoryId, id), isNull(events.deletedAt)));
  if (Number(eventCount[0].count) > 0) {
    return errorResponse("Cannot delete category that has events assigned to it", 409);
  }

  await db.delete(eventCategories).where(eq(eventCategories.id, id));

  await logAction({
    userId: ctx.user.userId,
    action: "DELETE_EVENT_CATEGORY",
    entity: "EVENT_CATEGORY",
    entityId: id,
  });

  return successResponse(null, "Event category deleted successfully");
}, "college.manage");
