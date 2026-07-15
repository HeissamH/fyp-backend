/**
 * UDSM student identity rules for self-registration.
 *
 * Reg example:  2022-04-13802  → YYYY-XX-NNNNN
 * Email example: samuel.hebron_22@udsm.ac.tz
 * Rule: email _YY must equal last 2 digits of reg year (2022 → 22).
 */

export const UDSM_STUDENT_EMAIL_DOMAIN = "udsm.ac.tz";

/** YYYY-XX-NNNNN (serial 5+ digits) */
export const REG_NUMBER_PATTERN = /^(\d{4})-(\d{2})-(\d{5,})$/;

/**
 * local-part must end with _YY before @udsm.ac.tz
 * e.g. firstname.lastname_22@udsm.ac.tz
 */
export const STUDENT_EMAIL_PATTERN =
  /^[a-z0-9]+(?:[._][a-z0-9]+)*_(\d{2})@udsm\.ac\.tz$/i;

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

  if (!email.endsWith(`@${UDSM_STUDENT_EMAIL_DOMAIN}`)) {
    return {
      field: "email",
      message:
        "Use your official UDSM student mail ending with @udsm.ac.tz (login at https://studentmail.udsm.ac.tz/).",
    };
  }

  const emailMatch = email.match(STUDENT_EMAIL_PATTERN);
  if (!emailMatch) {
    return {
      field: "email",
      message:
        "Student email must look like firstname.lastname_YY@udsm.ac.tz (e.g. samuel.hebron_22@udsm.ac.tz).",
    };
  }

  const admissionYear = regMatch[1];
  const expectedYy = admissionYear.slice(-2);
  const emailYy = emailMatch[1];

  if (emailYy !== expectedYy) {
    return {
      field: "email",
      message: `Your email year (_${emailYy}) must match your registration year (${admissionYear} → _${expectedYy}). Use the address from https://studentmail.udsm.ac.tz/.`,
    };
  }

  return null;
}

export function isLikelyEmail(identifier: string): boolean {
  return identifier.includes("@");
}
