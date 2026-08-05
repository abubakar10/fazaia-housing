import {
  ForbiddenError,
  NotFoundError,
  ValidationAppError,
} from "@/domain/errors";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { requirePermission } from "@/domain/policies/require-permission";
import { writeAuditLogAsync } from "@/features/auth/services/audit.service";
import { resolveVisibleProjectIds } from "@/features/projects/services/projects.service";
import {
  allocateBlockCode,
  allocatePhaseCode,
  allocateSectorCode,
} from "@/infrastructure/numbering/number-sequence.service";
import {
  buildProjectHierarchy,
  toBlockDto,
  toPhaseDto,
  toSectorDto,
  type StructureBreadcrumbItem,
} from "../mappers";
import {
  countActiveBlocks,
  countActiveSectors,
  countStructureForProject,
  createBlock,
  createPhase,
  createSector,
  findBlockCodeConflict,
  findPhaseCodeConflict,
  findSectorCodeConflict,
  getBlockById,
  getPhaseById,
  getProjectExists,
  getSectorById,
  listBlocks,
  listPhases,
  listSectors,
  loadProjectHierarchyRows,
  softDeleteBlock,
  softDeletePhase,
  softDeleteSector,
  updateBlock,
  updatePhase,
  updateSector,
} from "../repositories/structure.repository";
import type {
  BulkCreateBlocksInput,
  BulkCreatePhasesInput,
  BulkCreateSectorsInput,
  CreateBlockInput,
  CreatePhaseInput,
  CreateSectorInput,
  ListBlocksQuery,
  ListPhasesQuery,
  ListSectorsQuery,
  UpdateBlockInput,
  UpdatePhaseInput,
  UpdateSectorInput,
} from "../schemas/structure.schemas";

async function assertProjectVisible(actorId: string, projectId: string) {
  const visible = await resolveVisibleProjectIds(actorId);
  if (visible && !visible.includes(projectId)) {
    throw new ForbiddenError("You cannot access this project.");
  }
}

async function assertProjectActive(projectId: string) {
  const project = await getProjectExists(projectId);
  if (!project) throw new NotFoundError("Project", projectId);
  if (project.status === "ARCHIVED") {
    throw new ValidationAppError("Cannot modify structure on an archived project.");
  }
  return project;
}

function mapPrismaUnique(error: unknown, message: string): never {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    throw new ValidationAppError(message);
  }
  throw error;
}

function listMeta(
  total: number,
  page: number,
  pageSize: number,
  sort?: string,
  order?: "asc" | "desc",
) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    sort,
    order,
  };
}

export const hierarchyService = {
  async get(projectId: string, includeArchived = false) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    await assertProjectVisible(actor.id, projectId);

    const project = await getProjectExists(projectId);
    if (!project) throw new NotFoundError("Project", projectId);

    const rows = await loadProjectHierarchyRows(projectId, includeArchived);
    return buildProjectHierarchy({ projectId, phases: rows });
  },

  async counts(projectId: string) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    await assertProjectVisible(actor.id, projectId);
    return countStructureForProject(projectId);
  },

  async breadcrumb(input: {
    projectId: string;
    phaseId?: string;
    sectorId?: string;
    blockId?: string;
  }) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    await assertProjectVisible(actor.id, input.projectId);

    const project = await getProjectExists(input.projectId);
    if (!project) throw new NotFoundError("Project", input.projectId);

    const items: StructureBreadcrumbItem[] = [
      {
        id: project.id,
        type: "project",
        code: project.code,
        name: project.name,
      },
    ];

    if (input.phaseId) {
      const phase = await getPhaseById(input.phaseId);
      if (!phase || phase.projectId !== input.projectId) {
        throw new NotFoundError("Phase", input.phaseId);
      }
      items.push({
        id: phase.id,
        type: "phase",
        code: phase.code,
        name: phase.name,
      });
    }

    if (input.sectorId) {
      const sector = await getSectorById(input.sectorId);
      if (!sector || sector.projectId !== input.projectId) {
        throw new NotFoundError("Sector", input.sectorId);
      }
      if (!input.phaseId) {
        const phase = await getPhaseById(sector.phaseId);
        if (phase) {
          items.push({
            id: phase.id,
            type: "phase",
            code: phase.code,
            name: phase.name,
          });
        }
      }
      items.push({
        id: sector.id,
        type: "sector",
        code: sector.code,
        name: sector.name,
      });
    }

    if (input.blockId) {
      const block = await getBlockById(input.blockId);
      if (!block || block.projectId !== input.projectId) {
        throw new NotFoundError("Block", input.blockId);
      }
      if (!input.sectorId) {
        const sector = await getSectorById(block.sectorId);
        if (sector) {
          if (!input.phaseId) {
            const phase = await getPhaseById(sector.phaseId);
            if (phase) {
              items.push({
                id: phase.id,
                type: "phase",
                code: phase.code,
                name: phase.name,
              });
            }
          }
          items.push({
            id: sector.id,
            type: "sector",
            code: sector.code,
            name: sector.name,
          });
        }
      }
      items.push({
        id: block.id,
        type: "block",
        code: block.code,
        name: block.name,
      });
    }

    return items;
  },
};

