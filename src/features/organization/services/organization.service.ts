import {
  ForbiddenError,
  NotFoundError,
  ValidationAppError,
} from "@/domain/errors";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { requirePermission } from "@/domain/policies/require-permission";
import { writeAuditLogAsync } from "@/features/auth/services/audit.service";
import {
  resolveVisibilityContext,
} from "@/features/rbac/services/access.service";
import { buildOrgTree, toOrgUnitDto } from "../mappers";
import {
  assignUsersToOrgUnit,
  collectDescendantIds,
  countActiveChildren,
  countActiveUsers,
  createOrgUnit,
  getAncestorChain,
  getOrgUnitByCode,
  getOrgUnitById,
  listAllOrgUnits,
  listAssignableUsers,
  listOrgUnits,
  listUsersInOrgUnit,
  softDeleteOrgUnit,
  updateOrgUnit,
} from "../repositories/org.repository";
import type {
  AssignOrgUsersInput,
  CreateOrgUnitInput,
  ListOrgUnitsQuery,
  UpdateOrgUnitInput,
} from "../schemas/org.schemas";

async function resolveVisibleOrgIds(actorId: string): Promise<string[] | null> {
  const ctx = await resolveVisibilityContext(actorId);
  if (!ctx) return [];
  if (ctx.globalRead || ctx.isSuperAdmin) return null; // null = unrestricted

  const roots = ctx.orgUnitIds;
  if (!roots.length) return [];

  const visible = new Set(roots);
  const descendantLists = await Promise.all(
    roots.map((rootId) => collectDescendantIds(rootId)),
  );
  for (const descendants of descendantLists) {
    for (const id of descendants) visible.add(id);
  }
  return [...visible];
}

async function assertVisible(actorId: string, orgUnitId: string) {
  const visible = await resolveVisibleOrgIds(actorId);
  if (visible && !visible.includes(orgUnitId)) {
    throw new ForbiddenError("You cannot access this organization unit.");
  }
}

async function assertValidParent(
  unitId: string | null,
  parentId: string | null | undefined,
) {
  if (parentId === undefined) return;
  if (parentId === null) return;

  if (unitId && parentId === unitId) {
    throw new ValidationAppError("An organization unit cannot be its own parent.");
  }

  const parent = await getOrgUnitById(parentId);
  if (!parent) {
    throw new NotFoundError("OrgUnit", parentId);
  }

  if (unitId) {
    const descendants = await collectDescendantIds(unitId);
    if (descendants.includes(parentId)) {
      throw new ValidationAppError(
        "Cannot move an organization unit under one of its descendants.",
      );
    }
  }
}

