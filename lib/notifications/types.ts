/** Canonical notification types — keep in sync with Flutter `NotificationTypes`. */
export const NOTIFICATION_TYPES = {
  POST: "POST",
  STORY: "STORY",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  LOST_FOUND: "LOST_FOUND",
  FEEDBACK: "FEEDBACK",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Legacy/deferred event types — not handled in Flutter yet. */
export type DeferredNotificationType = "event" | "EVENT";

export type NotificationPayload = {
  title: string;
  body: string;
  type: NotificationType | DeferredNotificationType;
  targetId?: string;
  targetType?: NotificationType | DeferredNotificationType;
};

export function buildNotificationPayload(input: NotificationPayload): NotificationPayload {
  return {
    title: input.title,
    body: input.body,
    type: input.type,
    targetId: input.targetId,
    targetType: input.targetType ?? input.type,
  };
}