import { prisma } from "../src/infrastructure/db/prisma";
import { SYSTEM_ROLE_CODES } from "../src/domain/policies/permissions";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: tsx scripts/grant-super-admin.ts <email>");
  }

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const role = await prisma.role.findFirst({
    where: { code: SYSTEM_ROLE_CODES.SUPER_ADMIN, deletedAt: null },
  });
  if (!role) {
    throw new Error("SUPER_ADMIN role missing — run pnpm db:seed:rbac first");
  }

  const existing = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: role.id,
      scopeType: "GLOBAL",
    },
  });

  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        scopeType: "GLOBAL",
        assignedBy: user.id,
      },
    });
  }

  console.log(`Granted SUPER_ADMIN to ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
