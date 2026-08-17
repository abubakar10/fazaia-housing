import { prisma } from "./prisma";

async function warmConnection(attempt = 1): Promise<void> {
  try {
    await prisma.$connect();
  } catch {
    if (attempt >= 3) return;
    await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    await warmConnection(attempt + 1);
  }
}

/** Warm the pooled connection so the first auth request is not cold. */
void warmConnection();

export { prisma } from "./prisma";
export type { DbClient } from "./prisma";
