"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { PermissionDto, RoleDto } from "../mappers";
import type {
  CreateRoleInput,
  SetRolePermissionsInput,
  SetUserPermissionOverridesInput,
  SetUserRolesInput,
  UpdateRoleInput,
} from "../schemas/rbac.schemas";

type ListParams = {
  page: number;
  pageSize: number;
  q: string;
};

type ListResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Request failed");
  }
  return payload.data ?? payload;
}

const RBAC_ROOT = ["rbac"] as const;

export const rbacKeys = {
  all: RBAC_ROOT,
  roles: (params: ListParams) => [...RBAC_ROOT, "roles", params] as const,
  role: (id: string) => [...RBAC_ROOT, "role", id] as const,
  permissions: (params: ListParams & { module?: string }) =>
    [...RBAC_ROOT, "permissions", params] as const,
  allPermissions: [...RBAC_ROOT, "permissions", "all"] as const,
  userRoles: (userId: string) => [...RBAC_ROOT, "user-roles", userId] as const,
  userOverrides: (userId: string) =>
    [...RBAC_ROOT, "user-overrides", userId] as const,
  me: [...RBAC_ROOT, "me-permissions"] as const,
};

export type MyPermissions = {
  permissions: string[];
  roleCodes: string[];
  globalRead: boolean;
  isSuperAdmin: boolean;
  projectIds: string[];
  orgUnitIds: string[];
  contractorId: string | null;
};

export function useMyPermissionsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rbacKeys.me,
    queryFn: () => api<MyPermissions>("/api/v1/me/permissions"),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useRolesQuery(params: ListParams) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    q: params.q,
  });

  return useQuery({
    queryKey: rbacKeys.roles(params),
    queryFn: async () => {
      const response = await fetch(`/api/v1/roles?${search.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load roles");
      }
      return payload as ListResponse<RoleDto>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useRoleQuery(id: string) {
  return useQuery({
    queryKey: rbacKeys.role(id),
    queryFn: () => api<RoleDto>(`/api/v1/roles/${id}`),
    enabled: !!id,
  });
}

export function useAllPermissionsQuery() {
  return useQuery({
    queryKey: rbacKeys.allPermissions,
    queryFn: () => api<PermissionDto[]>("/api/v1/permissions?all=1"),
    staleTime: 10 * 60_000,
  });
}

export function useCreateRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) =>
      api<RoleDto>("/api/v1/roles", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: rbacKeys.all }),
  });
}

export function useUpdateRoleMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRoleInput) =>
      api<RoleDto>(`/api/v1/roles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rbacKeys.all });
      qc.invalidateQueries({ queryKey: rbacKeys.role(id) });
    },
  });
}

export function useDeleteRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<RoleDto>(`/api/v1/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: rbacKeys.all }),
  });
}

export function useSetRolePermissionsMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetRolePermissionsInput) =>
      api<RoleDto>(`/api/v1/roles/${id}/permissions`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rbacKeys.all });
      qc.invalidateQueries({ queryKey: rbacKeys.role(id) });
      qc.invalidateQueries({ queryKey: rbacKeys.me });
    },
  });
}

export function useUserRolesQuery(userId: string) {
  return useQuery({
    queryKey: rbacKeys.userRoles(userId),
    queryFn: () =>
      api<
        Array<{
          id: string;
          roleId: string;
          roleCode: string;
          roleName: string;
          isSystem: boolean;
          scopeType: string;
          orgUnitId: string | null;
          projectId: string | null;
          assignedAt: string;
        }>
      >(`/api/v1/users/${userId}/roles`),
    enabled: !!userId,
  });
}

export function useSetUserRolesMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetUserRolesInput) =>
      api(`/api/v1/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rbacKeys.userRoles(userId) });
      qc.invalidateQueries({ queryKey: rbacKeys.me });
    },
  });
}

export function useUserOverridesQuery(userId: string) {
  return useQuery({
    queryKey: rbacKeys.userOverrides(userId),
    queryFn: () =>
      api<
        Array<{
          id: string;
          permissionId: string;
          permissionCode: string;
          effect: "ALLOW" | "DENY";
          scopeType: string;
          orgUnitId: string | null;
          projectId: string | null;
        }>
      >(`/api/v1/users/${userId}/permissions`),
    enabled: !!userId,
  });
}

export function useSetUserOverridesMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetUserPermissionOverridesInput) =>
      api(`/api/v1/users/${userId}/permissions`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rbacKeys.userOverrides(userId) });
      qc.invalidateQueries({ queryKey: rbacKeys.me });
    },
  });
}
