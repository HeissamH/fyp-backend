import { after, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { feedback, categories, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateFeedbackStatusSchema } from "@/lib/validators/feedback";
import { logAction } from "@/lib/audit";
import { notifyFeedbackStatusChanged } from "@/lib/notifications/notify-feedback-status";

export const GET = withPermission(async (req, ctx) => {
  const { id } = await ctx.params;

  const [existing] = await db.select({
    id: feedback.id,
    subject: feedback.subject,
    description: feedback.description,
    status: feedback.status,
    adminNotes: feedback.adminNotes,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
    categoryId: categories.id,
    categoryName: categories.name,
    userId: users.id,
    userName: users.fullName,
    userEmail: users.email,
  })
  .from(feedback)
  .leftJoin(categories, eq(feedback.categoryId, categories.id))
  .leftJoin(users, eq(feedback.userId, users.id))
  .where(eq(feedback.id, id))
  .limit(1);

  if (!existing) return errorResponse("Feedback not found", 404);

  return successResponse(existing);
}, "feedback.manage");

export const PUT = withPermission(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const validation = updateFeedbackStatusSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const [existing] = await db
    .select({ id: feedback.id, status: feedback.status })
    .from(feedback)
    .where(eq(feedback.id, id))
    .limit(1);
  if (!existing) return errorResponse("Feedback not found", 404);

  const d = validation.data;
  
  const updateData: any = { updatedAt: new Date() };
  if (d.status !== undefined) updateData.status = d.status;
  if (d.adminNotes !== undefined) updateData.adminNotes = d.adminNotes;

  await db
    .update(feedback)
    .set(updateData)
    .where(eq(feedback.id, id));

  await logAction({
    userId: ctx.user.userId,
    action: "UPDATE_FEEDBACK",
    entity: "FEEDBACK",
    entityId: id,
    metadata: { newStatus: d.status, updatedNotes: d.adminNotes !== undefined },
  });

  if (d.status !== undefined) {
    const statusChanged = d.status !== existing.status;
    if (statusChanged && (d.status === "RESOLVED" || d.status === "REVIEWED")) {
      after(() => notifyFeedbackStatusChanged(id));
    }
  }

  return successResponse(null, "Feedback updated successfully");
}, "feedback.manage");
