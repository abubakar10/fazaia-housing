import type { HouseStatus, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db";
import type {
  ListHousesQuery,
  ListHouseTemplatesQuery,
  ListHouseTypesQuery,
} from "../schemas/house.schemas";

const houseTypeInclude = {
  _count: {
    select: {
      templates: { where: { deletedAt: null } },
      houses: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.HouseTypeInclude;

const houseTemplateInclude = {
  houseType: { select: { id: true, code: true, name: true } },
} satisfies Prisma.HouseTemplateInclude;

const houseInclude = {
  phase: { select: { id: true, code: true, name: true } },
  sector: { select: { id: true, code: true, name: true } },
  block: { select: { id: true, code: true, name: true } },
  houseType: { select: { id: true, code: true, name: true } },
  houseTemplate: { select: { id: true, code: true, name: true, version: true } },
} satisfies Prisma.HouseInclude;

export type HouseTypeRecord = Prisma.HouseTypeGetPayload<{ include: typeof houseTypeInclude }>;
export type HouseTemplateRecord = Prisma.HouseTemplateGetPayload<{
  include: typeof houseTemplateInclude;
}>;
export type HouseRecord = Prisma.HouseGetPayload<{ include: typeof houseInclude }>;

export async function listHouseTypes(query: ListHouseTypesQuery) {
  const and: Prisma.HouseTypeWhereInput[] = [{ deletedAt: null }];

  if (query.status) and.push({ status: query.status });
  if (query.category) and.push({ category: query.category });

  if (query.projectId) {
    and.push(
      query.includeGlobal
        ? { OR: [{ projectId: query.projectId }, { projectId: null }] }
        : { projectId: query.projectId },
    );
  } else if (!query.includeGlobal) {
    and.push({ projectId: { not: null } });
  }

  if (query.q) {
    and.push({
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { code: { contains: query.q, mode: "insensitive" } },
        { drawingNumber: { contains: query.q, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.HouseTypeWhereInput = { AND: and };

  const [total, rows] = await prisma.$transaction([
    prisma.houseType.count({ where }),
    prisma.houseType.findMany({
      where,
      include: houseTypeInclude,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getHouseTypeById(id: string) {
  return prisma.houseType.findFirst({
    where: { id, deletedAt: null },
    include: houseTypeInclude,
  });
}

export async function findHouseTypeByCode(projectId: string | null, code: string) {
  return prisma.houseType.findFirst({
    where: {
      code,
      deletedAt: null,
      OR: projectId
        ? [{ projectId }, { projectId: null }]
        : [{ projectId: null }],
    },
    include: houseTypeInclude,
  });
}

export async function createHouseType(data: Prisma.HouseTypeCreateInput) {
  return prisma.houseType.create({ data, include: houseTypeInclude });
}

export async function updateHouseType(id: string, data: Prisma.HouseTypeUpdateInput) {
  return prisma.houseType.update({ where: { id }, data, include: houseTypeInclude });
}

export async function softDeleteHouseType(id: string, updatedById?: string | null) {
  return prisma.houseType.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById },
    include: houseTypeInclude,
  });
}

export async function listHouseTemplates(query: ListHouseTemplatesQuery) {
  const where: Prisma.HouseTemplateWhereInput = {
    deletedAt: null,
    ...(query.houseTypeId ? { houseTypeId: query.houseTypeId } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { code: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.houseTemplate.count({ where }),
    prisma.houseTemplate.findMany({
      where,
      include: houseTemplateInclude,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getHouseTemplateById(id: string) {
  return prisma.houseTemplate.findFirst({
    where: { id, deletedAt: null },
    include: houseTemplateInclude,
  });
}

export async function listTemplateRevisions(templateId: string) {
  const root = await getHouseTemplateById(templateId);
  if (!root) return [];
  const rootId = root.revisionOfId ?? root.id;
  return prisma.houseTemplate.findMany({
    where: {
      deletedAt: null,
      OR: [{ id: rootId }, { revisionOfId: rootId }],
    },
    include: houseTemplateInclude,
    orderBy: { version: "desc" },
  });
}

export async function createHouseTemplate(data: Prisma.HouseTemplateCreateInput) {
  return prisma.houseTemplate.create({ data, include: houseTemplateInclude });
}

export async function updateHouseTemplate(id: string, data: Prisma.HouseTemplateUpdateInput) {
  return prisma.houseTemplate.update({
    where: { id },
    data,
    include: houseTemplateInclude,
  });
}

export async function clearDefaultTemplates(houseTypeId: string, exceptId?: string) {
  return prisma.houseTemplate.updateMany({
    where: {
      houseTypeId,
      isDefault: true,
      deletedAt: null,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { isDefault: false },
  });
}

export async function softDeleteHouseTemplate(id: string, updatedById?: string | null) {
  return prisma.houseTemplate.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById },
    include: houseTemplateInclude,
  });
}

export async function listHouses(query: ListHousesQuery) {
  const where: Prisma.HouseWhereInput = {
    projectId: query.projectId,
    deletedAt: null,
    ...(query.phaseId ? { phaseId: query.phaseId } : {}),
    ...(query.sectorId ? { sectorId: query.sectorId } : {}),
    ...(query.blockId ? { blockId: query.blockId } : {}),
    ...(query.houseTypeId ? { houseTypeId: query.houseTypeId } : {}),
    ...(query.houseTemplateId ? { houseTemplateId: query.houseTemplateId } : {}),
  };

  if (query.status) {
    where.status = query.status;
  } else if (!query.includeArchived) {
    where.status = { not: "ARCHIVED" };
  }

  if (query.q) {
    where.OR = [
      { code: { contains: query.q, mode: "insensitive" } },
      { plotNo: { contains: query.q, mode: "insensitive" } },
      { ownerName: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.house.count({ where }),
    prisma.house.findMany({
      where,
      include: houseInclude,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getHouseById(id: string) {
  return prisma.house.findFirst({
    where: { id, deletedAt: null },
    include: houseInclude,
  });
}

export async function findHouseCodeConflict(blockId: string, code: string, excludeId?: string) {
  return prisma.house.findFirst({
    where: {
      blockId,
      code,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function createHouse(data: Prisma.HouseCreateInput) {
  return prisma.house.create({ data, include: houseInclude });
}

export async function createHousesMany(
  rows: Prisma.HouseCreateManyInput[],
) {
  return prisma.house.createMany({ data: rows, skipDuplicates: true });
}

export async function updateHouse(id: string, data: Prisma.HouseUpdateInput) {
  return prisma.house.update({ where: { id }, data, include: houseInclude });
}

export async function softDeleteHouse(id: string, updatedById?: string | null) {
  return prisma.house.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById },
    include: houseInclude,
  });
}

export async function appendHouseStatusHistory(input: {
  houseId: string;
  projectId: string;
  fromStatus: HouseStatus | null;
  toStatus: HouseStatus;
  note?: string | null;
  changedById?: string | null;
}) {
  return prisma.houseStatusHistory.create({
    data: {
      houseId: input.houseId,
      projectId: input.projectId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      note: input.note ?? null,
      changedById: input.changedById ?? null,
    },
  });
}

export async function listHouseStatusHistory(houseId: string, limit = 50) {
  return prisma.houseStatusHistory.findMany({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countHousesForType(houseTypeId: string) {
  return prisma.house.count({ where: { houseTypeId, deletedAt: null } });
}

export async function countHousesForTemplate(houseTemplateId: string) {
  return prisma.house.count({ where: { houseTemplateId, deletedAt: null } });
}

export async function getProjectHouseStats(projectId: string) {
  const [grouped, houseTypeCount] = await prisma.$transaction([
    prisma.house.groupBy({
      by: ["status"],
      where: { projectId, deletedAt: null },
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.houseType.count({
      where: {
        deletedAt: null,
        OR: [{ projectId }, { projectId: null }],
      },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const row of grouped) {
    const count =
      typeof row._count === "object" && row._count && "_all" in row._count
        ? Number(row._count._all ?? 0)
        : 0;
    byStatus[row.status] = count;
    total += count;
  }

  return {
    total,
    byStatus,
    houseTypeCount,
    completed: (byStatus.COMPLETED ?? 0) + (byStatus.DELIVERED ?? 0),
    planning: byStatus.PLANNING ?? 0,
    constructionProgressPercent: 0,
  };
}

export async function loadStructureMaps(projectId: string) {
  const [phases, sectors, blocks, houseTypes, templates] = await prisma.$transaction([
    prisma.phase.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true, code: true },
    }),
    prisma.sector.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true, code: true, phaseId: true },
    }),
    prisma.block.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true, code: true, sectorId: true },
    }),
    prisma.houseType.findMany({
      where: {
        deletedAt: null,
        OR: [{ projectId }, { projectId: null }],
      },
      select: { id: true, code: true },
    }),
    prisma.houseTemplate.findMany({
      where: {
        deletedAt: null,
        OR: [{ projectId }, { projectId: null }],
      },
      select: { id: true, code: true, houseTypeId: true, status: true },
    }),
  ]);

  return { phases, sectors, blocks, houseTypes, templates };
}

export async function listExistingHouseKeys(projectId: string) {
  return prisma.house.findMany({
    where: { projectId, deletedAt: null },
    select: { blockId: true, code: true, plotNo: true },
  });
}

export async function getBlockChain(blockId: string) {
  return prisma.block.findFirst({
    where: { id: blockId, deletedAt: null },
    select: {
      id: true,
      code: true,
      projectId: true,
      sectorId: true,
      sector: {
        select: {
          id: true,
          phaseId: true,
          projectId: true,
          phase: { select: { id: true, projectId: true } },
        },
      },
    },
  });
}

export async function listSavedFilters(userId: string, module: string, projectId?: string | null) {
  return prisma.savedListFilter.findMany({
    where: {
      userId,
      module,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function createSavedFilter(data: {
  userId: string;
  projectId?: string | null;
  module: string;
  name: string;
  payload: Prisma.InputJsonValue;
}) {
  return prisma.savedListFilter.create({ data });
}

export async function deleteSavedFilter(id: string, userId: string) {
  return prisma.savedListFilter.deleteMany({ where: { id, userId } });
}

export async function getNextTemplateVersion(houseTypeId: string, code: string) {
  const latest = await prisma.houseTemplate.findFirst({
    where: { houseTypeId, code, deletedAt: null },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}
