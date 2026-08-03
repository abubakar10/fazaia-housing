import { prisma } from "./prisma";

/** Warm the pooled connection so the first auth request is not cold. */
void prisma.$connect().catch(() => {
  // Connection will retry on first query.
});

export { prisma } from "./prisma";
export type { DbClient } from "./prisma";
