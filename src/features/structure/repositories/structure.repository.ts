import type { Prisma, StructureStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/db";
import type {
  ListBlocksQuery,
  ListPhasesQuery,
  ListSectorsQuery,
} from "../schemas/structure.schemas";

const phaseInclude = {
  _count: {
    select: {
      sectors: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.PhaseInclude;

const sectorInclude = {
  phase: { select: { id: true, code: true, name: true } },
  _count: {
    select: {
      blocks: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.SectorInclude;

const blockInclude = {
  sector: {
    select: { id: true, code: true, name: true, phaseId: true },
  },
} satisfies Prisma.BlockInclude;

export type PhaseRecord = Prisma.PhaseGetPayload<{ include: typeof phaseInclude }>;
export type SectorRecord = Prisma.SectorGetPayload<{ include: typeof sectorInclude }>;
export type BlockRecord = Prisma.BlockGetPayload<{ include: typeof blockInclude }>;

function applyStatusFilter<T extends { status?: unknown }>(
  where: T,
  status: StructureStatus | undefined,
  includeArchived: boolean,
) {
  if (status) {
    where.status = status;
  } else if (!includeArchived) {
    where.status = { not: "ARCHIVED" };
  }
}

export async function listPhases(query: ListPhasesQuery) {
  const where: Prisma.PhaseWhereInput = {
    projectId: query.projectId,
    deletedAt: null,
  };
  applyStatusFilter(where, query.status, query.includeArchived);

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { code: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.phase.count({ where }),
    prisma.phase.findMany({
      where,
      include: phaseInclude,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getPhaseById(id: string) {
  return prisma.phase.findFirst({
    where: { id, deletedAt: null },
    include: phaseInclude,
  });
}

export async function createPhase(data: Prisma.PhaseCreateInput) {
  return prisma.phase.create({ data, include: phaseInclude });
}

export async function updatePhase(id: string, data: Prisma.PhaseUpdateInput) {
  return prisma.phase.update({ where: { id }, data, include: phaseInclude });
}

export async function softDeletePhase(id: string, updatedById?: string | null) {
  return prisma.phase.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById },
    include: phaseInclude,
  });
}

export async function countActiveSectors(phaseId: string) {
  return prisma.sector.count({ where: { phaseId, deletedAt: null } });
}

export async function listSectors(query: ListSectorsQuery) {
  const where: Prisma.SectorWhereInput = {
    deletedAt: null,
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.phaseId ? { phaseId: query.phaseId } : {}),
  };
  applyStatusFilter(where, query.status, query.includeArchived);

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { code: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.sector.count({ where }),
    prisma.sector.findMany({
      where,
      include: sectorInclude,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getSectorById(id: string) {
  return prisma.sector.findFirst({
    where: { id, deletedAt: null },
    include: sectorInclude,
  });
}

export async function createSector(data: Prisma.SectorCreateInput) {
  return prisma.sector.create({ data, include: sectorInclude });
}

export async function updateSector(id: string, data: Prisma.SectorUpdateInput) {
  return prisma.sector.update({ where: { id }, data, include: sectorInclude });
}

export async function softDeleteSector(id: string, updatedById?: string | null) {
  return prisma.sector.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById },
    include: sectorInclude,
  });
}

export async function countActiveBlocks(sectorId: string) {
  return prisma.block.count({ where: { sectorId, deletedAt: null } });
}

export async function listBlocks(query: ListBlocksQuery) {
  const where: Prisma.BlockWhereInput = {
    deletedAt: null,
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.sectorId ? { sectorId: query.sectorId } : {}),
    ...(query.phaseId
      ? { sector: { phaseId: query.phaseId, deletedAt: null } }
      : {}),
  };
  applyStatusFilter(where, query.status, query.includeArchived);

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { code: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.block.count({ where }),
    prisma.block.findMany({
      where,
      include: blockInclude,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getBlockById(id: string) {
  return prisma.block.findFirst({
    where: { id, deletedAt: null },
    include: blockInclude,
  });
}

export async function createBlock(data: Prisma.BlockCreateInput) {
  return prisma.block.create({ data, include: blockInclude });
}

export async function updateBlock(id: string, data: Prisma.BlockUpdateInput) {
  return prisma.block.update({ where: { id }, data, include: blockInclude });
}

export async function softDeleteBlock(id: string, updatedById?: string | null) {
  return prisma.block.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById },
    include: blockInclude,
  });
}

export async function findPhaseCodeConflict(projectId: string, code: string, excludeId?: string) {
  return prisma.phase.findFirst({
    where: {
      projectId,
      code,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function findSectorCodeConflict(phaseId: string, code: string, excludeId?: string) {
  return prisma.sector.findFirst({
    where: {
      phaseId,
      code,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function findBlockCodeConflict(sectorId: string, code: string, excludeId?: string) {
  return prisma.block.findFirst({
    where: {
      sectorId,
      code,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}

/** Flat load of hierarchy for one project — no N+1. */
export async function loadProjectHierarchyRows(projectId: string, includeArchived = false) {
  const statusFilter = includeArchived
    ? undefined
    : ({ not: "ARCHIVED" as const });

  return prisma.phase.findMany({
    where: {
      projectId,
      deletedAt: null,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      sectors: {
        where: {
          deletedAt: null,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          blocks: {
            where: {
              deletedAt: null,
              ...(statusFilter ? { status: statusFilter } : {}),
            },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      },
    },
  });
}

export async function countStructureForProject(projectId: string) {
  const [phases, sectors, blocks] = await prisma.$transaction([
    prisma.phase.count({
      where: { projectId, deletedAt: null, status: { not: "ARCHIVED" } },
    }),
    prisma.sector.count({
      where: { projectId, deletedAt: null, status: { not: "ARCHIVED" } },
    }),
    prisma.block.count({
      where: { projectId, deletedAt: null, status: { not: "ARCHIVED" } },
    }),
  ]);
  return { phases, sectors, blocks };
}

export async function getProjectExists(projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true, code: true, name: true, status: true },
  });
}
