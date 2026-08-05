import {
  ForbiddenError,
  NotFoundError,
  ValidationAppError,
} from "@/domain/errors";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { requirePermission } from "@/domain/policies/require-permission";
import { writeAuditLogAsync } from "@/features/auth/services/audit.service";
import {
  invalidateUserPermissionCache,
  resolveVisibilityContext,
} from "@/features/rbac/services/access.service";
import { allocateProjectCode } from "@/infrastructure/numbering/number-sequence.service";
import { prisma } from "@/infrastructure/db";
import {
  toActivityEvent,
  toProjectDto,
  toProjectMemberDto,
} from "../mappers";
import {
  archiveProject,
  createProject,
  getProjectById,
  listMemberProjectIds,
  listProjectAuditEvents,
  listProjectMembers,
  listProjects,
  replaceProjectMembers,
  restoreProject,
  softDeleteProject,
  updateProject,
} from "../repositories/project.repository";
import type {
  CreateProjectInput,
  ListProjectActivityQuery,
  ListProjectMembersQuery,
  ListProjectsQuery,
  SetProjectMembersInput,
  UpdateProjectInput,
} from "../schemas/project.schemas";

async function resolveVisibleProjectIds(actorId: string): Promise<string[] | null> {
  const ctx = await resolveVisibilityContext(actorId);
  if (!ctx) return [];
  if (ctx.globalRead || ctx.isSuperAdmin) return null;

  const memberIds = await listMemberProjectIds(actorId);
  const scoped = new Set([...ctx.projectIds, ...memberIds]);
  return [...scoped];
}

async function assertProjectVisible(actorId: string, projectId: string) {
  const visible = await resolveVisibleProjectIds(actorId);
  if (visible && !visible.includes(projectId)) {
    throw new ForbiddenError("You cannot access this project.");
  }
}

function mapSettingsInput(
  input: Partial<CreateProjectInput & UpdateProjectInput>,
) {
  return {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.projectType !== undefined ? { projectType: input.projectType } : {}),
    ...(input.projectPriority !== undefined
      ? { projectPriority: input.projectPriority }
      : {}),
    ...(input.clientOwner !== undefined ? { clientOwner: input.clientOwner } : {}),
    ...(input.consultant !== undefined ? { consultant: input.consultant } : {}),
    ...(input.mainContractorId !== undefined
      ? { mainContractorId: input.mainContractorId }
      : {}),
    ...(input.fiscalYear !== undefined ? { fiscalYear: input.fiscalYear } : {}),
    ...(input.gpsLatitude !== undefined ? { gpsLatitude: input.gpsLatitude } : {}),
    ...(input.gpsLongitude !== undefined ? { gpsLongitude: input.gpsLongitude } : {}),
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    ...(input.internalNotes !== undefined
      ? { internalNotes: input.internalNotes }
      : {}),
    ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
    ...(input.expectedEndDate !== undefined
      ? { expectedEndDate: input.expectedEndDate }
      : {}),
    ...(input.actualEndDate !== undefined ? { actualEndDate: input.actualEndDate } : {}),
    ...(input.orgUnitId !== undefined ? { orgUnitId: input.orgUnitId } : {}),
    ...(input.projectManagerId !== undefined
      ? { projectManagerId: input.projectManagerId }
      : {}),
    ...(input.currencyCode !== undefined ? { currencyCode: input.currencyCode } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.defaultWarehouseId !== undefined
      ? { defaultWarehouseId: input.defaultWarehouseId }
      : {}),
  };
}

async function syncProjectScopedRoles(
  projectId: string,
  members: SetProjectMembersInput["members"],
  assignedBy: string,
) {
  const userIds = members.map((m) => m.userId);

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({
      where: {
        scopeType: "PROJECT",
        projectId,
      },
    });

    const withRoles = members.filter((m) => m.roleId);
    if (withRoles.length) {
      await tx.userRole.createMany({
        data: withRoles.map((m) => ({
          userId: m.userId,
          roleId: m.roleId!,
          scopeType: "PROJECT",
          projectId,
          assignedBy,
        })),
      });
    }
  });

  for (const userId of userIds) {
    invalidateUserPermissionCache(userId);
  }
}

