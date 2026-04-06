import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";

export type PasswordResetDelivery = "resend" | "smtp" | "none";

function getSmtpTransporter(): Transporter | null {
  const host = process.env.SYNCSPACE_SMTP_HOST;
  if (!host?.trim()) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SYNCSPACE_SMTP_PORT ?? 587),
    secure: process.env.SYNCSPACE_SMTP_SECURE === "true",
    auth: {
      user: process.env.SYNCSPACE_SMTP_USER,
      pass: process.env.SYNCSPACE_SMTP_PASS,
    },
  });
}

/**
 * Sends a password reset email.
 * Precedence: Resend (SYNCSPACE_RESEND_API_KEY) → SMTP → none (logs URL; use dev flag on API to expose URL to client).
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<{ delivery: PasswordResetDelivery }> {
  const subject = "Reset your SyncSpace password";
  const text = `We received a request to reset your SyncSpace password.\n\nOpen this link (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<p>We received a request to reset your SyncSpace password.</p><p><a href="${resetUrl}">Reset your password</a></p><p style="color:#666;font-size:12px">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`;

  const resendKey = process.env.SYNCSPACE_RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    const from =
      process.env.SYNCSPACE_RESEND_FROM ?? "SyncSpace <onboarding@resend.dev>";
    const result = await resend.emails.send({
      from,
      to: [to],
      subject,
      text,
      html,
    });
    if (result.error) {
      console.error("[SyncSpace] Resend error:", result.error);
      throw new Error(result.error.message ?? "Failed to send reset email (Resend).");
    }
    return { delivery: "resend" };
  }

  const transporter = getSmtpTransporter();
  if (!transporter) {
    console.log(
      "[SyncSpace] Password reset: no Resend/SMTP configured. Reset URL (dev / logs only):",
      resetUrl,
    );
    return { delivery: "none" };
  }

  const from = process.env.SYNCSPACE_SMTP_FROM ?? "noreply@localhost";
  try {
    await transporter.sendMail({ from, to, subject, text, html });
  } catch (e) {
    console.error("[SyncSpace] SMTP send failed:", e);
    throw new Error("Failed to send reset email. Check SYNCSPACE_SMTP_* settings.");
  }
  return { delivery: "smtp" };
}