export const phasesService = {
  async list(query: ListPhasesQuery) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    await assertProjectVisible(actor.id, query.projectId);

    const { total, rows } = await listPhases(query);
    return {
      data: rows.map(toPhaseDto),
      meta: listMeta(total, query.page, query.pageSize, query.sort, query.order),
    };
  },

  async get(id: string) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    const phase = await getPhaseById(id);
    if (!phase) throw new NotFoundError("Phase", id);
    await assertProjectVisible(actor.id, phase.projectId);
    return toPhaseDto(phase);
  },

  async create(input: CreatePhaseInput) {
    const actor = await requirePermission(PERMISSIONS.PHASES_MANAGE);
    await assertProjectVisible(actor.id, input.projectId);
    await assertProjectActive(input.projectId);

    const code = input.code?.trim()
      ? input.code.trim().toUpperCase()
      : await allocatePhaseCode(input.projectId);

    if (await findPhaseCodeConflict(input.projectId, code)) {
      throw new ValidationAppError(`Phase code ${code} already exists in this project.`);
    }

    try {
      const phase = await createPhase({
        code,
        name: input.name,
        description: input.description ?? null,
        status: input.status ?? "ACTIVE",
        sortOrder: input.sortOrder ?? 0,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        createdById: actor.id,
        updatedById: actor.id,
        project: { connect: { id: input.projectId } },
      });

      writeAuditLogAsync({
        actorId: actor.id,
        action: "phases.create",
        entityType: "Phase",
        entityId: phase.id,
        projectId: input.projectId,
        after: { code: phase.code, name: phase.name },
      });

      return toPhaseDto(phase);
    } catch (error) {
      mapPrismaUnique(error, `Phase code ${code} already exists in this project.`);
    }
  },

  async update(id: string, input: UpdatePhaseInput) {
    const actor = await requirePermission(PERMISSIONS.PHASES_MANAGE);
    const existing = await getPhaseById(id);
    if (!existing) throw new NotFoundError("Phase", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);

    if (input.version !== undefined && input.version !== existing.version) {
      throw new ValidationAppError("Phase was modified by another user. Refresh and try again.");
    }

    if (input.code) {
      const code = input.code.toUpperCase();
      if (await findPhaseCodeConflict(existing.projectId, code, id)) {
        throw new ValidationAppError(`Phase code ${code} already exists in this project.`);
      }
    }

    try {
      const phase = await updatePhase(id, {
        ...(input.code !== undefined ? { code: input.code.toUpperCase() } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
        version: { increment: 1 },
        updatedById: actor.id,
      });

      writeAuditLogAsync({
        actorId: actor.id,
        action: "phases.update",
        entityType: "Phase",
        entityId: id,
        projectId: existing.projectId,
        before: { code: existing.code, name: existing.name, status: existing.status },
        after: { code: phase.code, name: phase.name, status: phase.status },
      });

      return toPhaseDto(phase);
    } catch (error) {
      mapPrismaUnique(error, "Phase code already exists in this project.");
    }
  },

  async archive(id: string) {
    const actor = await requirePermission(PERMISSIONS.PHASES_MANAGE);
    const existing = await getPhaseById(id);
    if (!existing) throw new NotFoundError("Phase", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);

    if (existing.status === "ARCHIVED") return toPhaseDto(existing);

    const phase = await updatePhase(id, {
      statusBeforeArchive: existing.status,
      status: "ARCHIVED",
      version: { increment: 1 },
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "phases.archive",
      entityType: "Phase",
      entityId: id,
      projectId: existing.projectId,
      before: { status: existing.status },
      after: { status: "ARCHIVED" },
    });

    return toPhaseDto(phase);
  },

  async restore(id: string) {
    const actor = await requirePermission(PERMISSIONS.PHASES_MANAGE);
    const existing = await getPhaseById(id);
    if (!existing) throw new NotFoundError("Phase", id);
    await assertProjectVisible(actor.id, existing.projectId);

    const restoredStatus =
      existing.statusBeforeArchive && existing.statusBeforeArchive !== "ARCHIVED"
        ? existing.statusBeforeArchive
        : "ACTIVE";

    const phase = await updatePhase(id, {
      status: restoredStatus,
      statusBeforeArchive: null,
      deletedAt: null,
      version: { increment: 1 },
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "phases.restore",
      entityType: "Phase",
      entityId: id,
      projectId: existing.projectId,
      before: { status: existing.status },
      after: { status: phase.status },
    });

    return toPhaseDto(phase);
  },

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.PHASES_MANAGE);
    const existing = await getPhaseById(id);
    if (!existing) throw new NotFoundError("Phase", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);

    const childCount = await countActiveSectors(id);
    if (childCount > 0) {
      throw new ValidationAppError(
        `Cannot delete phase with ${childCount} sector(s). Remove or reassign children first.`,
      );
    }

    const phase = await softDeletePhase(id, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "phases.delete",
      entityType: "Phase",
      entityId: id,
      projectId: existing.projectId,
      before: { code: existing.code, name: existing.name },
    });

    return toPhaseDto(phase);
  },

  async bulkCreate(input: BulkCreatePhasesInput) {
    const actor = await requirePermission(PERMISSIONS.PHASES_MANAGE);
    await assertProjectVisible(actor.id, input.projectId);
    await assertProjectActive(input.projectId);

    const created = [];
    for (const item of input.items) {
      const phase = await this.create({
        projectId: input.projectId,
        code: item.code,
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder ?? 0,
      });
      created.push(phase);
    }
    return created;
  },

  async bulkArchive(ids: string[]) {
    const results = [];
    for (const id of ids) {
      results.push(await this.archive(id));
    }
    return results;
  },

  async bulkRestore(ids: string[]) {
    const results = [];
    for (const id of ids) {
      results.push(await this.restore(id));
    }
    return results;
  },

  async bulkDelete(ids: string[]) {
    const results = [];
    for (const id of ids) {
      results.push(await this.softDelete(id));
    }
    return results;
  },
};

