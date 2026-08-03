import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  const email = (
    process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@fazia.local"
  ).toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "System Admin";

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      status: "ACTIVE",
      failedLoginAttempts: 0,
      lockedUntil: null,
      deletedAt: null,
    },
    create: {
      email,
      name,
      passwordHash,
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  console.log(`Bootstrap admin ready: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
