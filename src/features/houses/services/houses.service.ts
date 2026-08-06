import {
  ForbiddenError,
  NotFoundError,
  ValidationAppError,
} from "@/domain/errors";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { requirePermission } from "@/domain/policies/require-permission";
import { writeAuditLogAsync } from "@/features/auth/services/audit.service";
import { resolveVisibleProjectIds } from "@/features/projects/services/projects.service";
import { allocateHouseCode } from "@/infrastructure/numbering/number-sequence.service";
import { prisma } from "@/infrastructure/db";
import type { HouseStatus, Prisma } from "@prisma/client";
import {
  toHouseDto,
  toHouseStatusHistoryDto,
  type HouseImportIssue,
  type HouseImportPreviewDto,
} from "../mappers";
import {
  appendHouseStatusHistory,
  createHouse,
  createHousesMany,
  createSavedFilter,
  deleteSavedFilter,
  findHouseCodeConflict,
  getBlockChain,
  getHouseById,
  getHouseTemplateById,
  getHouseTypeById,
  getProjectHouseStats,
  listExistingHouseKeys,
  listHouses,
  listHouseStatusHistory,
  listSavedFilters,
  loadStructureMaps,
  softDeleteHouse,
  updateHouse,
} from "../repositories/house.repository";
import type {
  BulkHouseIdsInput,
  ChangeHouseStatusInput,
  CreateHouseInput,
  HouseImportCommitInput,
  HouseImportPreviewInput,
  ListHousesQuery,
  SavedFilterInput,
  UpdateHouseInput,
} from "../schemas/house.schemas";

