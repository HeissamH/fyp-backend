import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, otp } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { generateOtpSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";
import { sendOtpEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/utils/rate-limit";
import { normalizeEmail } from "@/lib/utils/student-identity";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "Unknown";

    // Rate limit: 3 requests per 15 mins per IP
    const rl = rateLimit(`generate_otp_${ip}`, 3, 15 * 60 * 1000);
    if (!rl.success) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await req.json();
    const validation = generateOtpSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Validation failed", 400, validation.error.format());
    }

    const email = normalizeEmail(validation.data.email);
    const purpose = validation.data.purpose ?? "password_reset";

    const userResult = await db
      .select({
        id: users.id,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(
        and(
          sql`lower(${users.email}) = ${email}`,
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    const user = userResult[0];

    // Generic success to prevent email enumeration
    if (!user) {
      return successResponse(
        null,
        "If the email is registered, an OTP has been sent.",
      );
    }

    // Already verified — still allow password-reset OTPs
    if (purpose === "email_verification" && user.emailVerifiedAt) {
      return successResponse(null, "Email is already verified. You can log in.");
    }

    // Invalidate existing unused OTPs
    await db
      .update(otp)
      .set({ usedAt: new Date() })
      .where(and(eq(otp.userId, user.id), isNull(otp.usedAt)));

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await db.insert(otp).values({
      userId: user.id,
      otpCode,
      expiresAt,
    });

    const emailResult = await sendOtpEmail(email, otpCode, purpose);
    if (!emailResult.success) {
      // Keep OTP so support can verify manually if needed; surface real delivery error.
      console.error("OTP email delivery failed", {
        email,
        purpose,
        error: emailResult.error,
        lastEvent: emailResult.lastEvent,
        emailId: emailResult.emailId,
      });
      return errorResponse(
        emailResult.error ||
          "Failed to deliver OTP to your email. Activate UDSM webmail or try again later.",
        502,
        {
          code: "OTP_EMAIL_DELIVERY_FAILED",
          lastEvent: emailResult.lastEvent,
        },
      );
    }

    await logAction({
      userId: user.id,
      action: "GENERATE_OTP",
      entity: "OTP",
      metadata: {
        purpose,
        emailId: emailResult.emailId,
        lastEvent: emailResult.lastEvent,
      },
      ipAddress: ip,
    });

    return successResponse(
      null,
      "If the email is registered, an OTP has been sent.",
    );
  } catch (error) {
    console.error("Generate OTP error:", error);
    return errorResponse("Internal server error", 500);
  }
}
