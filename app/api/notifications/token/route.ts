import { db } from "@/lib/db";
import { notificationTokens } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { registerTokenSchema } from "@/lib/validators/notifications";

export const POST = withAuth(async (req, ctx) => {
  const body = await req.json();
  const validation = registerTokenSchema.safeParse(body);
  if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

  const d = validation.data;
  const now = new Date();

  await db
    .insert(notificationTokens)
    .values({
      userId: ctx.user.userId,
      fcmToken: d.fcmToken,
      deviceType: d.deviceType,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [notificationTokens.userId, notificationTokens.deviceType],
      set: { fcmToken: d.fcmToken, updatedAt: now },
    });

  return successResponse(null, "FCM token registered");
});
