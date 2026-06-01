import { db } from "@/lib/db";
import { events, eventRsvps } from "@/lib/db/schema";
import { and, eq, isNull, lte, gte } from "drizzle-orm";
import { notifyUsers } from "@/lib/notifications/send";

/** Notify GOING attendees for published events that just started. Returns count processed. */
export async function notifyEventsStarted(): Promise<number> {
  const now = new Date();
  const lookback = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  const due = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(
      and(
        eq(events.status, "PUBLISHED"),
        isNull(events.deletedAt),
        isNull(events.startNotifiedAt),
        lte(events.startDateTime, now),
        gte(events.startDateTime, lookback),
      ),
    );

  for (const ev of due) {
    try {
      const rsvps = await db
        .select({ userId: eventRsvps.userId })
        .from(eventRsvps)
        .where(and(eq(eventRsvps.eventId, ev.id), eq(eventRsvps.status, "GOING")));

      const userIds = rsvps.map((r) => r.userId);

      if (userIds.length > 0) {
        await notifyUsers(userIds, {
          title: "Event starting",
          body: `"${ev.title}" is starting now.`,
          type: "EVENT",
          targetId: ev.id,
          targetType: "EVENT",
        });
      }

      await db.update(events).set({ startNotifiedAt: now }).where(eq(events.id, ev.id));
    } catch (err) {
      console.error(`notifyEventsStarted failed for event ${ev.id}:`, err);
    }
  }

  return due.length;
}
