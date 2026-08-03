"use client";

import type { ReactNode } from "react";
import { useMyPermissionsQuery } from "../hooks/use-rbac";

type CanProps = {
  permission?: string | string[];
  role?: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function usePermissions() {
  const query = useMyPermissionsQuery();
  const permissions = new Set(query.data?.permissions ?? []);
  const roleCodes = new Set(query.data?.roleCodes ?? []);

  return {
    ...query,
    permissions,
    roleCodes,
    isSuperAdmin: query.data?.isSuperAdmin ?? false,
    globalRead: query.data?.globalRead ?? false,
    can: (code: string | string[]) => {
      if (query.data?.isSuperAdmin) return true;
      const codes = Array.isArray(code) ? code : [code];
      return codes.some((c) => permissions.has(c));
    },
    hasRole: (role: string | string[]) => {
      const roles = Array.isArray(role) ? role : [role];
      return roles.some((r) => roleCodes.has(r));
    },
  };
}

/** Client-side UI guard. Never rely on this alone — services enforce AuthZ. */
export function Can({ permission, role, fallback = null, children }: CanProps) {
  const { can, hasRole, isLoading } = usePermissions();

  if (isLoading) return null;

  const allowedPermission = permission ? can(permission) : true;
  const allowedRole = role ? hasRole(role) : true;

  if (!allowedPermission || !allowedRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
