import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedUnit = {
  code: string;
  name: string;
  type: "HQ" | "REGION" | "DIVISION" | "SITE" | "STORE" | "FINANCE";
  parentCode?: string;
  sortOrder?: number;
};

const UNITS: SeedUnit[] = [
  { code: "HQ", name: "Falcon Headquarters", type: "HQ", sortOrder: 0 },
  { code: "REG-NORTH", name: "Northern Region", type: "REGION", parentCode: "HQ", sortOrder: 1 },
  { code: "REG-SOUTH", name: "Southern Region", type: "REGION", parentCode: "HQ", sortOrder: 2 },
  {
    code: "DIV-N1",
    name: "North Division 1",
    type: "DIVISION",
    parentCode: "REG-NORTH",
    sortOrder: 1,
  },
  {
    code: "SITE-N1-A",
    name: "Site Alpha",
    type: "SITE",
    parentCode: "DIV-N1",
    sortOrder: 1,
  },
  {
    code: "STORE-N1-A",
    name: "Site Alpha Store",
    type: "STORE",
    parentCode: "SITE-N1-A",
    sortOrder: 1,
  },
  {
    code: "FIN-HQ",
    name: "HQ Finance Unit",
    type: "FINANCE",
    parentCode: "HQ",
    sortOrder: 10,
  },
];

async function main() {
  const byCode = new Map<string, string>();

  for (const unit of UNITS) {
    const parentId = unit.parentCode ? byCode.get(unit.parentCode) : null;
    if (unit.parentCode && !parentId) {
      throw new Error(`Missing parent ${unit.parentCode} for ${unit.code}`);
    }

    const saved = await prisma.orgUnit.upsert({
      where: { code: unit.code },
      update: {
        name: unit.name,
        type: unit.type,
        parentId: parentId ?? null,
        sortOrder: unit.sortOrder ?? 0,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        code: unit.code,
        name: unit.name,
        type: unit.type,
        parentId: parentId ?? null,
        sortOrder: unit.sortOrder ?? 0,
        status: "ACTIVE",
      },
    });
    byCode.set(unit.code, saved.id);
  }

  const adminEmail = (
    process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@falcon.local"
  ).toLowerCase();
  const hqId = byCode.get("HQ");
  if (hqId) {
    await prisma.user.updateMany({
      where: { email: adminEmail, deletedAt: null },
      data: { orgUnitId: hqId },
    });
  }

  console.log(`Organization seed complete (${UNITS.length} units).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