function auditMemberChanges(
  projectId: string,
  actorId: string,
  beforeIds: Set<string>,
  afterIds: Set<string>,
) {
  for (const userId of afterIds) {
    if (!beforeIds.has(userId)) {
      writeAuditLogAsync({
        actorId,
        action: "projects.members.add",
        entityType: "Project",
        entityId: projectId,
        projectId,
        meta: { userId },
      });
    }
  }
  for (const userId of beforeIds) {
    if (!afterIds.has(userId)) {
      writeAuditLogAsync({
        actorId,
        action: "projects.members.remove",
        entityType: "Project",
        entityId: projectId,
        projectId,
        meta: { userId },
      });
    }
  }
}

export const projectsService = {
  async list(query: ListProjectsQuery) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    const visibleIds = await resolveVisibleProjectIds(actor.id);
    if (visibleIds && visibleIds.length === 0) {
      return {
        data: [],
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
          sort: query.sort,
          order: query.order,
        },
      };
    }

    const { total, rows } = await listProjects(query, visibleIds);
    return {
      data: rows.map(toProjectDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        sort: query.sort,
        order: query.order,
      },
    };
  },

  async getById(id: string) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    await assertProjectVisible(actor.id, id);
    const project = await getProjectById(id);
    if (!project) throw new NotFoundError("Project", id);
    return toProjectDto(project);
  },

  async create(input: CreateProjectInput) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_CREATE);
    const code = await allocateProjectCode();

    const project = await createProject({
      code,
      name: input.name,
      status: input.status,
      currencyCode: input.currencyCode,
      timezone: input.timezone,
      createdById: actor.id,
      ...mapSettingsInput(input),
    });

    await replaceProjectMembers(project.id, [
      {
        userId: actor.id,
        createdById: actor.id,
      },
    ]);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "projects.create",
      entityType: "Project",
      entityId: project.id,
      projectId: project.id,
      after: { code: project.code, name: project.name, status: project.status },
    });

    invalidateUserPermissionCache(actor.id);
    return toProjectDto(project);
  },

  async update(id: string, input: UpdateProjectInput) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_UPDATE);
    await assertProjectVisible(actor.id, id);

    const existing = await getProjectById(id);
    if (!existing) throw new NotFoundError("Project", id);

    if (existing.status === "ARCHIVED") {
      throw new ValidationAppError(
        "Archived projects are read-only. Restore before editing.",
      );
    }

    const project = await updateProject(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...mapSettingsInput(input),
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "projects.update",
      entityType: "Project",
      entityId: id,
      projectId: id,
      before: { status: existing.status, name: existing.name },
      after: { status: project.status, name: project.name },
    });

    return toProjectDto(project);
  },

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_ARCHIVE);
    await assertProjectVisible(actor.id, id);

    const existing = await getProjectById(id);
    if (!existing) throw new NotFoundError("Project", id);

    const project = await softDeleteProject(id, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "projects.delete",
      entityType: "Project",
      entityId: id,
      projectId: id,
      before: { code: existing.code },
    });

    return toProjectDto(project);
  },

  async archive(id: string) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_ARCHIVE);
    await assertProjectVisible(actor.id, id);

    const existing = await getProjectById(id);
    if (!existing) throw new NotFoundError("Project", id);

    if (existing.status === "ARCHIVED") {
      return toProjectDto(existing);
    }

    const previousStatus = existing.status;
    const project = await archiveProject(id, previousStatus, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "projects.archive",
      entityType: "Project",
      entityId: id,
      projectId: id,
      before: { status: previousStatus },
      after: { status: project.status, statusBeforeArchive: previousStatus },
    });

    return toProjectDto(project);
  },

  async restore(id: string) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_ARCHIVE);
    await assertProjectVisible(actor.id, id);

    const existing = await prisma.project.findFirst({ where: { id } });
    if (!existing) throw new NotFoundError("Project", id);

    const restoredStatus =
      existing.statusBeforeArchive && existing.statusBeforeArchive !== "ARCHIVED"
        ? existing.statusBeforeArchive
        : "ACTIVE";

    const project = await restoreProject(id, restoredStatus, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "projects.restore",
      entityType: "Project",
      entityId: id,
      projectId: id,
      before: {
        status: existing.status,
        statusBeforeArchive: existing.statusBeforeArchive,
      },
      after: { status: project.status },
    });

    return toProjectDto(project);
  },

  async listMembers(projectId: string, query?: ListProjectMembersQuery) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    await assertProjectVisible(actor.id, projectId);

    const project = await getProjectById(projectId);
    if (!project) throw new NotFoundError("Project", projectId);

    const result = await listProjectMembers(projectId, query);

    if (Array.isArray(result)) {
      return {
        data: result.map(toProjectMemberDto),
        meta: {
          page: 1,
          pageSize: result.length,
          total: result.length,
          totalPages: 1,
        },
      };
    }

    return {
      data: result.rows.map(toProjectMemberDto),
      meta: {
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 20,
        total: result.total,
        totalPages: Math.max(
          1,
          Math.ceil(result.total / (query?.pageSize ?? 20)),
        ),
        sort: query?.sort,
        order: query?.order,
      },
    };
  },

  async listActivity(projectId: string, query: ListProjectActivityQuery) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    await assertProjectVisible(actor.id, projectId);

    const rows = await listProjectAuditEvents(projectId, query.limit);
    return rows.map(toActivityEvent);
  },

  async setMembers(projectId: string, input: SetProjectMembersInput) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_MEMBERS);
    await assertProjectVisible(actor.id, projectId);

    const project = await getProjectById(projectId);
    if (!project) throw new NotFoundError("Project", projectId);

    if (project.status === "ARCHIVED") {
      throw new ValidationAppError("Cannot change members on an archived project.");
    }

    const before = await listProjectMembers(projectId);
    const beforeIds = new Set(
      Array.isArray(before) ? before.map((m) => m.userId) : before.rows.map((m) => m.userId),
    );

    const members = await replaceProjectMembers(
      projectId,
      input.members.map((m) => ({
        userId: m.userId,
        employeeId: m.employeeId,
        contractorId: m.contractorId,
        roleId: m.roleId,
        roleHint: m.roleHint,
        createdById: actor.id,
      })),
    );

    const afterIds = new Set(members.map((m) => m.userId));
    auditMemberChanges(projectId, actor.id, beforeIds, afterIds);

    await syncProjectScopedRoles(projectId, input.members, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "projects.members.update",
      entityType: "Project",
      entityId: projectId,
      projectId,
      meta: { memberCount: members.length },
    });

    return members.map(toProjectMemberDto);
  },
};

