import { ForbiddenError } from "@/domain/errors";
import { requirePermission } from "@/domain/policies/require-permission";
import type { PermissionCode } from "@/domain/policies/permissions";
import type { ResourceScope } from "@/domain/policies/effective-permissions";

/**
 * Server-side route/page guard. Call from Server Components or route handlers
 * before rendering protected admin surfaces.
 */
export async function assertPagePermission(
  permission: PermissionCode | string,
  resource?: ResourceScope,
) {
  try {
    return await requirePermission(permission, { resource });
  } catch (error) {
    if (error instanceof ForbiddenError) throw error;
    throw error;
  }
}
