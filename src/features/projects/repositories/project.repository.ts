import type { Prisma, ProjectStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/db";
import type {
  ListProjectMembersQuery,
  ListProjectsQuery,
} from "../schemas/project.schemas";

const projectInclude = {
  orgUnit: {
    select: { id: true, code: true, name: true, type: true },
  },
  projectManager: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  mainContractor: {
    select: { id: true, code: true, name: true },
  },
  _count: {
    select: {
      members: {
        where: { deletedAt: null },
      },
    },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectRecord = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

const memberInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      avatarUrl: true,
    },
  },
  employee: {
    select: { id: true, code: true, name: true },
  },
  contractor: {
    select: { id: true, code: true, name: true },
  },
  role: {
    select: { id: true, code: true, name: true },
  },
} satisfies Prisma.ProjectMemberInclude;

export type ProjectMemberRecord = Prisma.ProjectMemberGetPayload<{
  include: typeof memberInclude;
}>;

export async function listProjects(
  query: ListProjectsQuery,
  visibleIds?: string[] | null,
) {
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.orgUnitId ? { orgUnitId: query.orgUnitId } : {}),
    ...(visibleIds ? { id: { in: visibleIds } } : {}),
  };

  if (!query.includeArchived && !query.status) {
    where.status = { not: "ARCHIVED" };
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { code: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { clientOwner: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProjectOrderByWithRelationInput = {
    [query.sort]: query.order,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getProjectById(id: string) {
  return prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: projectInclude,
  });
}

export async function createProject(data: {
  code: string;
  name: string;
  description?: string | null;
  location?: string | null;
  status: ProjectStatus;
  projectType?: Prisma.ProjectCreateInput["projectType"];
  projectPriority?: Prisma.ProjectCreateInput["projectPriority"];
  clientOwner?: string | null;
  consultant?: string | null;
  mainContractorId?: string | null;
  fiscalYear?: number | null;
  gpsLatitude?: Prisma.Decimal | number | null;
  gpsLongitude?: Prisma.Decimal | number | null;
  logoUrl?: string | null;
  internalNotes?: string | null;
  startDate?: Date | null;
  expectedEndDate?: Date | null;
  actualEndDate?: Date | null;
  orgUnitId?: string | null;
  projectManagerId?: string | null;
  currencyCode: string;
  timezone: string;
  defaultWarehouseId?: string | null;
  createdById?: string | null;
}) {
  return prisma.project.create({
    data: {
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description ?? null,
      location: data.location ?? null,
      status: data.status,
      projectType: data.projectType ?? "RESIDENTIAL",
      projectPriority: data.projectPriority ?? "MEDIUM",
      clientOwner: data.clientOwner ?? null,
      consultant: data.consultant ?? null,
      mainContractorId: data.mainContractorId ?? null,
      fiscalYear: data.fiscalYear ?? null,
      gpsLatitude: data.gpsLatitude ?? null,
      gpsLongitude: data.gpsLongitude ?? null,
      logoUrl: data.logoUrl ?? null,
      internalNotes: data.internalNotes ?? null,
      startDate: data.startDate ?? null,
      expectedEndDate: data.expectedEndDate ?? null,
      actualEndDate: data.actualEndDate ?? null,
      orgUnitId: data.orgUnitId ?? null,
      projectManagerId: data.projectManagerId ?? null,
      currencyCode: data.currencyCode,
      timezone: data.timezone,
      defaultWarehouseId: data.defaultWarehouseId ?? null,
      createdById: data.createdById ?? null,
      updatedById: data.createdById ?? null,
    },
    include: projectInclude,
  });
}

export async function updateProject(
  id: string,
  data: Prisma.ProjectUpdateInput,
) {
  return prisma.project.update({
    where: { id },
    data,
    include: projectInclude,
  });
}

export async function softDeleteProject(id: string, updatedById?: string | null) {
  return prisma.project.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedById,
    },
    include: projectInclude,
  });
}

