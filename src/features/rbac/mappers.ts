import type { RoleWithPermissions } from "./repositories/rbac.repository";

export function toRoleDto(role: RoleWithPermissions) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    globalRead: role.globalRead,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    userCount: role._count.users,
    permissions: role.permissions.map((rp) => ({
      id: rp.permission.id,
      code: rp.permission.code,
      module: rp.permission.module,
      action: rp.permission.action,
      description: rp.permission.description,
    })),
  };
}

export type RoleDto = ReturnType<typeof toRoleDto>;

export function toPermissionDto(permission: {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
  createdAt: Date;
}) {
  return {
    id: permission.id,
    code: permission.code,
    module: permission.module,
    action: permission.action,
    description: permission.description,
    createdAt: permission.createdAt,
  };
}

export type PermissionDto = ReturnType<typeof toPermissionDto>;
