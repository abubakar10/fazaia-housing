import { NextRequest } from "next/server";
import { AppError } from "@/domain/errors";
import { resetPasswordSchema } from "@/features/auth";
import { resetPassword } from "@/features/auth/services/password-reset.service";
import {
  AUTH_RATE_LIMITS,
  rateLimit,
} from "@/features/auth/services/rate-limit.service";
import { createRequestId, fail, ok } from "@/lib/http";
import { logger } from "@/infrastructure/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent");

  try {
    const limited = rateLimit(
      `reset:${ip}`,
      AUTH_RATE_LIMITS.resetPassword.limit,
      AUTH_RATE_LIMITS.resetPassword.windowMs,
    );

    if (!limited.success) {
      return fail(
        "RATE_LIMITED",
        "Too many reset attempts. Please try again later.",
        { status: 429, requestId },
      );
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid request.", {
        status: 422,
        details: parsed.error.flatten(),
        requestId,
      });
    }

    const result = await resetPassword(parsed.data, { ip, userAgent });
    return ok({ message: result.message });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error.code, error.message, {
        status: error.status,
        requestId,
      });
    }

    logger.error("reset_password.failed", {
      requestId,
      error: error instanceof Error ? error.message : "unknown",
    });

    return fail("INTERNAL_ERROR", "Unable to reset password.", {
      status: 500,
      requestId,
    });
  }
}
