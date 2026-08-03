import { ForbiddenError, NotFoundError, ValidationAppError } from "@/domain/errors";
import { PERMISSIONS, SYSTEM_ROLE_CODES } from "@/domain/policies/permissions";
import { requirePermission } from "@/domain/policies/require-permission";
import { writeAuditLogAsync } from "@/features/auth/services/audit.service";
import { getUserById } from "@/features/users/repositories/user.repository";
import { toPermissionDto, toRoleDto } from "../mappers";
import {
  countSuperAdmins,
  createRole,
  findPermissionsByCodes,
  getRoleByCode,
  getRoleById,
  listAllPermissions,
  listPermissions,
  listRoles,
  listUserPermissionOverrides,
  listUserRoles,
  replaceRolePermissions,
  replaceUserPermissionOverrides,
  replaceUserRoles,
  softDeleteRole,
  updateRole,
} from "../repositories/rbac.repository";
import { invalidateUserPermissionCache } from "./access.service";
import type {
  CreateRoleInput,
  ListPermissionsQuery,
  ListRolesQuery,
  SetRolePermissionsInput,
  SetUserPermissionOverridesInput,
  SetUserRolesInput,
  UpdateRoleInput,
} from "../schemas/rbac.schemas";

function assertNotSuperAdminMutation(roleCode: string, action: string) {
  if (roleCode === SYSTEM_ROLE_CODES.SUPER_ADMIN) {
    throw new ForbiddenError(
      `SUPER_ADMIN is protected and cannot be ${action}.`,
    );
  }
}

