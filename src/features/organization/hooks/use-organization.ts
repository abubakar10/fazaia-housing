"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { OrgTreeNode, OrgUnitDto } from "../mappers";
import type {
  AssignOrgUsersInput,
  CreateOrgUnitInput,
  UpdateOrgUnitInput,
} from "../schemas/org.schemas";

type ListParams = {
  page: number;
  pageSize: number;
  q: string;
  type?: string;
  status?: string;
  parentId?: string;
  sort: string;
  order: "asc" | "desc";
};

type ListResponse = {
  data: OrgUnitDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    sort: string;
    order: "asc" | "desc";
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

const ORG_ROOT = ["organization"] as const;

export const orgKeys = {
  all: ORG_ROOT,
  list: (params: ListParams) => [...ORG_ROOT, "list", params] as const,
  tree: [...ORG_ROOT, "tree"] as const,
  detail: (id: string) => [...ORG_ROOT, "detail", id] as const,
  breadcrumb: (id: string) => [...ORG_ROOT, "breadcrumb", id] as const,
  members: (id: string) => [...ORG_ROOT, "members", id] as const,
  assignable: [...ORG_ROOT, "assignable"] as const,
};

export function useOrgUnitsQuery(params: ListParams & { enabled?: boolean }) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    q: params.q,
    sort: params.sort,
    order: params.order,
  });
  if (params.type) search.set("type", params.type);
  if (params.status) search.set("status", params.status);
  if (params.parentId) search.set("parentId", params.parentId);

  return useQuery({
    queryKey: orgKeys.list(params),
    queryFn: async () => {
      const response = await fetch(`/api/v1/org-units?${search.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load org units");
      }
      return payload as ListResponse;
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled: params.enabled ?? true,
  });
}

export function useOrgTreeQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: orgKeys.tree,
    queryFn: () => api<OrgTreeNode[]>("/api/v1/org-units/tree"),
    staleTime: 5 * 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useOrgUnitQuery(id: string) {
  return useQuery({
    queryKey: orgKeys.detail(id),
    queryFn: () => api<OrgUnitDto>(`/api/v1/org-units/${id}`),
    enabled: !!id,
  });
}

export function useOrgBreadcrumbQuery(id: string) {
  return useQuery({
    queryKey: orgKeys.breadcrumb(id),
    queryFn: () =>
      api<Array<{ id: string; code: string; name: string; type: string }>>(
        `/api/v1/org-units/${id}/breadcrumb`,
      ),
    enabled: !!id,
  });
}

export function useOrgMembersQuery(id: string) {
  return useQuery({
    queryKey: orgKeys.members(id),
    queryFn: () =>
      api<Array<{ id: string; name: string; email: string; status: string }>>(
        `/api/v1/org-units/${id}/users`,
      ),
    enabled: !!id,
  });
}

export function useAssignableUsersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: orgKeys.assignable,
    queryFn: () =>
      api<
        Array<{
          id: string;
          name: string;
          email: string;
          status: string;
          orgUnitId: string | null;
        }>
      >("/api/v1/org-units/assignable-users"),
    staleTime: 5 * 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateOrgUnitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrgUnitInput) =>
      api<OrgUnitDto>("/api/v1/org-units", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.all }),
  });
}

export function useUpdateOrgUnitMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrgUnitInput) =>
      api<OrgUnitDto>(`/api/v1/org-units/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.all });
      qc.invalidateQueries({ queryKey: orgKeys.detail(id) });
    },
  });
}

export function useDeleteOrgUnitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<OrgUnitDto>(`/api/v1/org-units/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.all }),
  });
}

export function useAssignOrgUsersMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignOrgUsersInput) =>
      api(`/api/v1/org-units/${id}/users`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.members(id) });
      qc.invalidateQueries({ queryKey: orgKeys.detail(id) });
      qc.invalidateQueries({ queryKey: orgKeys.assignable });
    },
  });
}
