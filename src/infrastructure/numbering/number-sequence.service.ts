import { prisma } from "@/infrastructure/db";

type NextNumberInput = {
  scopeType: string;
  scopeId?: string | null;
  documentType: string;
  prefix: string;
  padLength?: number;
};

/**
 * Allocates the next document number from NumberSequence (E-01).
 * Example project code: PRJ-2026-0001
 */
export async function allocateNextNumber(input: NextNumberInput) {
  const padLength = input.padLength ?? 4;
  const scopeId = input.scopeId ?? null;

  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.numberSequence.findFirst({
      where: {
        scopeType: input.scopeType,
        scopeId,
        documentType: input.documentType,
      },
    });

    if (existing) {
      const updated = await tx.numberSequence.update({
        where: { id: existing.id },
        data: { nextValue: existing.nextValue + 1 },
      });
      return { nextValue: existing.nextValue, padLength: updated.padLength, prefix: updated.prefix };
    }

    const created = await tx.numberSequence.create({
      data: {
        scopeType: input.scopeType,
        scopeId,
        documentType: input.documentType,
        prefix: input.prefix,
        nextValue: 2,
        padLength,
      },
    });
    return { nextValue: 1, padLength: created.padLength, prefix: created.prefix };
  });

  const sequence = String(row.nextValue).padStart(row.padLength, "0");
  const infix = scopeId ? `${scopeId}-` : "";
  return `${row.prefix}-${infix}${sequence}`;
}

export async function allocateProjectCode() {
  const year = String(new Date().getFullYear());
  return allocateNextNumber({
    scopeType: "YEAR",
    scopeId: year,
    documentType: "PROJECT",
    prefix: "PRJ",
    padLength: 4,
  });
}

/**
 * Allocates a scoped code without embedding the scope UUID in the display value.
 * Example: PH-001, BLK-01
 */
export async function allocateScopedDisplayCode(input: {
  scopeType: string;
  scopeId: string;
  documentType: string;
  prefix: string;
  padLength?: number;
}) {
  const padLength = input.padLength ?? 3;

  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.numberSequence.findFirst({
      where: {
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        documentType: input.documentType,
      },
    });

    if (existing) {
      await tx.numberSequence.update({
        where: { id: existing.id },
        data: { nextValue: existing.nextValue + 1 },
      });
      return { nextValue: existing.nextValue };
    }

    await tx.numberSequence.create({
      data: {
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        documentType: input.documentType,
        prefix: input.prefix,
        nextValue: 2,
        padLength,
      },
    });
    return { nextValue: 1 };
  });

  return `${input.prefix}-${String(row.nextValue).padStart(padLength, "0")}`;
}

/** Converts 1→A, 26→Z, 27→AA (for SEC-A style codes). */
export function numberToAlphaCode(n: number): string {
  let value = n;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result || "A";
}

export async function allocatePhaseCode(projectId: string) {
  return allocateScopedDisplayCode({
    scopeType: "PROJECT",
    scopeId: projectId,
    documentType: "PHASE",
    prefix: "PH",
    padLength: 3,
  });
}

export async function allocateSectorCode(phaseId: string) {
  const padLength = 1;
  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.numberSequence.findFirst({
      where: {
        scopeType: "PHASE",
        scopeId: phaseId,
        documentType: "SECTOR",
      },
    });

    if (existing) {
      await tx.numberSequence.update({
        where: { id: existing.id },
        data: { nextValue: existing.nextValue + 1 },
      });
      return { nextValue: existing.nextValue };
    }

    await tx.numberSequence.create({
      data: {
        scopeType: "PHASE",
        scopeId: phaseId,
        documentType: "SECTOR",
        prefix: "SEC",
        nextValue: 2,
        padLength,
      },
    });
    return { nextValue: 1 };
  });

  return `SEC-${numberToAlphaCode(row.nextValue)}`;
}

export async function allocateBlockCode(sectorId: string) {
  return allocateScopedDisplayCode({
    scopeType: "SECTOR",
    scopeId: sectorId,
    documentType: "BLOCK",
    prefix: "BLK",
    padLength: 2,
  });
}
