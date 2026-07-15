import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, otp } from "@/lib/db/schema";
import { eq, and, gt, desc, isNull, sql } from "drizzle-orm";
import { verifyOtpSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";
import { rateLimit } from "@/lib/utils/rate-limit";
import { normalizeEmail } from "@/lib/utils/student-identity";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "Unknown";
    const body = await req.json();

    const validation = verifyOtpSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Validation failed", 400, validation.error.format());
    }

    const email = normalizeEmail(validation.data.email);
    const { otpCode } = validation.data;
    const purpose = validation.data.purpose ?? "password_reset";

    const rl = rateLimit(`verify_otp_${email}`, 5, 15 * 60 * 1000);
    if (!rl.success) {
      return errorResponse("Too many attempts. Please request a new OTP.", 429);
    }

    const userResult = await db
      .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
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
    if (!user) {
      return errorResponse("Invalid or expired OTP", 400);
    }

    const latestOtpResult = await db
      .select()
      .from(otp)
      .where(
        and(
          eq(otp.userId, user.id),
          eq(otp.otpCode, otpCode),
          gt(otp.expiresAt, new Date()),
          isNull(otp.usedAt),
        ),
      )
      .orderBy(desc(otp.createdAt))
      .limit(1);

    const validOtp = latestOtpResult[0];

    if (!validOtp) {
      return errorResponse("Invalid or expired OTP", 400);
    }

    await db
      .update(otp)
      .set({ usedAt: new Date() })
      .where(eq(otp.id, validOtp.id));

    if (purpose === "email_verification") {
      if (!user.emailVerifiedAt) {
        await db
          .update(users)
          .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      await logAction({
        userId: user.id,
        action: "VERIFY_EMAIL",
        entity: "USER",
        entityId: user.id,
        ipAddress: ip,
      });

      return successResponse(
        { verified: true, email },
        "Email verified successfully. You can log in now.",
      );
    }

    // Password reset flow
    const resetToken = jwt.sign(
      { userId: user.id, purpose: "password-reset" },
      JWT_SECRET,
      { expiresIn: "10m" as any },
    );

    await logAction({
      userId: user.id,
      action: "VERIFY_OTP",
      entity: "OTP",
      entityId: validOtp.id,
      ipAddress: ip,
    });

    return successResponse({ resetToken }, "OTP verified successfully");
  } catch (error) {
    console.error("Verify OTP error:", error);
    return errorResponse("Internal server error", 500);
  }
}
