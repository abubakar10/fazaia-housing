import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatasourceUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Neon pooler / serverless: keep a small pool per Node process.
  if (url.includes("connection_limit=")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=5&pool_timeout=20`;
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
