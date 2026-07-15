/**
 * Student self-registration identity helpers.
 *
 * Emails allowed:
 *  - Personal / normal: Gmail, Yahoo, Outlook, etc. (any valid address)
 *  - Campus student: *@student.udsm.ac.tz (when webmail works)
 *
 * Reg example: 2022-04-13802 → YYYY-XX-NNNNN
 * If using @student.udsm.ac.tz, email _YY must match reg year (2022 → 22).
 */

/** YYYY-XX-NNNNN (serial 5+ digits) */
export const REG_NUMBER_PATTERN = /^(\d{4})-(\d{2})-(\d{5,})$/;

export const UDSM_STUDENT_EMAIL_DOMAIN = "student.udsm.ac.tz";

/** firstname.lastname_YY@student.udsm.ac.tz */
export const STUDENT_CAMPUS_EMAIL_PATTERN =
  /^[a-z0-9]+(?:[._][a-z0-9]+)*_(\d{2})@student\.udsm\.ac\.tz$/i;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeRegNumber(reg: string): string {
  return reg.trim().replace(/\s+/g, "");
}

export function isCampusStudentEmail(email: string): boolean {
  return normalizeEmail(email).endsWith(`@${UDSM_STUDENT_EMAIL_DOMAIN}`);
}

/** Domains that rarely hard-bounce immediately — skip long delivery polls. */
export function isFastDeliveryEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (isCampusStudentEmail(e)) return false;
  return (
    e.endsWith("@gmail.com") ||
    e.endsWith("@googlemail.com") ||
    e.endsWith("@yahoo.com") ||
    e.endsWith("@yahoo.co.uk") ||
    e.endsWith("@outlook.com") ||
    e.endsWith("@hotmail.com") ||
    e.endsWith("@live.com") ||
    e.endsWith("@icloud.com") ||
    e.endsWith("@proton.me") ||
    e.endsWith("@protonmail.com")
  );
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      field: "email",
      message:
        "Enter a valid email (Gmail, Yahoo, etc., or name_YY@student.udsm.ac.tz).",
    };
  }

  // Campus student mail: enforce _YY matches reg year when they choose it
  if (isCampusStudentEmail(email)) {
    const campusMatch = email.match(STUDENT_CAMPUS_EMAIL_PATTERN);
    if (!campusMatch) {
      return {
        field: "email",
        message:
          "Student mail must look like firstname.lastname_YY@student.udsm.ac.tz (e.g. samuel.hebron_22@student.udsm.ac.tz).",
      };
    }
    const admissionYear = regMatch[1];
    const expectedYy = admissionYear.slice(-2);
    if (campusMatch[1] !== expectedYy) {
      return {
        field: "email",
        message: `Your student email year (_${campusMatch[1]}) must match your registration year (${admissionYear} → _${expectedYy}).`,
      };
    }
  }

  return null;
}

export function isLikelyEmail(identifier: string): boolean {
  return identifier.includes("@");
}
