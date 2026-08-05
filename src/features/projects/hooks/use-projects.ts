"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ProjectDashboardDto,
  ProjectDto,
  ProjectMemberDto,
} from "../mappers";
import type {
  CreateProjectInput,
  SetProjectMembersInput,
  UpdateProjectInput,
} from "../schemas/project.schemas";

type ListParams = {
  page: number;
  pageSize: number;
  q: string;
  status?: string;
  sort: string;
  order: "asc" | "desc";
  includeArchived?: boolean;
};

type MemberListParams = {
  page: number;
  pageSize: number;
  q: string;
  status?: string;
  roleId?: string;
  sort: string;
  order: "asc" | "desc";
};

type ListResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    sort?: string;
    order?: "asc" | "desc";
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

const PROJECTS_ROOT = ["projects"] as const;

export const projectKeys = {
  all: PROJECTS_ROOT,
  list: (params: ListParams) => [...PROJECTS_ROOT, "list", params] as const,
  detail: (id: string) => [...PROJECTS_ROOT, "detail", id] as const,
  dashboard: (id: string) => [...PROJECTS_ROOT, "dashboard", id] as const,
  members: (id: string, params?: MemberListParams) =>
    [...PROJECTS_ROOT, "members", id, params ?? "all"] as const,
  context: [...PROJECTS_ROOT, "context"] as const,
};

export function useProjectsQuery(params: ListParams) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    q: params.q,
    sort: params.sort,
    order: params.order,
    ...(params.status ? { status: params.status } : {}),
    ...(params.includeArchived ? { includeArchived: "true" } : {}),
  });

  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const response = await fetch(`/api/v1/projects?${search.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load projects");
      }
      return payload as ListResponse<ProjectDto>;
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useProjectQuery(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api<ProjectDto>(`/api/v1/projects/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useProjectDashboardQuery(id: string) {
  return useQuery({
    queryKey: projectKeys.dashboard(id),
    queryFn: () => api<ProjectDashboardDto>(`/api/v1/projects/${id}/dashboard`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useProjectMembersQuery(id: string, params?: MemberListParams) {
  const search = params
    ? new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize),
        q: params.q,
        sort: params.sort,
        order: params.order,
        ...(params.status ? { status: params.status } : {}),
        ...(params.roleId ? { roleId: params.roleId } : {}),
      })
    : null;

  return useQuery({
    queryKey: projectKeys.members(id, params),
    queryFn: async () => {
      const url = search
        ? `/api/v1/projects/${id}/members?${search.toString()}`
        : `/api/v1/projects/${id}/members`;
      const response = await fetch(url);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load members");
      }
      if (params) return payload as ListResponse<ProjectMemberDto>;
      return { data: payload.data as ProjectMemberDto[], meta: undefined };
    },
    enabled: !!id,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useCreateProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      api<ProjectDto>("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.context });
    },
  });
}

export function useUpdateProjectMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) =>
      api<ProjectDto>(`/api/v1/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
      qc.invalidateQueries({ queryKey: projectKeys.dashboard(id) });
    },
  });
}

export function useArchiveProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<ProjectDto>(`/api/v1/projects/${id}/archive`, { method: "POST" }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.dashboard(id) });
    },
  });
}

export function useRestoreProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<ProjectDto>(`/api/v1/projects/${id}/restore`, { method: "POST" }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.dashboard(id) });
    },
  });
}

export function useDeleteProjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/v1/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useSetProjectMembersMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetProjectMembersInput) =>
      api<ProjectMemberDto[]>(`/api/v1/projects/${projectId}/members`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.members(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.dashboard(projectId) });
    },
  });
}

export type ProjectContextResponse = {
  projectId: string | null;
  project: { id: string; code: string; name: string; status: string } | null;
  availableProjects: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
  }>;
};

export function useProjectContextQuery() {
  return useQuery({
    queryKey: projectKeys.context,
    queryFn: () => api<ProjectContextResponse>("/api/v1/project-context"),
    staleTime: 5 * 60_000,
  });
}

export function useSetProjectContextMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string | null) =>
      api<{ projectId: string | null; project: ProjectContextResponse["project"] }>(
        "/api/v1/project-context",
        {
          method: "PUT",
          body: JSON.stringify({ projectId }),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.context }),
  });
}
