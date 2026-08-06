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
  allocateHouseTemplateCode,
  allocateHouseTypeCode,
} from "@/infrastructure/numbering/number-sequence.service";
import { toHouseTemplateDto, toHouseTypeDto } from "../mappers";
import {
  clearDefaultTemplates,
  countHousesForTemplate,
  countHousesForType,
  createHouseTemplate,
  createHouseType,
  findHouseTypeByCode,
  getHouseTemplateById,
  getHouseTypeById,
  getNextTemplateVersion,
  listHouseTemplates,
  listHouseTypes,
  listTemplateRevisions,
  replaceTemplateLines,
  softDeleteHouseTemplate,
  softDeleteHouseType,
  updateHouseTemplate,
  updateHouseType,
} from "../repositories/house.repository";
import type {
  CreateHouseTemplateInput,
  CreateHouseTypeInput,
  ListHouseTemplatesQuery,
  ListHouseTypesQuery,
  ReviseHouseTemplateInput,
  TemplateActivityInput,
  TemplateBoqInput,
  TemplateMaterialInput,
  UpdateHouseTemplateInput,
  UpdateHouseTypeInput,
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

function linesFromExisting(existing: NonNullable<Awaited<ReturnType<typeof getHouseTemplateById>>>) {
  const activities: TemplateActivityInput[] = (existing.activities ?? []).map((a) => ({
    code: a.code,
    name: a.name,
    description: a.description,
    quantity: Number(a.quantity),
    unit: a.unit,
    estimatedDurationDays: a.estimatedDurationDays,
    sortOrder: a.sortOrder,
  }));
  const boqItems: TemplateBoqInput[] = (existing.boqItems ?? []).map((b) => ({
    code: b.code,
    name: b.name,
    description: b.description,
    quantity: Number(b.quantity),
    unit: b.unit,
    unitRate: b.unitRate != null ? Number(b.unitRate) : null,
    sortOrder: b.sortOrder,
  }));
  const materials: TemplateMaterialInput[] = (existing.materials ?? []).map((m) => ({
    code: m.code,
    name: m.name,
    description: m.description,
    quantity: Number(m.quantity),
    unit: m.unit,
    sortOrder: m.sortOrder,
  }));
  return { activities, boqItems, materials };
}

export const houseTypesService = {
  async list(query: ListHouseTypesQuery) {
    const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
    if (query.projectId) {
      await assertProjectVisible(actor.id, query.projectId);
    }
    const { total, rows } = await listHouseTypes(query);
    return {
      data: rows.map(toHouseTypeDto),
      meta: listMeta(total, query.page, query.pageSize, query.sort, query.order),
    };
  },

  async get(id: string) {
    await requirePermission(PERMISSIONS.HOUSES_READ);
    const row = await getHouseTypeById(id);
    if (!row) throw new NotFoundError("HouseType", id);
    if (row.projectId) {
      const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
      await assertProjectVisible(actor.id, row.projectId);
    }
    return toHouseTypeDto(row);
  },

  async create(input: CreateHouseTypeInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSE_TYPES_MANAGE);
    if (input.projectId) await assertProjectVisible(actor.id, input.projectId);

    const scopeId = input.projectId ?? "global";
    const code = input.code?.trim()
      ? input.code.trim().toUpperCase()
      : await allocateHouseTypeCode(scopeId);

    const existing = await findHouseTypeByCode(input.projectId ?? null, code);
    if (existing && existing.projectId === (input.projectId ?? null)) {
      throw new ValidationAppError(`House type code ${code} already exists.`);
    }

    const row = await createHouseType({
      code,
      name: input.name,
      category: input.category ?? "RESIDENTIAL",
      coveredArea: input.coveredArea ?? null,
      plotSize: input.plotSize ?? null,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      floors: input.floors ?? null,
      drawingNumber: input.drawingNumber ?? null,
      description: input.description ?? null,
      status: input.status ?? "ACTIVE",
      createdById: actor.id,
      updatedById: actor.id,
      ...(input.projectId
        ? { project: { connect: { id: input.projectId } } }
        : {}),
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "house_types.create",
      entityType: "HouseType",
      entityId: row.id,
      projectId: input.projectId,
      after: { code: row.code, name: row.name },
    });

    return toHouseTypeDto(row);
  },

  async update(id: string, input: UpdateHouseTypeInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSE_TYPES_MANAGE);
    const existing = await getHouseTypeById(id);
    if (!existing) throw new NotFoundError("HouseType", id);
    if (existing.projectId) await assertProjectVisible(actor.id, existing.projectId);

    if (input.defaultTemplateId) {
      const tpl = await getHouseTemplateById(input.defaultTemplateId);
      if (!tpl || tpl.houseTypeId !== id) {
        throw new ValidationAppError("Default template must belong to this house type.");
      }
    }

    const row = await updateHouseType(id, {
      ...(input.code !== undefined ? { code: input.code.toUpperCase() } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.coveredArea !== undefined ? { coveredArea: input.coveredArea } : {}),
      ...(input.plotSize !== undefined ? { plotSize: input.plotSize } : {}),
      ...(input.bedrooms !== undefined ? { bedrooms: input.bedrooms } : {}),
      ...(input.bathrooms !== undefined ? { bathrooms: input.bathrooms } : {}),
      ...(input.floors !== undefined ? { floors: input.floors } : {}),
      ...(input.drawingNumber !== undefined ? { drawingNumber: input.drawingNumber } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.defaultTemplateId !== undefined
        ? input.defaultTemplateId
          ? { defaultTemplate: { connect: { id: input.defaultTemplateId } } }
          : { defaultTemplate: { disconnect: true } }
        : {}),
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "house_types.update",
      entityType: "HouseType",
      entityId: id,
      projectId: existing.projectId,
      before: { code: existing.code, name: existing.name },
      after: { code: row.code, name: row.name },
    });

    return toHouseTypeDto(row);
  },

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSE_TYPES_MANAGE);
    const existing = await getHouseTypeById(id);
    if (!existing) throw new NotFoundError("HouseType", id);
    if (existing.projectId) await assertProjectVisible(actor.id, existing.projectId);

    const houseCount = await countHousesForType(id);
    if (houseCount > 0) {
      throw new ValidationAppError(
        `Cannot delete house type with ${houseCount} house(s).`,
      );
    }

    const row = await softDeleteHouseType(id, actor.id);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "house_types.delete",
      entityType: "HouseType",
      entityId: id,
      projectId: existing.projectId,
      before: { code: existing.code },
    });
    return toHouseTypeDto(row);
  },
};