export const sectorsService = {
  async list(query: ListSectorsQuery) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);

    let projectId = query.projectId;
    if (!projectId && query.phaseId) {
      const phase = await getPhaseById(query.phaseId);
      if (!phase) throw new NotFoundError("Phase", query.phaseId);
      projectId = phase.projectId;
    }
    if (!projectId) throw new ValidationAppError("projectId or phaseId is required");
    await assertProjectVisible(actor.id, projectId);

    const { total, rows } = await listSectors(query);
    return {
      data: rows.map(toSectorDto),
      meta: listMeta(total, query.page, query.pageSize, query.sort, query.order),
    };
  },

  async get(id: string) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    const sector = await getSectorById(id);
    if (!sector) throw new NotFoundError("Sector", id);
    await assertProjectVisible(actor.id, sector.projectId);
    return toSectorDto(sector);
  },

  async create(input: CreateSectorInput) {
    const actor = await requirePermission(PERMISSIONS.SECTORS_MANAGE);
    const phase = await getPhaseById(input.phaseId);
    if (!phase) throw new NotFoundError("Phase", input.phaseId);
    await assertProjectVisible(actor.id, phase.projectId);
    await assertProjectActive(phase.projectId);

    if (phase.status === "ARCHIVED") {
      throw new ValidationAppError("Cannot add sectors to an archived phase.");
    }

    const code = input.code?.trim()
      ? input.code.trim().toUpperCase()
      : await allocateSectorCode(input.phaseId);

    if (await findSectorCodeConflict(input.phaseId, code)) {
      throw new ValidationAppError(`Sector code ${code} already exists in this phase.`);
    }

    try {
      const sector = await createSector({
        code,
        name: input.name,
        description: input.description ?? null,
        status: input.status ?? "ACTIVE",
        sortOrder: input.sortOrder ?? 0,
        createdById: actor.id,
        updatedById: actor.id,
        phase: { connect: { id: input.phaseId } },
        project: { connect: { id: phase.projectId } },
      });

      writeAuditLogAsync({
        actorId: actor.id,
        action: "sectors.create",
        entityType: "Sector",
        entityId: sector.id,
        projectId: phase.projectId,
        after: { code: sector.code, name: sector.name, phaseId: input.phaseId },
      });

      return toSectorDto(sector);
    } catch (error) {
      mapPrismaUnique(error, `Sector code ${code} already exists in this phase.`);
    }
  },

  async update(id: string, input: UpdateSectorInput) {
    const actor = await requirePermission(PERMISSIONS.SECTORS_MANAGE);
    const existing = await getSectorById(id);
    if (!existing) throw new NotFoundError("Sector", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);

    if (input.version !== undefined && input.version !== existing.version) {
      throw new ValidationAppError("Sector was modified by another user. Refresh and try again.");
    }

    let nextPhaseId = existing.phaseId;
    let nextProjectId = existing.projectId;

    if (input.phaseId && input.phaseId !== existing.phaseId) {
      const targetPhase = await getPhaseById(input.phaseId);
      if (!targetPhase) throw new NotFoundError("Phase", input.phaseId);
      if (targetPhase.projectId !== existing.projectId) {
        throw new ValidationAppError("Cannot move sector into a phase from another project.");
      }
      if (targetPhase.status === "ARCHIVED") {
        throw new ValidationAppError("Cannot move sector into an archived phase.");
      }
      nextPhaseId = targetPhase.id;
      nextProjectId = targetPhase.projectId;
    }

    const nextCode = input.code?.toUpperCase() ?? existing.code;
    if (
      nextCode !== existing.code ||
      nextPhaseId !== existing.phaseId
    ) {
      if (await findSectorCodeConflict(nextPhaseId, nextCode, id)) {
        throw new ValidationAppError(`Sector code ${nextCode} already exists in the target phase.`);
      }
    }

    try {
      const sector = await updateSector(id, {
        ...(input.code !== undefined ? { code: input.code.toUpperCase() } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.phaseId
          ? {
              phase: { connect: { id: nextPhaseId } },
              project: { connect: { id: nextProjectId } },
            }
          : {}),
        version: { increment: 1 },
        updatedById: actor.id,
      });

      const moved = input.phaseId && input.phaseId !== existing.phaseId;
      writeAuditLogAsync({
        actorId: actor.id,
        action: moved ? "sectors.move" : "sectors.update",
        entityType: "Sector",
        entityId: id,
        projectId: existing.projectId,
        before: { phaseId: existing.phaseId, code: existing.code },
        after: { phaseId: sector.phaseId, code: sector.code },
      });

      return toSectorDto(sector);
    } catch (error) {
      mapPrismaUnique(error, "Sector code already exists in the target phase.");
    }
  },

  async archive(id: string) {
    const actor = await requirePermission(PERMISSIONS.SECTORS_MANAGE);
    const existing = await getSectorById(id);
    if (!existing) throw new NotFoundError("Sector", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);
    if (existing.status === "ARCHIVED") return toSectorDto(existing);

    const sector = await updateSector(id, {
      statusBeforeArchive: existing.status,
      status: "ARCHIVED",
      version: { increment: 1 },
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "sectors.archive",
      entityType: "Sector",
      entityId: id,
      projectId: existing.projectId,
      before: { status: existing.status },
      after: { status: "ARCHIVED" },
    });

    return toSectorDto(sector);
  },

  async restore(id: string) {
    const actor = await requirePermission(PERMISSIONS.SECTORS_MANAGE);
    const existing = await getSectorById(id);
    if (!existing) throw new NotFoundError("Sector", id);
    await assertProjectVisible(actor.id, existing.projectId);

    const restoredStatus =
      existing.statusBeforeArchive && existing.statusBeforeArchive !== "ARCHIVED"
        ? existing.statusBeforeArchive
        : "ACTIVE";

    const sector = await updateSector(id, {
      status: restoredStatus,
      statusBeforeArchive: null,
      deletedAt: null,
      version: { increment: 1 },
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "sectors.restore",
      entityType: "Sector",
      entityId: id,
      projectId: existing.projectId,
      before: { status: existing.status },
      after: { status: sector.status },
    });

    return toSectorDto(sector);
  },

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.SECTORS_MANAGE);
    const existing = await getSectorById(id);
    if (!existing) throw new NotFoundError("Sector", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);

    const childCount = await countActiveBlocks(id);
    if (childCount > 0) {
      throw new ValidationAppError(
        `Cannot delete sector with ${childCount} block(s). Remove or reassign children first.`,
      );
    }

    const sector = await softDeleteSector(id, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "sectors.delete",
      entityType: "Sector",
      entityId: id,
      projectId: existing.projectId,
      before: { code: existing.code, name: existing.name },
    });

    return toSectorDto(sector);
  },

  async bulkCreate(input: BulkCreateSectorsInput) {
    await requirePermission(PERMISSIONS.SECTORS_MANAGE);
    const created = [];
    for (const item of input.items) {
      created.push(
        await this.create({
          phaseId: input.phaseId,
          code: item.code,
          name: item.name,
          description: item.description,
          sortOrder: item.sortOrder ?? 0,
        }),
      );
    }
    return created;
  },

  async bulkArchive(ids: string[]) {
    const results = [];
    for (const id of ids) results.push(await this.archive(id));
    return results;
  },

  async bulkRestore(ids: string[]) {
    const results = [];
    for (const id of ids) results.push(await this.restore(id));
    return results;
  },

  async bulkDelete(ids: string[]) {
    const results = [];
    for (const id of ids) results.push(await this.softDelete(id));
    return results;
  },
};

