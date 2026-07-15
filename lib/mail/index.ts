import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "fallback_key");
const FROM_EMAIL =
  process.env.MAIL_FROM || "UDSM Connect <noreply@udsminfo.com>";

export type SendEmailResult = {
  success: boolean;
  error?: string;
  emailId?: string;
  lastEvent?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text:
      text ||
      html
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
  });

  if (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }

  const emailId = data?.id;
  if (!emailId) {
    return { success: false, error: "Email provider returned no message id" };
  }

  // Resend accepts the API call even when the address is suppressed, and
  // campus MX may hard-bounce a few seconds later. Poll briefly.
  const delivery = await waitForDeliveryStatus(emailId);
  if (
    delivery === "bounced" ||
    delivery === "suppressed" ||
    delivery === "complained" ||
    delivery === "failed"
  ) {
    console.error("Email delivery failed:", { to, emailId, delivery });
    return {
      success: false,
      emailId,
      lastEvent: delivery,
      error: deliveryMessage(delivery, to),
    };
  }

  return { success: true, emailId, lastEvent: delivery };
}

function deliveryMessage(event: string, to: string): string {
  if (event === "suppressed") {
    return (
      `Email to ${to} is blocked by our mail provider (previous bounce). ` +
      `Use a different email address, or ask an admin to clear the suppression and resend.`
    );
  }
  if (event === "bounced") {
    return (
      `Could not deliver to ${to} (bounced). ` +
      `Check the address is correct, try another email (e.g. Gmail), then tap Resend code.`
    );
  }
  return `Could not deliver email to ${to} (${event}).`;
}

async function waitForDeliveryStatus(
  emailId: string,
  attempts = 6,
  delayMs = 900,
): Promise<string | undefined> {
  for (let i = 0; i < attempts; i++) {
    await sleep(delayMs);
    const event = await getEmailLastEvent(emailId);
    if (!event) continue;
    // Terminal failure states
    if (
      event === "bounced" ||
      event === "suppressed" ||
      event === "complained" ||
      event === "failed"
    ) {
      return event;
    }
    // Happy path — stop early
    if (event === "delivered" || event === "opened" || event === "clicked") {
      return event;
    }
    // "sent" / "queued" / "delivery_delayed" → keep polling
  }
  // Not failed within the window; treat as accepted for send
  return (await getEmailLastEvent(emailId)) || "sent";
}

async function getEmailLastEvent(emailId: string): Promise<string | undefined> {
  try {
    const { data, error } = await resend.emails.get(emailId);
    if (error || !data) return undefined;
    // SDK may expose last_event
    const anyData = data as { last_event?: string; lastEvent?: string };
    return anyData.last_event || anyData.lastEvent;
  } catch (e) {
    console.error("Email status poll error:", e);
    return undefined;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendOtpEmail(
  to: string,
  otpCode: string,
  purpose: "password_reset" | "email_verification" = "password_reset",
): Promise<SendEmailResult> {
  const minutes = process.env.OTP_EXPIRY_MINUTES || "10";

  if (purpose === "email_verification") {
    const subject = "UDSM Connect - Verify your email";
    const text = [
      "Verify your UDSM Connect account",
      "",
      `Your verification code is: ${otpCode}`,
      "",
      `This code expires in ${minutes} minutes.`,
      "",
      "If you did not create an account, ignore this email.",
    ].join("\n");
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 480px;">
        <h2 style="color:#1565C0;">Verify your UDSM Connect account</h2>
        <p>Enter this code in the UDSM Connect app to confirm your email address:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;">${otpCode}</p>
        <p>This code expires in <strong>${minutes} minutes</strong>.</p>
        <p style="color:#666;font-size:13px;">If you did not create an account, ignore this email.</p>
      </div>
    `;
    return await sendEmail({ to, subject, html, text });
  }

  const subject = "UDSM Connect - Password reset code";
  const text = `Your password reset code is ${otpCode}. It expires in ${minutes} minutes.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Password Reset OTP</h2>
      <p>Your one-time password for password reset is: <strong>${otpCode}</strong></p>
      <p>This code will expire in ${minutes} minutes.</p>
    </div>
  `;
  return await sendEmail({ to, subject, html, text });
}