export const houseTemplatesService = {
  async list(query: ListHouseTemplatesQuery) {
    await requirePermission(PERMISSIONS.HOUSES_READ);
    if (query.projectId) {
      const actor = await requirePermission(PERMISSIONS.HOUSES_READ);
      await assertProjectVisible(actor.id, query.projectId);
    }
    const { total, rows } = await listHouseTemplates(query);
    return {
      data: rows.map(toHouseTemplateDto),
      meta: listMeta(total, query.page, query.pageSize, query.sort, query.order),
    };
  },

  async get(id: string) {
    await requirePermission(PERMISSIONS.HOUSES_READ);
    const row = await getHouseTemplateById(id);
    if (!row) throw new NotFoundError("HouseTemplate", id);
    return toHouseTemplateDto(row);
  },

  async listRevisions(id: string) {
    await requirePermission(PERMISSIONS.HOUSES_READ);
    const rows = await listTemplateRevisions(id);
    return rows.map(toHouseTemplateDto);
  },

  async create(input: CreateHouseTemplateInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSE_TYPES_MANAGE);
    const houseType = await getHouseTypeById(input.houseTypeId);
    if (!houseType) throw new NotFoundError("HouseType", input.houseTypeId);
    if (houseType.projectId) await assertProjectVisible(actor.id, houseType.projectId);

    const code = input.code?.trim()
      ? input.code.trim().toUpperCase()
      : await allocateHouseTemplateCode(input.houseTypeId);
    const version = await getNextTemplateVersion(input.houseTypeId, code);

    if (input.isDefault) await clearDefaultTemplates(input.houseTypeId);

    const row = await createHouseTemplate(
      {
        code,
        name: input.name,
        version,
        status: input.status ?? "DRAFT",
        estimatedDurationDays: input.estimatedDurationDays ?? null,
        estimatedCost: input.estimatedCost ?? null,
        isDefault: input.isDefault ?? false,
        description: input.description ?? null,
        createdById: actor.id,
        updatedById: actor.id,
        houseType: { connect: { id: input.houseTypeId } },
        ...(input.projectId ?? houseType.projectId
          ? { project: { connect: { id: (input.projectId ?? houseType.projectId)! } } }
          : {}),
      },
      {
        activities: input.activities,
        boqItems: input.boqItems,
        materials: input.materials,
      },
    );

    if (input.isDefault) {
      await updateHouseType(input.houseTypeId, {
        defaultTemplate: { connect: { id: row.id } },
      });
    }

    writeAuditLogAsync({
      actorId: actor.id,
      action: "house_templates.create",
      entityType: "HouseTemplate",
      entityId: row.id,
      projectId: houseType.projectId,
      after: {
        code: row.code,
        version: row.version,
        activityCount: input.activities?.length ?? 0,
        boqCount: input.boqItems?.length ?? 0,
        materialCount: input.materials?.length ?? 0,
      },
    });

    return toHouseTemplateDto(row);
  },

  async update(id: string, input: UpdateHouseTemplateInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSE_TYPES_MANAGE);
    const existing = await getHouseTemplateById(id);
    if (!existing) throw new NotFoundError("HouseTemplate", id);

    if (input.isDefault) await clearDefaultTemplates(existing.houseTypeId, id);

    await updateHouseTemplate(id, {
      ...(input.code !== undefined ? { code: input.code.toUpperCase() } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.estimatedDurationDays !== undefined
        ? { estimatedDurationDays: input.estimatedDurationDays }
        : {}),
      ...(input.estimatedCost !== undefined ? { estimatedCost: input.estimatedCost } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      updatedById: actor.id,
    });

    const hasLineUpdates =
      input.activities !== undefined ||
      input.boqItems !== undefined ||
      input.materials !== undefined;

    const row = hasLineUpdates
      ? await replaceTemplateLines(id, {
          activities: input.activities,
          boqItems: input.boqItems,
          materials: input.materials,
        })
      : await getHouseTemplateById(id);

    if (!row) throw new NotFoundError("HouseTemplate", id);

    if (input.isDefault) {
      await updateHouseType(existing.houseTypeId, {
        defaultTemplate: { connect: { id } },
      });
    }

    writeAuditLogAsync({
      actorId: actor.id,
      action: "house_templates.update",
      entityType: "HouseTemplate",
      entityId: id,
      projectId: existing.projectId,
      after: { code: row.code, status: row.status },
    });

    return toHouseTemplateDto(row);
  },

  async revise(id: string, input: ReviseHouseTemplateInput) {
    const actor = await requirePermission(PERMISSIONS.HOUSE_TYPES_MANAGE);
    const existing = await getHouseTemplateById(id);
    if (!existing) throw new NotFoundError("HouseTemplate", id);

    const rootId = existing.revisionOfId ?? existing.id;
    const version = await getNextTemplateVersion(existing.houseTypeId, existing.code);
    const copied = linesFromExisting(existing);

    await updateHouseTemplate(id, { status: "ARCHIVED", updatedById: actor.id });

    const row = await createHouseTemplate(
      {
        code: existing.code,
        name: input.name ?? existing.name,
        version,
        status: input.activate ? "ACTIVE" : "DRAFT",
        estimatedDurationDays:
          input.estimatedDurationDays ?? existing.estimatedDurationDays,
        estimatedCost: input.estimatedCost ?? existing.estimatedCost,
        revisionNote: input.revisionNote ?? null,
        isDefault: existing.isDefault,
        description: existing.description,
        createdById: actor.id,
        updatedById: actor.id,
        houseType: { connect: { id: existing.houseTypeId } },
        revisionOf: { connect: { id: rootId } },
        ...(existing.projectId
          ? { project: { connect: { id: existing.projectId } } }
          : {}),
      },
      {
        activities: input.activities ?? copied.activities,
        boqItems: input.boqItems ?? copied.boqItems,
        materials: input.materials ?? copied.materials,
      },
    );

    if (existing.isDefault) {
      await updateHouseType(existing.houseTypeId, {
        defaultTemplate: { connect: { id: row.id } },
      });
    }

    writeAuditLogAsync({
      actorId: actor.id,
      action: "house_templates.revise",
      entityType: "HouseTemplate",
      entityId: row.id,
      projectId: existing.projectId,
      meta: { fromVersion: existing.version, toVersion: row.version },
    });

    return toHouseTemplateDto(row);
  },

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.HOUSE_TYPES_MANAGE);
    const existing = await getHouseTemplateById(id);
    if (!existing) throw new NotFoundError("HouseTemplate", id);

    const houseCount = await countHousesForTemplate(id);
    if (houseCount > 0) {
      throw new ValidationAppError(
        `Cannot delete template with ${houseCount} house(s).`,
      );
    }

    const row = await softDeleteHouseTemplate(id, actor.id);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "house_templates.delete",
      entityType: "HouseTemplate",
      entityId: id,
      projectId: existing.projectId,
    });
    return toHouseTemplateDto(row);
  },
};