export const blocksService = {
  async list(query: ListBlocksQuery) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);

    let projectId = query.projectId;
    if (!projectId && query.sectorId) {
      const sector = await getSectorById(query.sectorId);
      if (!sector) throw new NotFoundError("Sector", query.sectorId);
      projectId = sector.projectId;
    }
    if (!projectId && query.phaseId) {
      const phase = await getPhaseById(query.phaseId);
      if (!phase) throw new NotFoundError("Phase", query.phaseId);
      projectId = phase.projectId;
    }
    if (!projectId) {
      throw new ValidationAppError("projectId, phaseId, or sectorId is required");
    }
    await assertProjectVisible(actor.id, projectId);

    const { total, rows } = await listBlocks(query);
    return {
      data: rows.map(toBlockDto),
      meta: listMeta(total, query.page, query.pageSize, query.sort, query.order),
    };
  },

  async get(id: string) {
    const actor = await requirePermission(PERMISSIONS.PROJECTS_READ);
    const block = await getBlockById(id);
    if (!block) throw new NotFoundError("Block", id);
    await assertProjectVisible(actor.id, block.projectId);
    return toBlockDto(block);
  },

  async create(input: CreateBlockInput) {
    const actor = await requirePermission(PERMISSIONS.BLOCKS_MANAGE);
    const sector = await getSectorById(input.sectorId);
    if (!sector) throw new NotFoundError("Sector", input.sectorId);
    await assertProjectVisible(actor.id, sector.projectId);
    await assertProjectActive(sector.projectId);

    if (sector.status === "ARCHIVED") {
      throw new ValidationAppError("Cannot add blocks to an archived sector.");
    }

    const code = input.code?.trim()
      ? input.code.trim().toUpperCase()
      : await allocateBlockCode(input.sectorId);

    if (await findBlockCodeConflict(input.sectorId, code)) {
      throw new ValidationAppError(`Block code ${code} already exists in this sector.`);
    }

    try {
      const block = await createBlock({
        code,
        name: input.name,
        description: input.description ?? null,
        status: input.status ?? "ACTIVE",
        sortOrder: input.sortOrder ?? 0,
        createdById: actor.id,
        updatedById: actor.id,
        sector: { connect: { id: input.sectorId } },
        project: { connect: { id: sector.projectId } },
      });

      writeAuditLogAsync({
        actorId: actor.id,
        action: "blocks.create",
        entityType: "Block",
        entityId: block.id,
        projectId: sector.projectId,
        after: { code: block.code, name: block.name, sectorId: input.sectorId },
      });

      return toBlockDto(block);
    } catch (error) {
      mapPrismaUnique(error, `Block code ${code} already exists in this sector.`);
    }
  },

  async update(id: string, input: UpdateBlockInput) {
    const actor = await requirePermission(PERMISSIONS.BLOCKS_MANAGE);
    const existing = await getBlockById(id);
    if (!existing) throw new NotFoundError("Block", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);

    if (input.version !== undefined && input.version !== existing.version) {
      throw new ValidationAppError("Block was modified by another user. Refresh and try again.");
    }

    let nextSectorId = existing.sectorId;
    let nextProjectId = existing.projectId;

    if (input.sectorId && input.sectorId !== existing.sectorId) {
      const target = await getSectorById(input.sectorId);
      if (!target) throw new NotFoundError("Sector", input.sectorId);
      if (target.projectId !== existing.projectId) {
        throw new ValidationAppError("Cannot move block into a sector from another project.");
      }
      if (target.status === "ARCHIVED") {
        throw new ValidationAppError("Cannot move block into an archived sector.");
      }
      nextSectorId = target.id;
      nextProjectId = target.projectId;
    }

    const nextCode = input.code?.toUpperCase() ?? existing.code;
    if (nextCode !== existing.code || nextSectorId !== existing.sectorId) {
      if (await findBlockCodeConflict(nextSectorId, nextCode, id)) {
        throw new ValidationAppError(`Block code ${nextCode} already exists in the target sector.`);
      }
    }

    try {
      const block = await updateBlock(id, {
        ...(input.code !== undefined ? { code: input.code.toUpperCase() } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.sectorId
          ? {
              sector: { connect: { id: nextSectorId } },
              project: { connect: { id: nextProjectId } },
            }
          : {}),
        version: { increment: 1 },
        updatedById: actor.id,
      });

      const moved = input.sectorId && input.sectorId !== existing.sectorId;
      writeAuditLogAsync({
        actorId: actor.id,
        action: moved ? "blocks.move" : "blocks.update",
        entityType: "Block",
        entityId: id,
        projectId: existing.projectId,
        before: { sectorId: existing.sectorId, code: existing.code },
        after: { sectorId: block.sectorId, code: block.code },
      });

      return toBlockDto(block);
    } catch (error) {
      mapPrismaUnique(error, "Block code already exists in the target sector.");
    }
  },

  async archive(id: string) {
    const actor = await requirePermission(PERMISSIONS.BLOCKS_MANAGE);
    const existing = await getBlockById(id);
    if (!existing) throw new NotFoundError("Block", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);
    if (existing.status === "ARCHIVED") return toBlockDto(existing);

    const block = await updateBlock(id, {
      statusBeforeArchive: existing.status,
      status: "ARCHIVED",
      version: { increment: 1 },
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "blocks.archive",
      entityType: "Block",
      entityId: id,
      projectId: existing.projectId,
      before: { status: existing.status },
      after: { status: "ARCHIVED" },
    });

    return toBlockDto(block);
  },

  async restore(id: string) {
    const actor = await requirePermission(PERMISSIONS.BLOCKS_MANAGE);
    const existing = await getBlockById(id);
    if (!existing) throw new NotFoundError("Block", id);
    await assertProjectVisible(actor.id, existing.projectId);

    const restoredStatus =
      existing.statusBeforeArchive && existing.statusBeforeArchive !== "ARCHIVED"
        ? existing.statusBeforeArchive
        : "ACTIVE";

    const block = await updateBlock(id, {
      status: restoredStatus,
      statusBeforeArchive: null,
      deletedAt: null,
      version: { increment: 1 },
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "blocks.restore",
      entityType: "Block",
      entityId: id,
      projectId: existing.projectId,
      before: { status: existing.status },
      after: { status: block.status },
    });

    return toBlockDto(block);
  },

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.BLOCKS_MANAGE);
    const existing = await getBlockById(id);
    if (!existing) throw new NotFoundError("Block", id);
    await assertProjectVisible(actor.id, existing.projectId);
    await assertProjectActive(existing.projectId);

    const block = await softDeleteBlock(id, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "blocks.delete",
      entityType: "Block",
      entityId: id,
      projectId: existing.projectId,
      before: { code: existing.code, name: existing.name },
    });

    return toBlockDto(block);
  },

  async bulkCreate(input: BulkCreateBlocksInput) {
    await requirePermission(PERMISSIONS.BLOCKS_MANAGE);
    const created = [];
    for (const item of input.items) {
      created.push(
        await this.create({
          sectorId: input.sectorId,
          code: item.code,
          name: item.name,
          description: item.description,
          sortOrder: item.sortOrder ?? 0,
        }),
      );
    }
    return created;
  },

  async bulkArchive(ids: string[]) {
    const results = [];
    for (const id of ids) results.push(await this.archive(id));
    return results;
  },

  async bulkRestore(ids: string[]) {
    const results = [];
    for (const id of ids) results.push(await this.restore(id));
    return results;
  },

  async bulkDelete(ids: string[]) {
    const results = [];
    for (const id of ids) results.push(await this.softDelete(id));
    return results;
  },
};
