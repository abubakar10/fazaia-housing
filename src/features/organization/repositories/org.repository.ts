import type { OrgUnitStatus, OrgUnitType, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db";
import type { ListOrgUnitsQuery } from "../schemas/org.schemas";

const orgInclude = {
  parent: {
    select: { id: true, code: true, name: true, type: true },
  },
  _count: {
    select: {
      children: { where: { deletedAt: null } },
      users: {
        where: {
          deletedAt: null,
          status: { in: ["ACTIVE", "INVITED"] },
        },
      },
    },
  },
} satisfies Prisma.OrgUnitInclude;

export type OrgUnitRecord = Prisma.OrgUnitGetPayload<{
  include: typeof orgInclude;
}>;

export async function listOrgUnits(
  query: ListOrgUnitsQuery,
  visibleIds?: string[] | null,
) {
  const where: Prisma.OrgUnitWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.parentId === "root"
      ? { parentId: null }
      : query.parentId
        ? { parentId: query.parentId }
        : {}),
    ...(visibleIds ? { id: { in: visibleIds } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { code: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.OrgUnitOrderByWithRelationInput = {
    [query.sort]: query.order,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.orgUnit.count({ where }),
    prisma.orgUnit.findMany({
      where,
      include: orgInclude,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function listAllOrgUnits(visibleIds?: string[] | null) {
  return prisma.orgUnit.findMany({
    where: {
      deletedAt: null,
      ...(visibleIds ? { id: { in: visibleIds } } : {}),
    },
    include: orgInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getOrgUnitById(id: string) {
  return prisma.orgUnit.findFirst({
    where: { id, deletedAt: null },
    include: orgInclude,
  });
}

export async function getOrgUnitByCode(code: string) {
  return prisma.orgUnit.findFirst({
    where: { code: code.toUpperCase(), deletedAt: null },
  });
}

export async function createOrgUnit(data: {
  code: string;
  name: string;
  type: OrgUnitType;
  status: OrgUnitStatus;
  parentId?: string | null;
  sortOrder?: number;
  createdById?: string | null;
}) {
  return prisma.orgUnit.create({
    data: {
      code: data.code.toUpperCase(),
      name: data.name,
      type: data.type,
      status: data.status,
      parentId: data.parentId ?? null,
      sortOrder: data.sortOrder ?? 0,
      createdById: data.createdById ?? null,
      updatedById: data.createdById ?? null,
    },
    include: orgInclude,
  });
}

export async function updateOrgUnit(
  id: string,
  data: Prisma.OrgUnitUpdateInput,
) {
  return prisma.orgUnit.update({
    where: { id },
    data,
    include: orgInclude,
  });
}

export async function softDeleteOrgUnit(id: string, actorId: string) {
  return prisma.orgUnit.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "INACTIVE",
      updatedById: actorId,
    },
    include: orgInclude,
  });
}

export async function countActiveChildren(id: string) {
  return prisma.orgUnit.count({
    where: { parentId: id, deletedAt: null },
  });
}

export async function countActiveUsers(id: string) {
  return prisma.user.count({
    where: {
      orgUnitId: id,
      deletedAt: null,
      status: { in: ["ACTIVE", "INVITED"] },
    },
  });
}

/** Collect id + all descendant ids (BFS). */
export async function collectDescendantIds(rootId: string): Promise<string[]> {
  const result: string[] = [];
  let frontier = [rootId];

  while (frontier.length) {
    const children = await prisma.orgUnit.findMany({
      where: { parentId: { in: frontier }, deletedAt: null },
      select: { id: true },
    });
    frontier = children.map((c) => c.id);
    result.push(...frontier);
  }

  return result;
}

/** Ancestors from unit up to root (nearest parent first). */
export async function getAncestorChain(id: string) {
  const chain: Array<{
    id: string;
    code: string;
    name: string;
    type: OrgUnitType;
  }> = [];
  let currentId: string | null = id;

  while (currentId) {
    const unit: {
      id: string;
      code: string;
      name: string;
      type: OrgUnitType;
      parentId: string | null;
    } | null = await prisma.orgUnit.findFirst({
      where: { id: currentId, deletedAt: null },
      select: { id: true, code: true, name: true, type: true, parentId: true },
    });
    if (!unit) break;
    chain.push({
      id: unit.id,
      code: unit.code,
      name: unit.name,
      type: unit.type,
    });
    currentId = unit.parentId;
  }

  return chain.reverse();
}

export async function listUsersInOrgUnit(orgUnitId: string) {
  return prisma.user.findMany({
    where: {
      orgUnitId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function assignUsersToOrgUnit(
  orgUnitId: string,
  userIds: string[],
  actorId: string,
) {
  return prisma.$transaction(async (tx) => {
    // Clear users currently on this unit who are not in the new set
    await tx.user.updateMany({
      where: {
        orgUnitId,
        id: { notIn: userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"] },
        deletedAt: null,
      },
      data: { orgUnitId: null, updatedById: actorId },
    });

    if (userIds.length) {
      await tx.user.updateMany({
        where: { id: { in: userIds }, deletedAt: null },
        data: { orgUnitId, updatedById: actorId },
      });
    }

    return tx.user.findMany({
      where: { orgUnitId, deletedAt: null },
      select: { id: true, name: true, email: true, status: true },
      orderBy: { name: "asc" },
    });
  });
}

export async function listAssignableUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null, status: { in: ["ACTIVE", "INVITED"] } },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      orgUnitId: true,
    },
    orderBy: { name: "asc" },
    take: 500,
  });
}
