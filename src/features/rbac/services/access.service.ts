import {
  ALL_PERMISSION_CODES,
  SYSTEM_ROLE_CODES,
} from "@/domain/policies/permissions";
import {
  calculateEffectivePermissions,
  canAccessResource,
  type ResourceScope,
  type VisibilityContext,
} from "@/domain/policies/effective-permissions";
import { permissionCache } from "@/infrastructure/cache";
import { loadAccessGraph } from "../repositories/rbac.repository";

const CACHE_PREFIX = "perms:";

type CachedAccess = {
  ctx: VisibilityContext;
  /** Role grants before overrides, for scoped recalculation */
  roleGrants: Array<{
    code: string;
    scopeType: "GLOBAL" | "ORGANIZATION" | "PROJECT";
    orgUnitId: string | null;
    projectId: string | null;
  }>;
  overrides: Array<{
    code: string;
    effect: "ALLOW" | "DENY";
    scopeType: "GLOBAL" | "ORGANIZATION" | "PROJECT";
    orgUnitId: string | null;
    projectId: string | null;
  }>;
};

function toCached(access: Awaited<ReturnType<typeof loadAccessGraph>>): CachedAccess | null {
  if (!access.user) return null;

  const roleCodes = [
    ...new Set(access.userRoles.map((ur) => ur.role.code)),
  ];
  const isSuperAdmin = roleCodes.includes(SYSTEM_ROLE_CODES.SUPER_ADMIN);
  const globalRead =
    isSuperAdmin || access.userRoles.some((ur) => ur.role.globalRead);

  const roleGrants = access.userRoles.flatMap((ur) =>
    ur.role.permissions.map((rp) => ({
      code: rp.permission.code,
      scopeType: ur.scopeType,
      orgUnitId: ur.orgUnitId,
      projectId: ur.projectId,
    })),
  );

  const overrides = access.overrides.map((o) => ({
    code: o.permission.code,
    effect: o.effect,
    scopeType: o.scopeType,
    orgUnitId: o.orgUnitId,
    projectId: o.projectId,
  }));

  const globalRoleCodes = roleGrants
    .filter((g) => g.scopeType === "GLOBAL")
    .map((g) => g.code);

  const permissions = calculateEffectivePermissions({
    rolePermissionCodes: isSuperAdmin
      ? ALL_PERMISSION_CODES
      : [...new Set(globalRoleCodes)],
    overrides: overrides.filter((o) => o.scopeType === "GLOBAL"),
    isSuperAdmin,
    allPermissionCodes: ALL_PERMISSION_CODES,
  });

  const projectIds = [
    ...new Set(
      access.userRoles
        .filter((ur) => ur.scopeType === "PROJECT" && ur.projectId)
        .map((ur) => ur.projectId as string),
    ),
  ];

  const orgUnitIds = [
    ...new Set(
      [
        access.user.orgUnitId,
        ...access.userRoles
          .filter((ur) => ur.scopeType === "ORGANIZATION" && ur.orgUnitId)
          .map((ur) => ur.orgUnitId as string),
      ].filter(Boolean) as string[],
    ),
  ];

  return {
    roleGrants,
    overrides,
    ctx: {
      userId: access.user.id,
      roleCodes,
      permissions,
      projectIds,
      orgUnitIds,
      contractorId: access.user.contractorUser?.id ?? null,
      globalRead,
      isSuperAdmin,
    },
  };
}

export function invalidateUserPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(`${CACHE_PREFIX}${userId}`);
    return;
  }
  permissionCache.deleteByPrefix(CACHE_PREFIX);
}

async function getCachedAccess(userId: string): Promise<CachedAccess | null> {
  const key = `${CACHE_PREFIX}${userId}`;
  const hit = permissionCache.get(key) as CachedAccess | undefined;
  if (hit) return hit;

  const loaded = toCached(await loadAccessGraph(userId));
  if (!loaded) return null;
  permissionCache.set(key, loaded);
  return loaded;
}

export async function resolveVisibilityContext(
  userId: string,
): Promise<VisibilityContext | null> {
  const cached = await getCachedAccess(userId);
  return cached?.ctx ?? null;
}

export async function resolveEffectivePermissionCodes(
  userId: string,
  resource?: ResourceScope,
): Promise<Set<string>> {
  const cached = await getCachedAccess(userId);
  if (!cached) return new Set();

  if (cached.ctx.isSuperAdmin) {
    return new Set(ALL_PERMISSION_CODES);
  }

  if (!resource?.projectId && !resource?.orgUnitId) {
    return cached.ctx.permissions;
  }

  const scopedRoleCodes = cached.roleGrants
    .filter((g) => {
      if (g.scopeType === "GLOBAL") return true;
      if (
        g.scopeType === "PROJECT" &&
        resource.projectId &&
        g.projectId === resource.projectId
      ) {
        return true;
      }
      if (
        g.scopeType === "ORGANIZATION" &&
        resource.orgUnitId &&
        g.orgUnitId === resource.orgUnitId
      ) {
        return true;
      }
      return false;
    })
    .map((g) => g.code);

  return calculateEffectivePermissions({
    rolePermissionCodes: [...new Set(scopedRoleCodes)],
    overrides: cached.overrides,
    resource,
    isSuperAdmin: false,
  });
}

export async function userHasPermission(
  userId: string,
  permission: string,
  resource?: ResourceScope,
): Promise<boolean> {
  const permissions = await resolveEffectivePermissionCodes(userId, resource);
  if (!permissions.has(permission)) return false;

  if (!resource?.projectId && !resource?.orgUnitId) return true;

  const ctx = await resolveVisibilityContext(userId);
  if (!ctx) return false;
  return canAccessResource(ctx, resource);
}
