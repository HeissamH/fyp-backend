import { db } from "@/lib/db";
import { notificationTokens, notifications } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getFirebaseMessaging, isFirebaseConfigured } from "@/lib/firebase";
import type { NotificationPayload } from "@/lib/notifications/types";

export type { NotificationPayload } from "@/lib/notifications/types";

const FCM_CHUNK = 500;

export async function createInboxNotifications(
  userIds: string[],
  payload: NotificationPayload,
): Promise<void> {
  if (userIds.length === 0) return;

  const now = new Date();
  const rows = userIds.map((userId) => ({
    userId,
    title: payload.title,
    body: payload.body,
    type: payload.type,
    targetId: payload.targetId ?? null,
    targetType: payload.targetType ?? null,
    isRead: false,
    sentAt: now,
  }));

  for (let i = 0; i < rows.length; i += FCM_CHUNK) {
    await db.insert(notifications).values(rows.slice(i, i + FCM_CHUNK));
  }
}

export async function pushToUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
  if (!isFirebaseConfigured() || userIds.length === 0) return;

  const tokens = await db
    .select({ id: notificationTokens.id, fcmToken: notificationTokens.fcmToken })
    .from(notificationTokens)
    .where(inArray(notificationTokens.userId, userIds));

  if (tokens.length === 0) return;

  const messaging = getFirebaseMessaging();
  const staleTokenIds: string[] = [];

  for (let i = 0; i < tokens.length; i += FCM_CHUNK) {
    const chunk = tokens.slice(i, i + FCM_CHUNK);
    // channelId must match Flutter `highImportanceChannelId` (udsm_alerts_v2).
    // High priority + default sound is required for Android heads-up / banners.
    const response = await messaging.sendEachForMulticast({
      tokens: chunk.map((t) => t.fcmToken),
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: String(payload.type),
        title: payload.title,
        body: payload.body,
        ...(payload.targetId ? { targetId: payload.targetId } : {}),
        ...(payload.targetType ? { targetType: String(payload.targetType) } : {}),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "udsm_alerts_v2",
          priority: "max" as const,
          defaultSound: true,
          defaultVibrateTimings: true,
          notificationCount: 1,
        },
        ttl: 60 * 60 * 24 * 1000, // 24h
      },
    });

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          staleTokenIds.push(chunk[idx].id);
        }
      }
    });
  }

  if (staleTokenIds.length > 0) {
    await db.delete(notificationTokens).where(inArray(notificationTokens.id, staleTokenIds));
  }
}

export async function notifyUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
  await createInboxNotifications(userIds, payload);
  await pushToUsers(userIds, payload).catch((err) => {
    console.error("FCM push failed:", err);
  });
}