export async function archiveProject(
  id: string,
  previousStatus: ProjectStatus,
  updatedById?: string | null,
) {
  return prisma.project.update({
    where: { id },
    data: {
      statusBeforeArchive: previousStatus,
      status: "ARCHIVED",
      updatedById,
    },
    include: projectInclude,
  });
}

export async function restoreProject(
  id: string,
  restoredStatus: ProjectStatus,
  updatedById?: string | null,
) {
  return prisma.project.update({
    where: { id },
    data: {
      status: restoredStatus,
      statusBeforeArchive: null,
      deletedAt: null,
      updatedById,
    },
    include: projectInclude,
  });
}

export async function listProjectMembers(
  projectId: string,
  query?: ListProjectMembersQuery,
) {
  const where: Prisma.ProjectMemberWhereInput = {
    projectId,
    deletedAt: null,
    ...(query?.status ? { user: { status: query.status } } : {}),
    ...(query?.roleId ? { roleId: query.roleId } : {}),
    ...(query?.q
      ? {
          OR: [
            { user: { name: { contains: query.q, mode: "insensitive" } } },
            { user: { email: { contains: query.q, mode: "insensitive" } } },
            { roleHint: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProjectMemberOrderByWithRelationInput[] =
    query?.sort === "name"
      ? [{ user: { name: query.order ?? "asc" } }]
      : query?.sort === "email"
        ? [{ user: { email: query.order ?? "asc" } }]
        : [{ createdAt: query?.order ?? "asc" }];

  if (!query) {
    return prisma.projectMember.findMany({
      where: { projectId, deletedAt: null },
      include: memberInclude,
      orderBy: [{ createdAt: "asc" }],
    });
  }

  const [total, rows] = await prisma.$transaction([
    prisma.projectMember.count({ where }),
    prisma.projectMember.findMany({
      where,
      include: memberInclude,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function replaceProjectMembers(
  projectId: string,
  members: Array<{
    userId: string;
    employeeId?: string | null;
    contractorId?: string | null;
    roleId?: string | null;
    roleHint?: string | null;
    createdById?: string | null;
  }>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.projectMember.updateMany({
      where: { projectId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (members.length === 0) return [];

    await tx.projectMember.createMany({
      data: members.map((m) => ({
        projectId,
        userId: m.userId,
        employeeId: m.employeeId ?? null,
        contractorId: m.contractorId ?? null,
        roleId: m.roleId ?? null,
        roleHint: m.roleHint ?? null,
        createdById: m.createdById ?? null,
      })),
      skipDuplicates: true,
    });

    return tx.projectMember.findMany({
      where: { projectId, deletedAt: null },
      include: memberInclude,
      orderBy: [{ createdAt: "asc" }],
    });
  });
}

export async function listMemberProjectIds(userId: string) {
  const rows = await prisma.projectMember.findMany({
    where: {
      userId,
      deletedAt: null,
      project: { deletedAt: null },
    },
    select: { projectId: true },
  });
  return rows.map((r) => r.projectId);
}

export async function getUserProjectContext(userId: string) {
  return prisma.userProjectContext.findUnique({
    where: { userId },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
    },
  });
}

export async function setUserProjectContext(
  userId: string,
  projectId: string | null,
) {
  return prisma.userProjectContext.upsert({
    where: { userId },
    create: { userId, projectId },
    update: { projectId },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
    },
  });
}

export async function listContextProjects(
  userId: string,
  visibleIds?: string[] | null,
) {
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    status: { not: "ARCHIVED" },
    ...(visibleIds ? { id: { in: visibleIds } } : {}),
  };

  return prisma.project.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
    },
    orderBy: [{ name: "asc" }],
    take: 200,
  });
}

export async function listProjectAuditEvents(
  projectId: string,
  limit = 30,
) {
  return prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "Project", entityId: projectId },
        { projectId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      actorId: true,
      entityType: true,
      entityId: true,
      meta: true,
      before: true,
      after: true,
      createdAt: true,
    },
  });
}

export async function getProjectMemberPreview(projectId: string, take = 5) {
  return prisma.projectMember.findMany({
    where: { projectId, deletedAt: null },
    include: memberInclude,
    orderBy: { createdAt: "asc" },
    take,
  });
}
