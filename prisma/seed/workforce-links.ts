import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const employees = [
    {
      code: "EMP-001",
      name: "Ali Resident",
      designation: "Resident Engineer",
      department: "Site",
      email: "ali.re@falcon.local",
    },
    {
      code: "EMP-002",
      name: "Sara Quality",
      designation: "Quality Manager",
      department: "QA",
      email: "sara.qm@falcon.local",
    },
  ];

  const contractors = [
    {
      code: "CON-001",
      name: "BuildRight Contractors",
      contactPerson: "Imran Khan",
      email: "ops@buildright.local",
    },
    {
      code: "CON-002",
      name: "Skyline Housing JV",
      contactPerson: "Nadia Ahmed",
      email: "office@skyline.local",
    },
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { code: employee.code },
      update: { ...employee, deletedAt: null },
      create: employee,
    });
  }

  for (const contractor of contractors) {
    await prisma.contractor.upsert({
      where: { code: contractor.code },
      update: { ...contractor, deletedAt: null },
      create: contractor,
    });
  }

  console.log("Workforce link masters seeded (employees + contractors).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
