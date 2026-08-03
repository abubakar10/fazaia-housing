import { Resend } from "resend";
import { logger } from "@/infrastructure/logger";
import { APP_NAME } from "@/lib/constants";
import { getServerEnv } from "@/lib/env";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult =
  | { delivered: true; mode: "resend"; id?: string }
  | { delivered: false; mode: "log" };

function getResendClient(apiKey: string) {
  return new Resend(apiKey);
}

/**
 * Reusable Resend email provider.
 * Reads RESEND_API_KEY and EMAIL_FROM from environment — never hardcode secrets.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = getServerEnv();
  const apiKey = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM;

  if (!apiKey) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "RESEND_API_KEY is required to send email in production.",
      );
    }

    logger.info("email.send.dev_fallback", {
      to: input.to,
      subject: input.subject,
      from: from ?? null,
      text: input.text,
      html: input.html,
    });

    return { delivered: false, mode: "log" };
  }

  if (!from) {
    throw new Error("EMAIL_FROM is required to send email.");
  }

  const resend = getResendClient(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (result.error) {
    logger.error("email.send.failed", {
      message: result.error.message,
      to: input.to,
      subject: input.subject,
    });
    throw new Error(result.error.message);
  }

  logger.info("email.send.success", {
    id: result.data?.id,
    to: input.to,
    subject: input.subject,
  });

  return { delivered: true, mode: "resend", id: result.data?.id };
}

/** Auth password-reset helper — thin wrapper over sendEmail. */
export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}) {
  return sendEmail({
    to: input.to,
    subject: `${APP_NAME} password reset`,
    html: `
      <p>We received a request to reset your ${APP_NAME} password.</p>
      <p><a href="${input.resetUrl}">Reset your password</a></p>
      <p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>
    `,
    text: `Reset your ${APP_NAME} password: ${input.resetUrl}`,
  });
}
