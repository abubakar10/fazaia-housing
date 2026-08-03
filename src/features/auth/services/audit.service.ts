import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db";
import { logger } from "@/infrastructure/logger";

type AuditInput = {
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  meta?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType ?? "User",
      entityId: input.entityId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
      before: input.before,
      after: input.after,
      meta: input.meta,
    },
  });
}

/** Non-blocking audit for hot paths (login success). Failures are logged, not thrown. */
export function writeAuditLogAsync(input: AuditInput) {
  void writeAuditLog(input).catch((error) => {
    logger.error("audit.write_failed", {
      action: input.action,
      error: error instanceof Error ? error.message : "unknown",
    });
  });
}