export const organizationService = {
  async list(query: ListOrgUnitsQuery) {
    const actor = await requirePermission(PERMISSIONS.ORG_READ);
    const visibleIds = await resolveVisibleOrgIds(actor.id);
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

    const { total, rows } = await listOrgUnits(query, visibleIds);
    return {
      data: rows.map(toOrgUnitDto),
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

  async tree() {
    const actor = await requirePermission(PERMISSIONS.ORG_READ);
    const visibleIds = await resolveVisibleOrgIds(actor.id);
    if (visibleIds && visibleIds.length === 0) return [];

    const rows = await listAllOrgUnits(visibleIds);
    return buildOrgTree(rows.map(toOrgUnitDto));
  },

  async get(id: string) {
    const actor = await requirePermission(PERMISSIONS.ORG_READ);
    await assertVisible(actor.id, id);
    const unit = await getOrgUnitById(id);
    if (!unit) throw new NotFoundError("OrgUnit", id);
    return toOrgUnitDto(unit);
  },

  async breadcrumb(id: string) {
    const actor = await requirePermission(PERMISSIONS.ORG_READ);
    await assertVisible(actor.id, id);
    const unit = await getOrgUnitById(id);
    if (!unit) throw new NotFoundError("OrgUnit", id);
    return getAncestorChain(id);
  },

  async create(input: CreateOrgUnitInput) {
    const actor = await requirePermission(PERMISSIONS.ORG_CREATE);
    await assertValidParent(null, input.parentId ?? null);

    if (input.parentId) {
      await assertVisible(actor.id, input.parentId);
    }

    const existing = await getOrgUnitByCode(input.code);
    if (existing) {
      throw new ValidationAppError("An organization unit with this code already exists.");
    }

    const created = await createOrgUnit({
      code: input.code,
      name: input.name,
      type: input.type,
      status: input.status,
      parentId: input.parentId,
      sortOrder: input.sortOrder,
      createdById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "org-units.create",
      entityType: "OrgUnit",
      entityId: created.id,
      after: { code: created.code, name: created.name, type: created.type },
    });

    return toOrgUnitDto(created);
  },

  async update(id: string, input: UpdateOrgUnitInput) {
    const actor = await requirePermission(PERMISSIONS.ORG_UPDATE);
    await assertVisible(actor.id, id);

    const existing = await getOrgUnitById(id);
    if (!existing) throw new NotFoundError("OrgUnit", id);

    if (input.parentId !== undefined) {
      await assertValidParent(id, input.parentId);
      if (input.parentId) await assertVisible(actor.id, input.parentId);
    }

    if (input.code && input.code !== existing.code) {
      const clash = await getOrgUnitByCode(input.code);
      if (clash) {
        throw new ValidationAppError(
          "An organization unit with this code already exists.",
        );
      }
    }

    const updated = await updateOrgUnit(id, {
      code: input.code,
      name: input.name,
      type: input.type,
      status: input.status,
      sortOrder: input.sortOrder,
      parent:
        input.parentId === undefined
          ? undefined
          : input.parentId
            ? { connect: { id: input.parentId } }
            : { disconnect: true },
      updatedById: actor.id,
    });

    writeAuditLogAsync({
      actorId: actor.id,
      action: "org-units.update",
      entityType: "OrgUnit",
      entityId: id,
      before: {
        code: existing.code,
        name: existing.name,
        parentId: existing.parentId,
        status: existing.status,
      },
      after: {
        code: updated.code,
        name: updated.name,
        parentId: updated.parentId,
        status: updated.status,
      },
    });

    return toOrgUnitDto(updated);
  },

  async softDelete(id: string) {
    const actor = await requirePermission(PERMISSIONS.ORG_DELETE);
    await assertVisible(actor.id, id);

    const existing = await getOrgUnitById(id);
    if (!existing) throw new NotFoundError("OrgUnit", id);

    const [children, users] = await Promise.all([
      countActiveChildren(id),
      countActiveUsers(id),
    ]);

    if (children > 0) {
      throw new ValidationAppError(
        `Cannot delete: ${children} child organization unit(s) still exist.`,
      );
    }
    if (users > 0) {
      throw new ValidationAppError(
        `Cannot delete: ${users} active user(s) are assigned to this unit.`,
      );
    }

    const deleted = await softDeleteOrgUnit(id, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "org-units.delete",
      entityType: "OrgUnit",
      entityId: id,
      before: { code: existing.code, name: existing.name },
    });

    return toOrgUnitDto(deleted);
  },

  async listMembers(id: string) {
    const actor = await requirePermission(PERMISSIONS.ORG_READ);
    await assertVisible(actor.id, id);
    const unit = await getOrgUnitById(id);
    if (!unit) throw new NotFoundError("OrgUnit", id);
    return listUsersInOrgUnit(id);
  },

  async assignUsers(id: string, input: AssignOrgUsersInput) {
    const actor = await requirePermission(PERMISSIONS.ORG_UPDATE);
    await assertVisible(actor.id, id);
    const unit = await getOrgUnitById(id);
    if (!unit) throw new NotFoundError("OrgUnit", id);

    const members = await assignUsersToOrgUnit(id, input.userIds, actor.id);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "org-units.assign_users",
      entityType: "OrgUnit",
      entityId: id,
      after: { userIds: input.userIds },
    });

    return members;
  },

  async listAssignableUsers() {
    await requirePermission(PERMISSIONS.ORG_READ);
    return listAssignableUsers();
  },
};
