import { createRequestId, fail, ok } from "@/lib/http";
import { logger } from "@/infrastructure/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = createRequestId();
  const started = Date.now();

  try {
    let database: "up" | "down" | "unconfigured" = "unconfigured";

    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import("@/infrastructure/db");
        await prisma.$queryRaw`SELECT 1`;
        database = "up";
      } catch (error) {
        database = "down";
        logger.error("health.database_down", {
          requestId,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    const status = database === "down" ? "degraded" : "ok";
    const payload = {
      status,
      service: "falcon-housing",
      module: "foundation",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - started,
      checks: {
        api: "up" as const,
        database,
      },
      requestId,
    };

    logger.info("health.check", {
      requestId,
      status,
      database,
      durationMs: Date.now() - started,
    });

    if (database === "down") {
      return fail("SERVICE_DEGRADED", "API is up but database is unreachable.", {
        status: 503,
        details: payload,
        requestId,
      });
    }

    return ok(payload);
  } catch (error) {
    logger.error("health.failed", {
      requestId,
      error: error instanceof Error ? error.message : "unknown",
    });

    return fail("INTERNAL_ERROR", "Health check failed.", {
      status: 500,
      requestId,
    });
  }
}