export const rbacService = {
  async listRoles(query: ListRolesQuery) {
    await requirePermission(PERMISSIONS.ROLES_READ);
    const { total, rows } = await listRoles(query);
    return {
      data: rows.map(toRoleDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  async getRole(id: string) {
    await requirePermission(PERMISSIONS.ROLES_READ);
    const role = await getRoleById(id);
    if (!role) throw new NotFoundError("Role", id);
    return toRoleDto(role);
  },

  async createRole(input: CreateRoleInput) {
    const actor = await requirePermission(PERMISSIONS.ROLES_CREATE);

    if (input.code === SYSTEM_ROLE_CODES.SUPER_ADMIN) {
      throw new ForbiddenError("Cannot create another SUPER_ADMIN role.");
    }

    const existing = await getRoleByCode(input.code);
    if (existing) {
      throw new ValidationAppError("A role with this code already exists.", {
        code: input.code,
      });
    }

    const role = await createRole({
      code: input.code,
      name: input.name,
      description: input.description,
      globalRead: input.globalRead,
    });

    if (input.permissionCodes?.length) {
      const permissions = await findPermissionsByCodes(input.permissionCodes);
      if (permissions.length !== input.permissionCodes.length) {
        throw new ValidationAppError("One or more permission codes are invalid.");
      }
      await replaceRolePermissions(
        role.id,
        permissions.map((p) => p.id),
      );
    }

    const refreshed = await getRoleById(role.id);
    writeAuditLogAsync({
      actorId: actor.id,
      action: "roles.create",
      entityType: "Role",
      entityId: role.id,
      after: { code: role.code, name: role.name },
    });

    return toRoleDto(refreshed!);
  },

  async updateRole(id: string, input: UpdateRoleInput) {
    const actor = await requirePermission(PERMISSIONS.ROLES_UPDATE);
    const existing = await getRoleById(id);
    if (!existing) throw new NotFoundError("Role", id);

    if (
      existing.code === SYSTEM_ROLE_CODES.SUPER_ADMIN &&
      input.globalRead === false
    ) {
      throw new ForbiddenError("SUPER_ADMIN must retain global read access.");
    }

    const updated = await updateRole(id, {
      name: input.name,
      description: input.description === undefined ? undefined : input.description,
      globalRead: input.globalRead,
    });

    invalidateUserPermissionCache();

    writeAuditLogAsync({
      actorId: actor.id,
      action: "roles.update",
      entityType: "Role",
      entityId: id,
      before: { name: existing.name, globalRead: existing.globalRead },
      after: { name: updated.name, globalRead: updated.globalRead },
    });

    return toRoleDto(updated);
  },

  async deleteRole(id: string) {
    const actor = await requirePermission(PERMISSIONS.ROLES_UPDATE);
    const existing = await getRoleById(id);
    if (!existing) throw new NotFoundError("Role", id);

    if (existing.isSystem) {
      throw new ForbiddenError("System roles cannot be deleted.");
    }

    assertNotSuperAdminMutation(existing.code, "deleted");

    const deleted = await softDeleteRole(id);
    invalidateUserPermissionCache();

    writeAuditLogAsync({
      actorId: actor.id,
      action: "roles.delete",
      entityType: "Role",
      entityId: id,
      before: { code: existing.code },
    });

    return toRoleDto(deleted);
  },

  async setRolePermissions(id: string, input: SetRolePermissionsInput) {
    const actor = await requirePermission(PERMISSIONS.ROLES_UPDATE);
    const existing = await getRoleById(id);
    if (!existing) throw new NotFoundError("Role", id);

    if (existing.code === SYSTEM_ROLE_CODES.SUPER_ADMIN) {
      throw new ForbiddenError(
        "SUPER_ADMIN always has all permissions and cannot be edited.",
      );
    }

    const permissions = await findPermissionsByCodes(input.permissionCodes);
    if (permissions.length !== [...new Set(input.permissionCodes)].length) {
      throw new ValidationAppError("One or more permission codes are invalid.");
    }

    const updated = await replaceRolePermissions(
      id,
      permissions.map((p) => p.id),
    );
    invalidateUserPermissionCache();

    writeAuditLogAsync({
      actorId: actor.id,
      action: "roles.permissions_update",
      entityType: "Role",
      entityId: id,
      after: { permissionCodes: input.permissionCodes },
    });

    return toRoleDto(updated);
  },

  async listPermissions(query: ListPermissionsQuery) {
    await requirePermission(PERMISSIONS.PERMISSIONS_READ);
    const { total, rows } = await listPermissions(query);
    return {
      data: rows.map(toPermissionDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  async listAllPermissions() {
    await requirePermission(PERMISSIONS.PERMISSIONS_READ);
    const rows = await listAllPermissions();
    return rows.map(toPermissionDto);
  },

  async getUserRoles(userId: string) {
    await requirePermission(PERMISSIONS.ROLES_READ);
    const user = await getUserById(userId);
    if (!user) throw new NotFoundError("User", userId);
    const rows = await listUserRoles(userId);
    return rows.map((row) => ({
      id: row.id,
      roleId: row.roleId,
      roleCode: row.role.code,
      roleName: row.role.name,
      isSystem: row.role.isSystem,
      scopeType: row.scopeType,
      orgUnitId: row.orgUnitId,
      projectId: row.projectId,
      assignedAt: row.assignedAt,
    }));
  },

  async setUserRoles(userId: string, input: SetUserRolesInput) {
    const actor = await requirePermission(PERMISSIONS.ROLES_ASSIGN);
    const user = await getUserById(userId);
    if (!user) throw new NotFoundError("User", userId);

    const current = await listUserRoles(userId);
    const currentlySuperAdmin = current.some(
      (r) => r.role.code === SYSTEM_ROLE_CODES.SUPER_ADMIN,
    );

    const roleIds = input.assignments.map((a) => a.roleId);
    const roles = await Promise.all(roleIds.map((id) => getRoleById(id)));
    if (roles.some((r) => !r)) {
      throw new ValidationAppError("One or more roles were not found.");
    }

    const nextIsSuperAdmin = roles.some(
      (r) => r!.code === SYSTEM_ROLE_CODES.SUPER_ADMIN,
    );

    if (currentlySuperAdmin && !nextIsSuperAdmin) {
      const remaining = await countSuperAdmins();
      // count includes this user; after removal must leave ≥1
      if (remaining <= 1) {
        throw new ForbiddenError(
          "Cannot remove the last SUPER_ADMIN assignment.",
        );
      }
      if (actor.id === userId) {
        throw new ForbiddenError(
          "You cannot remove your own SUPER_ADMIN role.",
        );
      }
    }

    const saved = await replaceUserRoles(
      userId,
      input.assignments.map((a) => ({
        roleId: a.roleId,
        scopeType: a.scopeType,
        orgUnitId: a.orgUnitId,
        projectId: a.projectId,
        assignedBy: actor.id,
      })),
    );

    invalidateUserPermissionCache(userId);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.roles_assign",
      entityType: "User",
      entityId: userId,
      after: {
        assignments: saved.map((s) => ({
          roleId: s.roleId,
          scopeType: s.scopeType,
          orgUnitId: s.orgUnitId,
          projectId: s.projectId,
        })),
      },
    });

    return this.getUserRoles(userId);
  },

  async getUserPermissionOverrides(userId: string) {
    await requirePermission(PERMISSIONS.ROLES_READ);
    const user = await getUserById(userId);
    if (!user) throw new NotFoundError("User", userId);
    const rows = await listUserPermissionOverrides(userId);
    return rows.map((row) => ({
      id: row.id,
      permissionId: row.permissionId,
      permissionCode: row.permission.code,
      effect: row.effect,
      scopeType: row.scopeType,
      orgUnitId: row.orgUnitId,
      projectId: row.projectId,
    }));
  },

  async setUserPermissionOverrides(
    userId: string,
    input: SetUserPermissionOverridesInput,
  ) {
    const actor = await requirePermission(PERMISSIONS.ROLES_ASSIGN);
    const user = await getUserById(userId);
    if (!user) throw new NotFoundError("User", userId);

    const codes = input.overrides.map((o) => o.permissionCode);
    const permissions = await findPermissionsByCodes(codes);
    const byCode = new Map(permissions.map((p) => [p.code, p]));
    if (byCode.size !== new Set(codes).size) {
      throw new ValidationAppError("One or more permission codes are invalid.");
    }

    const saved = await replaceUserPermissionOverrides(
      userId,
      input.overrides.map((o) => ({
        permissionId: byCode.get(o.permissionCode)!.id,
        effect: o.effect,
        scopeType: o.scopeType,
        orgUnitId: o.orgUnitId,
        projectId: o.projectId,
        createdById: actor.id,
      })),
    );

    invalidateUserPermissionCache(userId);

    writeAuditLogAsync({
      actorId: actor.id,
      action: "users.permissions_override",
      entityType: "User",
      entityId: userId,
      after: {
        overrides: saved.map((s) => ({
          permissionCode: s.permission.code,
          effect: s.effect,
          scopeType: s.scopeType,
        })),
      },
    });

    return this.getUserPermissionOverrides(userId);
  },
};
