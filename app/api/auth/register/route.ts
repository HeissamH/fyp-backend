import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, roles, userRoles, otp } from "@/lib/db/schema";
import { eq, or, and, isNull } from "drizzle-orm";
import { registerSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/password";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";
import { sendOtpEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const first =
        validation.error.issues[0]?.message || "Validation failed";
      return errorResponse(first, 400, validation.error.format());
    }

    const data = validation.data;

    const existingUserResult = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, data.email),
          eq(users.registrationNumber, data.registrationNumber),
        ),
      )
      .limit(1);

    if (existingUserResult.length > 0) {
      return errorResponse("Email or Registration Number already exists", 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const studentRoleResult = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "student"))
      .limit(1);
    const studentRole = studentRoleResult[0];

    if (!studentRole) {
      return errorResponse(
        "Default student role not found. Contact administrator.",
        500,
      );
    }

    // New student accounts start unverified — login blocked until webmail OTP.
    const [newUser] = await db
      .insert(users)
      .values({
        fullName: data.fullName,
        registrationNumber: data.registrationNumber,
        sex: data.sex,
        email: data.email,
        password: hashedPassword,
        ...(data.collegeId != null && { collegeId: data.collegeId }),
        programmeId: data.programmeId,
        yearOfStudy: data.yearOfStudy,
        isActive: true,
        emailVerifiedAt: null,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        registrationNumber: users.registrationNumber,
        email: users.email,
        programmeId: users.programmeId,
        yearOfStudy: users.yearOfStudy,
        createdAt: users.createdAt,
      });

    await db.insert(userRoles).values({
      userId: newUser.id,
      roleId: studentRole.id,
    });

    await logAction({
      userId: newUser.id,
      action: "CREATE_USER",
      entity: "USER",
      entityId: newUser.id,
      metadata: { registration: true, emailVerified: false },
      ipAddress:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "Unknown",
      userAgent: req.headers.get("user-agent") || "Unknown",
    });

    // Send verification OTP to UDSM webmail (best-effort; client can resend).
    let otpSent = false;
    try {
      await db
        .update(otp)
        .set({ usedAt: new Date() })
        .where(and(eq(otp.userId, newUser.id), isNull(otp.usedAt)));

      const otpCode = crypto.randomInt(100000, 999999).toString();
      const expiryMinutes = parseInt(
        process.env.OTP_EXPIRY_MINUTES || "10",
        10,
      );
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      await db.insert(otp).values({
        userId: newUser.id,
        otpCode,
        expiresAt,
      });

      const emailResult = await sendOtpEmail(
        data.email,
        otpCode,
        "email_verification",
      );
      otpSent = emailResult.success;
    } catch (e) {
      console.error("Registration OTP send failed:", e);
    }

    return successResponse(
      {
        ...newUser,
        roles: [{ id: studentRole.id, name: studentRole.name }],
        requiresEmailVerification: true,
        otpSent,
      },
      otpSent
        ? "Account created. Check your UDSM webmail for the verification code."
        : "Account created. Request a verification code to activate login.",
      201,
    );
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse("Internal server error", 500);
  }
}
