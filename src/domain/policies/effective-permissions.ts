type ScopedPermission = {
  code: string;
  scopeType: "GLOBAL" | "ORGANIZATION" | "PROJECT";
  orgUnitId: string | null;
  projectId: string | null;
};

type ScopedOverride = ScopedPermission & {
  effect: "ALLOW" | "DENY";
};

export type VisibilityContext = {
  userId: string;
  roleCodes: string[];
  permissions: Set<string>;
  projectIds: string[];
  orgUnitIds: string[];
  contractorId: string | null;
  globalRead: boolean;
  isSuperAdmin: boolean;
};

export type ResourceScope = {
  projectId?: string | null;
  orgUnitId?: string | null;
};

function scopeMatches(
  grant: Pick<ScopedPermission, "scopeType" | "orgUnitId" | "projectId">,
  resource?: ResourceScope,
): boolean {
  if (grant.scopeType === "GLOBAL") return true;

  if (grant.scopeType === "PROJECT") {
    if (!resource?.projectId) return false;
    return grant.projectId === resource.projectId;
  }

  if (grant.scopeType === "ORGANIZATION") {
    if (!resource?.orgUnitId) return false;
    return grant.orgUnitId === resource.orgUnitId;
  }

  return false;
}

/**
 * Pure effective-permission calculator.
 * Role grants union → ALLOW overrides add → DENY overrides remove (DENY wins).
 */
export function calculateEffectivePermissions(input: {
  rolePermissionCodes: string[];
  overrides: ScopedOverride[];
  resource?: ResourceScope;
  isSuperAdmin?: boolean;
  allPermissionCodes?: string[];
}): Set<string> {
  if (input.isSuperAdmin) {
    return new Set(input.allPermissionCodes ?? input.rolePermissionCodes);
  }

  const effective = new Set(input.rolePermissionCodes);

  const allows = input.overrides.filter((o) => o.effect === "ALLOW");
  const denies = input.overrides.filter((o) => o.effect === "DENY");

  for (const allow of allows) {
    if (scopeMatches(allow, input.resource)) {
      effective.add(allow.code);
    }
  }

  for (const deny of denies) {
    if (scopeMatches(deny, input.resource)) {
      effective.delete(deny.code);
    }
  }

  return effective;
}

export function hasPermissionInSet(
  permissions: Set<string>,
  code: string,
): boolean {
  return permissions.has(code);
}

export function canAccessResource(
  ctx: VisibilityContext,
  resource?: ResourceScope,
): boolean {
  if (ctx.globalRead || ctx.isSuperAdmin) return true;

  if (resource?.projectId) {
    return ctx.projectIds.includes(resource.projectId);
  }

  if (resource?.orgUnitId) {
    return ctx.orgUnitIds.includes(resource.orgUnitId);
  }

  return true;
}
