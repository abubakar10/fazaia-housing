import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Neon copies `channel_binding=require` into pooled URLs. Prisma's engine
 * cannot complete that handshake and logs `Error { kind: Closed, cause: None }`.
 * PgBouncer on the `-pooler` host also needs prepared statements disabled.
 */
function buildDatasourceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    if (!url.searchParams.get("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }

    const neonPooler = url.hostname.includes("-pooler") && url.hostname.includes("neon.tech");
    if (neonPooler && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "5");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }

    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: buildDatasourceUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

// Always reuse across HMR and warm serverless isolates.
globalForPrisma.prisma = prisma;

export type DbClient = PrismaClient;
