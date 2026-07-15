import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "fallback_key");
const FROM_EMAIL = "noreply@udsminfo.com";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function sendOtpEmail(
  to: string,
  otpCode: string,
  purpose: "password_reset" | "email_verification" = "password_reset",
) {
  const minutes = process.env.OTP_EXPIRY_MINUTES || "10";

  if (purpose === "email_verification") {
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 480px;">
        <h2 style="color:#1565C0;">Verify your UDSM Connect account</h2>
        <p>Enter this code in the app to confirm you own this UDSM webmail address:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;">${otpCode}</p>
        <p>This code expires in <strong>${minutes} minutes</strong>.</p>
        <p style="color:#666;font-size:13px;">If you did not create an account, you can ignore this email.</p>
      </div>
    `;
    return await sendEmail({
      to,
      subject: "UDSM Connect — Verify your student email",
      html,
    });
  }

  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Password Reset OTP</h2>
      <p>Your one-time password for password reset is: <strong>${otpCode}</strong></p>
      <p>This code will expire in ${minutes} minutes.</p>
    </div>
  `;
  return await sendEmail({
    to,
    subject: "UDSM Platform - Password Reset OTP",
    html,
  });
}
