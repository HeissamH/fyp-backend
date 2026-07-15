/**
 * Student self-registration identity helpers.
 *
 * Email: any valid address (Gmail, Yahoo, etc.) — UDSM student webmail SMTP
 * is unreliable, so we do not require @student.udsm.ac.tz.
 *
 * Reg example: 2022-04-13802 → YYYY-XX-NNNNN
 */

/** YYYY-XX-NNNNN (serial 5+ digits) */
export const REG_NUMBER_PATTERN = /^(\d{4})-(\d{2})-(\d{5,})$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeRegNumber(reg: string): string {
  return reg.trim().replace(/\s+/g, "");
}

export type StudentIdentityError = {
  field?: "email" | "registrationNumber";
  message: string;
};

/**
 * Returns null when valid; otherwise a user-facing error.
 */
export function validateStudentRegistrationIdentity(
  emailRaw: string,
  regRaw: string,
): StudentIdentityError | null {
  const registrationNumber = normalizeRegNumber(regRaw);
  const email = normalizeEmail(emailRaw);

  const regMatch = registrationNumber.match(REG_NUMBER_PATTERN);
  if (!regMatch) {
    return {
      field: "registrationNumber",
      message:
        "Registration number must look like 2022-04-13802 (YYYY-XX-NNNNN).",
    };
  }

  // Basic email shape (Zod also validates; this gives a clearer message)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      field: "email",
      message: "Enter a valid email address (e.g. you@gmail.com).",
    };
  }

  return null;
}

export function isLikelyEmail(identifier: string): boolean {
  return identifier.includes("@");
}