export const projectContextService = {
  async get(actorId: string) {
    await requirePermission(PERMISSIONS.PROJECTS_READ);
    const visibleIds = await resolveVisibleProjectIds(actorId);
    const { getUserProjectContext, listContextProjects } = await import(
      "../repositories/project.repository"
    );

    const ctx = await getUserProjectContext(actorId);
    const available = await listContextProjects(actorId, visibleIds);

    let projectId = ctx?.projectId ?? null;
    if (projectId && visibleIds && !visibleIds.includes(projectId)) {
      projectId = null;
    }

    const project =
      projectId
        ? available.find((p) => p.id === projectId) ?? ctx?.project ?? null
        : null;

    return {
      projectId,
      project,
      availableProjects: available,
    };
  },

  async set(actorId: string, projectId: string | null) {
    await requirePermission(PERMISSIONS.PROJECTS_READ);

    const { setUserProjectContext } = await import("../repositories/project.repository");

    if (projectId) {
      const visible = await resolveVisibleProjectIds(actorId);
      if (visible && !visible.includes(projectId)) {
        throw new ForbiddenError("You are not a member of this project.");
      }
      const project = await getProjectById(projectId);
      if (!project) throw new NotFoundError("Project", projectId);
    }

    const ctx = await setUserProjectContext(actorId, projectId);

    writeAuditLogAsync({
      actorId,
      action: "projects.context.switch",
      entityType: "UserProjectContext",
      entityId: actorId,
      projectId: projectId ?? undefined,
      meta: { projectId },
    });

    return {
      projectId: ctx.projectId,
      project: ctx.project,
    };
  },
};

export { resolveVisibleProjectIds };
