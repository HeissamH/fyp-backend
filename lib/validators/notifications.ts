import { z } from "zod";

export const registerTokenSchema = z.object({
  fcmToken: z.string().min(1),
  deviceType: z.enum(["ANDROID", "IOS"]),
});

export const updateNotificationPreferencesSchema = z.object({
  posts: z.boolean().optional(),
});
