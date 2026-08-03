import { ForbiddenError } from "@/domain/errors";
import { requireUser } from "@/features/auth/services/session.service";
import type { PermissionCode } from "./permissions";
import type { ResourceScope } from "./effective-permissions";
import { userHasPermission } from "@/features/rbac/services/access.service";

type Actor = {
  id: string;
  email: string;
  name: string;
  status: string;
};

export type RequirePermissionOptions = {
  resource?: ResourceScope;
};

/**
 * Server-side authorization gate. UI hiding is never sufficient —
 * services must call this (or userHasPermission) before mutating/reading.
 */
export async function requirePermission(
  permission: PermissionCode | string,
  options?: RequirePermissionOptions,
): Promise<Actor> {
  const user = await requireUser();

  if (user.status === "INVITED") {
    throw new ForbiddenError(
      `Missing permission: ${permission}. Activate your account before performing this action.`,
    );
  }

  if (user.status !== "ACTIVE") {
    throw new ForbiddenError(
      `Missing permission: ${permission}. Your account cannot perform this action.`,
    );
  }

  const allowed = await userHasPermission(
    user.id,
    permission,
    options?.resource,
  );

  if (!allowed) {
    throw new ForbiddenError(
      `Missing permission: ${permission}. You are not allowed to perform this action.`,
    );
  }

  return user;
}

export async function requireAnyPermission(
  permissions: Array<PermissionCode | string>,
  options?: RequirePermissionOptions,
): Promise<Actor> {
  const user = await requireUser();

  if (user.status !== "ACTIVE") {
    throw new ForbiddenError(
      "Your account cannot perform this action.",
    );
  }

  for (const permission of permissions) {
    if (await userHasPermission(user.id, permission, options?.resource)) {
      return user;
    }
  }

  throw new ForbiddenError(
    `Missing permissions: ${permissions.join(", ")}.`,
  );
}