async function assertProjectVisible(actorId: string, projectId: string) {
  const visible = await resolveVisibleProjectIds(actorId);
  if (visible && !visible.includes(projectId)) {
    throw new ForbiddenError("You cannot access this project.");
  }
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

async function assertHierarchy(
  projectId: string,
  phaseId: string,
  sectorId: string,
  blockId: string,
) {
  const block = await getBlockChain(blockId);
  if (!block) throw new NotFoundError("Block", blockId);
  if (block.projectId !== projectId) {
    throw new ValidationAppError("Block does not belong to this project.");
  }
  if (block.sectorId !== sectorId) {
    throw new ValidationAppError("Block does not belong to the selected sector.");
  }
  if (block.sector.phaseId !== phaseId) {
    throw new ValidationAppError("Sector does not belong to the selected phase.");
  }
  if (
    block.sector.projectId !== projectId ||
    block.sector.phase.projectId !== projectId
  ) {
    throw new ValidationAppError("Invalid project hierarchy references.");
  }
  return block;
}

export const housesService = {
  async list(query: ListHousesQuery) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
    await assertProjectVisible(actor.id, query.projectId);
    const { total, rows } = await listHouses(query);
    return {
      data: rows.map(toHouseDto),
      meta: listMeta(total, query.page, query.pageSize, query.sort, query.order),
    };
  },

  async get(id: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
    const row = await getHouseById(id);
    if (!row) throw new NotFoundError("House", id);
    await assertProjectVisible(actor.id, row.projectId);
    return toHouseDto(row);
  },

  async stats(projectId: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
    await assertProjectVisible(actor.id, projectId);
    return getProjectHouseStats(projectId);
  },

  async statusHistory(id: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
    const house = await getHouseById(id);
    if (!house) throw new NotFoundError("House", id);
    await assertProjectVisible(actor.id, house.projectId);
    const rows = await listHouseStatusHistory(id);
    return rows.map(toHouseStatusHistoryDto);
  },

  async create(input: CreateHouseInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_CREATE);
    await assertProjectVisible(actor.id, input.projectId);
    await assertHierarchy(
      input.projectId,
      input.phaseId,
      input.sectorId,
      input.blockId,
    );

    const houseType = await getHouseTypeById(input.houseTypeId);
    if (!houseType) throw new NotFoundError("HouseType", input.houseTypeId);

    const templateId = input.houseTemplateId ?? houseType.defaultTemplateId ?? null;
    if (templateId) {
      const tpl = await getHouseTemplateById(templateId);
      if (!tpl || tpl.houseTypeId !== input.houseTypeId) {
        throw new ValidationAppError("Template does not match house type.");
      }
      if (tpl.status === "ARCHIVED") {
        throw new ValidationAppError("Cannot assign an archived template.");
      }
    }

    const code = input.code?.trim()
      ? input.code.trim().toUpperCase()
      : await allocateHouseCode(input.blockId);

    if (await findHouseCodeConflict(input.blockId, code)) {
      throw new ValidationAppError(`House code ${code} already exists in this block.`);
    }

    const status = input.status ?? "PLANNING";
    const row = await createHouse({
      code,
      plotNo: input.plotNo ?? null,
      status,
      gpsLatitude: input.gpsLatitude ?? null,
      gpsLongitude: input.gpsLongitude ?? null,
      ownerName: input.ownerName ?? null,
      notes: input.notes ?? null,
      seededFromTemplate: !!templateId,
      createdById: actor.id,
      updatedById: actor.id,
      project: { connect: { id: input.projectId } },
      phase: { connect: { id: input.phaseId } },
      sector: { connect: { id: input.sectorId } },
      block: { connect: { id: input.blockId } },
      houseType: { connect: { id: input.houseTypeId } },
      ...(templateId
        ? { houseTemplate: { connect: { id: templateId } } }
        : {}),
    });

    await appendHouseStatusHistory({
      houseId: row.id,
      projectId: input.projectId,
      fromStatus: null,
      toStatus: status,
      note: "House created",
      changedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "houses.create",
      entityType: "House",
      entityId: row.id,
      projectId: input.projectId,
      after: {
        code: row.code,
        status: row.status,
        houseTemplateId: templateId,
        seededFromTemplate: !!templateId,
      },
    });

    if (templateId) {
      writeAuditLogAsync({
        actorId: actor.id,
        action: "houses.template.assign",
        entityType: "House",
        entityId: row.id,
        projectId: input.projectId,
        after: { houseTemplateId: templateId },
      });
    }

    return toHouseDto(row);
  },

  async update(id: string, input: UpdateHouseInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_UPDATE);
    const existing = await getHouseById(id);
    if (!existing) throw new NotFoundError("House", id);
    await assertProjectVisible(actor.id, existing.projectId);

    if (input.version !== undefined && input.version !== existing.version) {
      throw new ValidationAppError(
        "House was modified by another user. Refresh and try again.",
      );
    }

    const phaseId = input.phaseId ?? existing.phaseId;
    const sectorId = input.sectorId ?? existing.sectorId;
    const blockId = input.blockId ?? existing.blockId;
    await assertHierarchy(existing.projectId, phaseId, sectorId, blockId);

    if (input.code) {
      if (await findHouseCodeConflict(blockId, input.code.toUpperCase(), id)) {
        throw new ValidationAppError(
          `House code ${input.code} already exists in this block.`,
        );
      }
    }

    const statusChanging =
      input.status !== undefined && input.status !== existing.status;

    if (statusChanging) {
      await requirePermission(PERMISSIONS.HOUSES_STATUS);
    }

    const templateChanging =
      input.houseTemplateId !== undefined &&
      input.houseTemplateId !== existing.houseTemplateId;

    const row = await updateHouse(id, {
      ...(input.code !== undefined ? { code: input.code.toUpperCase() } : {}),
      ...(input.plotNo !== undefined ? { plotNo: input.plotNo } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.gpsLatitude !== undefined ? { gpsLatitude: input.gpsLatitude } : {}),
      ...(input.gpsLongitude !== undefined
        ? { gpsLongitude: input.gpsLongitude }
        : {}),
      ...(input.ownerName !== undefined ? { ownerName: input.ownerName } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.phaseId ? { phase: { connect: { id: phaseId } } } : {}),
      ...(input.sectorId ? { sector: { connect: { id: sectorId } } } : {}),
      ...(input.blockId ? { block: { connect: { id: blockId } } } : {}),
      ...(input.houseTypeId
        ? { houseType: { connect: { id: input.houseTypeId } } }
        : {}),
      ...(input.houseTemplateId !== undefined
        ? input.houseTemplateId
          ? {
              houseTemplate: { connect: { id: input.houseTemplateId } },
              seededFromTemplate: true,
            }
          : { houseTemplate: { disconnect: true } }
        : {}),
      version: { increment: 1 },
      updatedById: actor.id,
    });

    if (statusChanging && input.status) {
      await appendHouseStatusHistory({
        houseId: id,
        projectId: existing.projectId,
        fromStatus: existing.status,
        toStatus: input.status,
        note: input.statusNote,
        changedById: actor.id,
      });
      writeAuditLogAsync({
        actorId: actor.id,
        action: "houses.status",
        entityType: "House",
        entityId: id,
        projectId: existing.projectId,
        before: { status: existing.status },
        after: { status: input.status },
      });
    }

    if (templateChanging) {
      writeAuditLogAsync({
        actorId: actor.id,
        action: "houses.template.assign",
        entityType: "House",
        entityId: id,
        projectId: existing.projectId,
        before: { houseTemplateId: existing.houseTemplateId },
        after: { houseTemplateId: input.houseTemplateId },
      });
    }

    writeAuditLogAsync({
      actorId: actor.id,
      action: "houses.update",
      entityType: "House",
      entityId: id,
      projectId: existing.projectId,
      after: { code: row.code, status: row.status },
    });

    return toHouseDto(row);
  },

  async changeStatus(id: string, input: ChangeHouseStatusInput) {
    return this.update(id, {
      status: input.status,
      statusNote: input.note,
    });
  },

  async archive(id: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_UPDATE);
    const existing = await getHouseById(id);
    if (!existing) throw new NotFoundError("House", id);
    await assertProjectVisible(actor.id, existing.projectId);
    if (existing.status === "ARCHIVED") return toHouseDto(existing);

    const row = await updateHouse(id, {
      statusBeforeArchive: existing.status,
      status: "ARCHIVED",
      version: { increment: 1 },
      updatedById: actor.id,
    });

    await appendHouseStatusHistory({
      houseId: id,
      projectId: existing.projectId,
      fromStatus: existing.status,
      toStatus: "ARCHIVED",
      note: "Archived",
      changedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "houses.archive",
      entityType: "House",
      entityId: id,
      projectId: existing.projectId,
      before: { status: existing.status },
      after: { status: "ARCHIVED" },
    });

    return toHouseDto(row);
  },

  async restore(id: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_UPDATE);
    const existing = await getHouseById(id);
    if (!existing) throw new NotFoundError("House", id);
    await assertProjectVisible(actor.id, existing.projectId);

    const restoredStatus =
      existing.statusBeforeArchive && existing.statusBeforeArchive !== "ARCHIVED"
        ? existing.statusBeforeArchive
        : "PLANNING";

    const row = await updateHouse(id, {
      status: restoredStatus,
      statusBeforeArchive: null,
      deletedAt: null,
      version: { increment: 1 },
      updatedById: actor.id,
    });

    await appendHouseStatusHistory({
      houseId: id,
      projectId: existing.projectId,
      fromStatus: existing.status,
      toStatus: restoredStatus,
      note: "Restored",
      changedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "houses.restore",
      entityType: "House",
      entityId: id,
      projectId: existing.projectId,
      after: { status: restoredStatus },
    });

    return toHouseDto(row);
  },

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_UPDATE);
    const existing = await getHouseById(id);
    if (!existing) throw new NotFoundError("House", id);
    await assertProjectVisible(actor.id, existing.projectId);

    const row = await softDeleteHouse(id, actor.id);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "houses.delete",
      entityType: "House",
      entityId: id,
      projectId: existing.projectId,
      before: { code: existing.code },
    });
    return toHouseDto(row);
  },

  async bulkArchive(input: BulkHouseIdsInput) {
    const results = [];
    for (const id of input.ids) results.push(await this.archive(id));
    return results;
  },

  async bulkRestore(input: BulkHouseIdsInput) {
    const results = [];
    for (const id of input.ids) results.push(await this.restore(id));
    return results;
  },

  async bulkDelete(input: BulkHouseIdsInput) {
    const results = [];
    for (const id of input.ids) results.push(await this.softDelete(id));
    return results;
  },

  async importPreview(input: HouseImportPreviewInput): Promise<HouseImportPreviewDto> {
    const actor = await requirePermission(PERMISSIONS.HOUSES_IMPORT);
    await assertProjectVisible(actor.id, input.projectId);

    const maps = await loadStructureMaps(input.projectId);
    const existing = await listExistingHouseKeys(input.projectId);
    const existingCodes = new Set(existing.map((h) => `${h.blockId}:${h.code}`));
    const existingPlots = new Set(
      existing.filter((h) => h.plotNo).map((h) => h.plotNo!.toUpperCase()),
    );

    const phaseByCode = new Map(maps.phases.map((p) => [p.code.toUpperCase(), p]));
    const sectorByKey = new Map(
      maps.sectors.map((s) => [`${s.phaseId}:${s.code.toUpperCase()}`, s]),
    );
    const blockByKey = new Map(
      maps.blocks.map((b) => [`${b.sectorId}:${b.code.toUpperCase()}`, b]),
    );
    const typeByCode = new Map(
      maps.houseTypes.map((t) => [t.code.toUpperCase(), t]),
    );
    const templateByKey = new Map(
      maps.templates.map((t) => [`${t.houseTypeId}:${t.code.toUpperCase()}`, t]),
    );

    const fileCodes = new Set<string>();
    const filePlots = new Set<string>();
    const issues: HouseImportIssue[] = [];
    const rows: HouseImportPreviewDto["rows"] = [];
    let valid = 0;
    let duplicates = 0;

    input.rows.forEach((raw, index) => {
      const rowNum = index + 1;
      const rowIssues: HouseImportIssue[] = [];
      const phase = phaseByCode.get(raw.phaseCode.toUpperCase());
      if (!phase) {
        rowIssues.push({
          row: rowNum,
          field: "phaseCode",
          message: `Unknown phase ${raw.phaseCode}`,
          severity: "error",
        });
      }
      const sector = phase
        ? sectorByKey.get(`${phase.id}:${raw.sectorCode.toUpperCase()}`)
        : undefined;
      if (phase && !sector) {
        rowIssues.push({
          row: rowNum,
          field: "sectorCode",
          message: `Unknown sector ${raw.sectorCode}`,
          severity: "error",
        });
      }
      const block = sector
        ? blockByKey.get(`${sector.id}:${raw.blockCode.toUpperCase()}`)
        : undefined;
      if (sector && !block) {
        rowIssues.push({
          row: rowNum,
          field: "blockCode",
          message: `Unknown block ${raw.blockCode}`,
          severity: "error",
        });
      }
      const houseType = typeByCode.get(raw.houseTypeCode.toUpperCase());
      if (!houseType) {
        rowIssues.push({
          row: rowNum,
          field: "houseTypeCode",
          message: `Unknown house type ${raw.houseTypeCode}`,
          severity: "error",
        });
      }

      let templateId: string | null = null;
      if (raw.houseTemplateCode && houseType) {
        const tpl = templateByKey.get(
          `${houseType.id}:${raw.houseTemplateCode.toUpperCase()}`,
        );
        if (!tpl) {
          rowIssues.push({
            row: rowNum,
            field: "houseTemplateCode",
            message: `Unknown template ${raw.houseTemplateCode}`,
            severity: "error",
          });
        } else {
          templateId = tpl.id;
        }
      }

      const code = (raw.code?.trim() || `AUTO-${rowNum}`).toUpperCase();
      if (block) {
        const key = `${block.id}:${code}`;
        if (fileCodes.has(key) || existingCodes.has(key)) {
          duplicates += 1;
          rowIssues.push({
            row: rowNum,
            field: "code",
            message: `Duplicate house code ${code}`,
            severity: "error",
          });
        } else {
          fileCodes.add(key);
        }
      }

      if (raw.plotNo) {
        const plot = raw.plotNo.toUpperCase();
        if (filePlots.has(plot) || existingPlots.has(plot)) {
          duplicates += 1;
          rowIssues.push({
            row: rowNum,
            field: "plotNo",
            message: `Duplicate plot number ${raw.plotNo}`,
            severity: "warning",
          });
        } else {
          filePlots.add(plot);
        }
      }

      const ok = !rowIssues.some((i) => i.severity === "error");
      if (ok) valid += 1;
      issues.push(...rowIssues);
      rows.push({
        row: rowNum,
        ok,
        data: {
          ...raw,
          resolvedPhaseId: phase?.id,
          resolvedSectorId: sector?.id,
          resolvedBlockId: block?.id,
          resolvedHouseTypeId: houseType?.id,
          resolvedTemplateId: templateId,
          resolvedCode: code === `AUTO-${rowNum}` ? null : code,
        },
      });
    });

    return {
      total: input.rows.length,
      valid,
      invalid: input.rows.length - valid,
      duplicates,
      issues,
      rows,
    };
  },

  async importCommit(input: HouseImportCommitInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_IMPORT);
    await assertProjectVisible(actor.id, input.projectId);

    const preview = await this.importPreview(input);
    if (preview.invalid > 0) {
      throw new ValidationAppError(
        `Import blocked: ${preview.invalid} invalid row(s). Fix issues and retry.`,
      );
    }

    const createdIds: string[] = [];
    const chunkSize = 200;
    const validRows = preview.rows.filter((r) => r.ok);

    for (let i = 0; i < validRows.length; i += chunkSize) {
      const chunk = validRows.slice(i, i + chunkSize);
      const payload: Prisma.HouseCreateManyInput[] = [];

      for (const row of chunk) {
        const d = row.data as Record<string, unknown>;
        const blockId = String(d.resolvedBlockId);
        const code = d.resolvedCode
          ? String(d.resolvedCode).toUpperCase()
          : await allocateHouseCode(blockId);
        const status = (d.status as HouseStatus | undefined) ?? "PLANNING";
        const templateId = d.resolvedTemplateId
          ? String(d.resolvedTemplateId)
          : null;

        payload.push({
          projectId: input.projectId,
          phaseId: String(d.resolvedPhaseId),
          sectorId: String(d.resolvedSectorId),
          blockId,
          houseTypeId: String(d.resolvedHouseTypeId),
          houseTemplateId: templateId,
          code,
          plotNo: d.plotNo ? String(d.plotNo) : null,
          status,
          ownerName: d.ownerName ? String(d.ownerName) : null,
          notes: d.notes ? String(d.notes) : null,
          gpsLatitude: typeof d.gpsLatitude === "number" ? d.gpsLatitude : null,
          gpsLongitude:
            typeof d.gpsLongitude === "number" ? d.gpsLongitude : null,
          seededFromTemplate: !!templateId,
          createdById: actor.id,
          updatedById: actor.id,
        });
      }

      await createHousesMany(payload);

      const codes = payload.map((p) => p.code);
      const created = await prisma.house.findMany({
        where: {
          projectId: input.projectId,
          deletedAt: null,
          code: { in: codes },
          blockId: { in: payload.map((p) => p.blockId) },
        },
        select: { id: true, projectId: true, status: true },
      });

      if (created.length) {
        await prisma.houseStatusHistory.createMany({
          data: created.map((h) => ({
            houseId: h.id,
            projectId: h.projectId,
            fromStatus: null,
            toStatus: h.status,
            note: "Imported",
            changedById: actor.id,
          })),
        });
        createdIds.push(...created.map((h) => h.id));
      }
    }

    writeAuditLogAsync({
      actorId: actor.id,
      action: "houses.import",
      entityType: "House",
      projectId: input.projectId,
      meta: { count: createdIds.length },
    });

    return { imported: createdIds.length, ids: createdIds };
  },
};

export const savedFiltersService = {
  async list(projectId?: string | null) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
    const rows = await listSavedFilters(actor.id, "houses", projectId);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      projectId: r.projectId,
      payload: r.payload,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  async create(input: SavedFilterInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
    if (input.projectId) await assertProjectVisible(actor.id, input.projectId);
    const row = await createSavedFilter({
      userId: actor.id,
      projectId: input.projectId,
      module: "houses",
      name: input.name,
      payload: input.payload as Prisma.InputJsonValue,
    });
    return {
      id: row.id,
      name: row.name,
      projectId: row.projectId,
      payload: row.payload,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  async remove(id: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
    await deleteSavedFilter(id, actor.id);
    return { ok: true };
  },
};
