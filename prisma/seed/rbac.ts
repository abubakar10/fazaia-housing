import { PrismaClient } from "@prisma/client";
import {
  PERMISSION_DEFINITIONS,
} from "../../src/domain/policies/permissions";
import { SEED_ROLES } from "../../src/domain/policies/role-grants";
import { SYSTEM_ROLE_CODES } from "../../src/domain/policies/permissions";

const prisma = new PrismaClient();

async function seedPermissions() {
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: {
        code: permission.code,
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
    });
  }
}

async function seedRoles() {
  const allPermissions = await prisma.permission.findMany();
  const byCode = new Map(allPermissions.map((p) => [p.code, p]));

  for (const roleDef of SEED_ROLES) {
    const role = await prisma.role.upsert({
      where: { code: roleDef.code },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
        globalRead: roleDef.globalRead,
        deletedAt: null,
      },
      create: {
        code: roleDef.code,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
        globalRead: roleDef.globalRead,
      },
    });

    const permissionCodes =
      roleDef.permissions === "*"
        ? allPermissions.map((p) => p.code)
        : roleDef.permissions;

    const permissionIds = permissionCodes
      .map((code) => byCode.get(code)?.id)
      .filter((id): id is string => !!id);

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissionIds.length) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }
}

async function assignBootstrapAdmin() {
  const email = (
    process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@falcon.local"
  ).toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(
      `Bootstrap admin ${email} not found — run pnpm db:seed:auth first, then re-run RBAC seed.`,
    );
    return;
  }

  const superAdmin = await prisma.role.findUnique({
    where: { code: SYSTEM_ROLE_CODES.SUPER_ADMIN },
  });
  if (!superAdmin) {
    throw new Error("SUPER_ADMIN role missing after seed");
  }

  const existing = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: superAdmin.id,
      scopeType: "GLOBAL",
    },
  });

  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdmin.id,
        scopeType: "GLOBAL",
      },
    });
  }

  console.log(`Assigned SUPER_ADMIN to ${email}`);
}

async function main() {
  console.log(`Seeding ${PERMISSION_DEFINITIONS.length} permissions…`);
  await seedPermissions();
  console.log(`Seeding ${SEED_ROLES.length} system roles…`);
  await seedRoles();
  await assignBootstrapAdmin();
  console.log("RBAC seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
