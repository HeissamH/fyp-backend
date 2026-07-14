import { z } from "zod";

export const registerTokenSchema = z.object({
  fcmToken: z.string().min(1),
  deviceType: z.enum(["ANDROID", "IOS"]),
});

/** Unregister a device token. Prefer fcmToken; deviceType deletes that platform's row. */
export const unregisterTokenSchema = z
  .object({
    fcmToken: z.string().min(1).optional(),
    deviceType: z.enum(["ANDROID", "IOS"]).optional(),
  })
  .refine((d) => Boolean(d.fcmToken || d.deviceType), {
    message: "Provide fcmToken and/or deviceType",
  });

export const updateNotificationPreferencesSchema = z.object({
  posts: z.boolean().optional(),
  announcements: z.boolean().optional(),
  stories: z.boolean().optional(),
  lostFound: z.boolean().optional(),
});
