import { createHash, randomBytes } from "crypto";
import { AppError } from "@/domain/errors";
import { createRequestId } from "@/lib/http";
import {
  createPasswordResetToken,
  deletePasswordResetTokens,
  findPasswordResetToken,
  findUserByEmail,
  updatePassword,
} from "../repositories/user.repository";
import { hashPassword } from "./password.service";
import { writeAuditLog } from "./audit.service";
import { sendPasswordResetEmail } from "@/infrastructure/email";
import type { ForgotPasswordInput, ResetPasswordInput } from "../schemas/auth.schemas";

const RESET_TTL_MS = 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function getLockoutState(user: {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  status: string;
}) {
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { locked: true as const, until: user.lockedUntil };
  }
  if (user.status === "LOCKED" && user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { locked: true as const, until: user.lockedUntil };
  }
  return { locked: false as const, until: null };
}

export function nextFailedLoginState(currentAttempts: number) {
  const attempts = currentAttempts + 1;
  const lockedUntil =
    attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
  return { attempts, lockedUntil };
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
  context: { ip?: string | null; userAgent?: string | null },
) {
  const requestId = createRequestId();
  const user = await findUserByEmail(input.email);

  // Always return the same message to avoid email enumeration.
  const publicMessage =
    "If an account exists for that email, password reset instructions have been sent.";

  if (!user || !user.passwordHash || user.status === "INACTIVE") {
    await writeAuditLog({
      action: "auth.password_reset.request",
      entityType: "User",
      entityId: user?.id ?? null,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId,
      meta: { email: input.email, result: "noop" },
    });
    return { message: publicMessage, requestId };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  await createPasswordResetToken(user.email, tokenHash, expires);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  await sendPasswordResetEmail({ to: user.email, resetUrl });

  await writeAuditLog({
    actorId: user.id,
    action: "auth.password_reset.request",
    entityType: "User",
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId,
    meta: { email: user.email, result: "sent" },
  });

  return { message: publicMessage, requestId };
}

export async function resetPassword(
  input: ResetPasswordInput,
  context: { ip?: string | null; userAgent?: string | null },
) {
  const requestId = createRequestId();
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError("INVALID_TOKEN", "Reset link is invalid or has expired.", {
      status: 400,
    });
  }

  const tokenHash = hashResetToken(input.token);
  const record = await findPasswordResetToken(user.email, tokenHash);

  if (!record || record.expires.getTime() < Date.now()) {
    await writeAuditLog({
      actorId: user.id,
      action: "auth.password_reset.failed",
      entityType: "User",
      entityId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId,
      meta: { reason: "invalid_or_expired_token" },
    });
    throw new AppError("INVALID_TOKEN", "Reset link is invalid or has expired.", {
      status: 400,
    });
  }

  const passwordHash = await hashPassword(input.password);
  await updatePassword(user.id, passwordHash);
  await deletePasswordResetTokens(user.email);

  await writeAuditLog({
    actorId: user.id,
    action: "auth.password_reset.success",
    entityType: "User",
    entityId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId,
  });

  return {
    message: "Password updated successfully. You can sign in now.",
    requestId,
  };
}
