import { z } from "zod";
import {
  normalizeEmail,
  normalizeRegNumber,
  validateStudentRegistrationIdentity,
} from "@/lib/utils/student-identity";

export const loginSchema = z
  .object({
    /** Preferred: email or registration number */
    identifier: z.string().min(1).optional(),
    /** Legacy field — still accepted as identifier */
    email: z.string().min(1).optional(),
    password: z.string().min(1, "Password is required"),
  })
  .superRefine((data, ctx) => {
    if (!(data.identifier?.trim() || data.email?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email or registration number is required",
        path: ["identifier"],
      });
    }
  });

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    registrationNumber: z.string().min(5, "Registration number is required"),
    sex: z.enum(["MALE", "FEMALE"]),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    collegeId: z.string().uuid("College is required").optional(),
    programmeId: z.string().uuid("Programme is required"),
    yearOfStudy: z.number().int().min(1).max(5),
  })
  .superRefine((data, ctx) => {
    const err = validateStudentRegistrationIdentity(
      data.email,
      data.registrationNumber,
    );
    if (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.message,
        path: [err.field ?? "email"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    email: normalizeEmail(data.email),
    registrationNumber: normalizeRegNumber(data.registrationNumber),
  }));

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const generateOtpSchema = z.object({
  email: z.string().email(),
  purpose: z
    .enum(["password_reset", "email_verification"])
    .default("password_reset"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().length(6, "OTP must be exactly 6 characters"),
  purpose: z
    .enum(["password_reset", "email_verification"])
    .default("password_reset"),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
