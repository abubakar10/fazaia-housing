import type { PermissionEffect, PermissionScope, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db";

const roleInclude = {
  permissions: {
    include: {
      permission: true,
    },
  },
  _count: {
    select: { users: true },
  },
} satisfies Prisma.RoleInclude;

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: typeof roleInclude;
}>;

export async function listRoles(input: {
  page: number;
  pageSize: number;
  q?: string;
  includeDeleted?: boolean;
}) {
  const where: Prisma.RoleWhereInput = {
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.q
      ? {
          OR: [
            { name: { contains: input.q, mode: "insensitive" } },
            { code: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.role.count({ where }),
    prisma.role.findMany({
      where,
      include: roleInclude,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function getRoleById(id: string) {
  return prisma.role.findFirst({
    where: { id, deletedAt: null },
    include: roleInclude,
  });
}

export async function getRoleByCode(code: string) {
  return prisma.role.findFirst({
    where: { code, deletedAt: null },
    include: roleInclude,
  });
}

export async function createRole(data: {
  code: string;
  name: string;
  description?: string | null;
  globalRead?: boolean;
}) {
  return prisma.role.create({
    data: {
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description ?? null,
      isSystem: false,
      globalRead: data.globalRead ?? false,
    },
    include: roleInclude,
  });
}

export async function updateRole(
  id: string,
  data: Prisma.RoleUpdateInput,
) {
  return prisma.role.update({
    where: { id },
    data,
    include: roleInclude,
  });
}

export async function softDeleteRole(id: string) {
  return prisma.role.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: roleInclude,
  });
}

export async function replaceRolePermissions(
  roleId: string,
  permissionIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      });
    }
    return tx.role.findFirstOrThrow({
      where: { id: roleId },
      include: roleInclude,
    });
  });
}

export async function listPermissions(input: {
  page: number;
  pageSize: number;
  q?: string;
  module?: string;
}) {
  const where: Prisma.PermissionWhereInput = {
    ...(input.module ? { module: input.module } : {}),
    ...(input.q
      ? {
          OR: [
            { code: { contains: input.q, mode: "insensitive" } },
            { module: { contains: input.q, mode: "insensitive" } },
            { action: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.permission.count({ where }),
    prisma.permission.findMany({
      where,
      orderBy: [{ module: "asc" }, { action: "asc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function listAllPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
}

export async function findPermissionsByCodes(codes: string[]) {
  return prisma.permission.findMany({
    where: { code: { in: codes } },
  });
}

export async function listUserRoles(userId: string) {
  return prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
    orderBy: { assignedAt: "asc" },
  });
}

export async function replaceUserRoles(
  userId: string,
  assignments: Array<{
    roleId: string;
    scopeType: PermissionScope;
    orgUnitId?: string | null;
    projectId?: string | null;
    assignedBy?: string | null;
  }>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } });
    if (assignments.length) {
      await tx.userRole.createMany({
        data: assignments.map((a) => ({
          userId,
          roleId: a.roleId,
          scopeType: a.scopeType,
          orgUnitId: a.scopeType === "ORGANIZATION" ? a.orgUnitId ?? null : null,
          projectId: a.scopeType === "PROJECT" ? a.projectId ?? null : null,
          assignedBy: a.assignedBy ?? null,
        })),
      });
    }
    return tx.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  });
}

export async function listUserPermissionOverrides(userId: string) {
  return prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function replaceUserPermissionOverrides(
  userId: string,
  overrides: Array<{
    permissionId: string;
    effect: PermissionEffect;
    scopeType: PermissionScope;
    orgUnitId?: string | null;
    projectId?: string | null;
    createdById?: string | null;
  }>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.userPermission.deleteMany({ where: { userId } });
    if (overrides.length) {
      await tx.userPermission.createMany({
        data: overrides.map((o) => ({
          userId,
          permissionId: o.permissionId,
          effect: o.effect,
          scopeType: o.scopeType,
          orgUnitId: o.scopeType === "ORGANIZATION" ? o.orgUnitId ?? null : null,
          projectId: o.scopeType === "PROJECT" ? o.projectId ?? null : null,
          createdById: o.createdById ?? null,
        })),
      });
    }
    return tx.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
  });
}

export async function countUsersWithRole(roleId: string) {
  return prisma.userRole.count({ where: { roleId } });
}

export async function countSuperAdmins() {
  return prisma.userRole.count({
    where: {
      role: { code: "SUPER_ADMIN", deletedAt: null },
      user: { deletedAt: null, status: { in: ["ACTIVE", "INVITED"] } },
    },
  });
}

export async function loadAccessGraph(userId: string) {
  const [user, userRoles, overrides] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        orgUnitId: true,
        status: true,
        contractorUser: { select: { id: true } },
      },
    }),
    prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    }),
    prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    }),
  ]);

  return { user, userRoles, overrides };
}
