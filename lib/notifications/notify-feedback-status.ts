import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notifyUsers } from "@/lib/notifications/send";

/** Inbox + push when feedback status becomes REVIEWED or RESOLVED. */
export async function notifyFeedbackStatusChanged(feedbackId: string): Promise<void> {
  try {
    const [row] = await db
      .select({
        id: feedback.id,
        userId: feedback.userId,
        subject: feedback.subject,
        status: feedback.status,
      })
      .from(feedback)
      .where(eq(feedback.id, feedbackId))
      .limit(1);

    if (!row) return;
    if (row.status !== "REVIEWED" && row.status !== "RESOLVED") return;

    const title = row.status === "RESOLVED" ? "Feedback resolved" : "Feedback reviewed";
    const body =
      row.status === "RESOLVED"
        ? `Your feedback "${row.subject}" has been resolved.`
        : `Your feedback "${row.subject}" is now under review.`;

    await notifyUsers([row.userId], {
      title,
      body,
      type: "FEEDBACK",
      targetId: row.id,
      targetType: "FEEDBACK",
    });
  } catch (err) {
    console.error(`notifyFeedbackStatusChanged failed for ${feedbackId}:`, err);
  }
}
