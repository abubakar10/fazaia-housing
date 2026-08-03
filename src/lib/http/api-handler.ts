import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/domain/errors";
import { createRequestId, fail } from "@/lib/http";
import { logger } from "@/infrastructure/logger";

export function handleApiError(error: unknown, context: string) {
  const requestId = createRequestId();

  if (error instanceof ZodError) {
    return fail("VALIDATION_ERROR", "Invalid request.", {
      status: 422,
      details: error.flatten(),
      requestId,
    });
  }

  if (error instanceof AppError) {
    return fail(error.code, error.message, {
      status: error.status,
      details: error.details,
      requestId,
    });
  }

  logger.error(context, {
    requestId,
    error: error instanceof Error ? error.message : "unknown",
  });

  return fail("INTERNAL_ERROR", "Unexpected server error.", {
    status: 500,
    requestId,
  });
}

export async function parseJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Invalid JSON body.", {
      status: 422,
    });
  }
}
