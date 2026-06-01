import { after } from "next/server";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateFeedbackStatusSchema } from "@/lib/validators/feedback";
import { logAction } from "@/lib/audit";
import { notifyFeedbackStatusChanged } from "@/lib/notifications/notify-feedback-status";

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
  await db
    .update(feedback)
    .set({
      status: d.status,
      adminNotes: d.adminNotes ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(feedback.id, id));

  await logAction({
    userId: ctx.user.userId,
    action: "UPDATE_FEEDBACK_STATUS",
    entity: "FEEDBACK",
    entityId: id,
    metadata: { newStatus: d.status },
  });

  const statusChanged = d.status !== existing.status;
  if (statusChanged && (d.status === "RESOLVED" || d.status === "REVIEWED")) {
    after(() => notifyFeedbackStatusChanged(id));
  }

  return successResponse(null, "Feedback updated successfully");
}, "feedback.manage");
