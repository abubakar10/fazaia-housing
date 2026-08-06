"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  HouseDto,
  HouseImportPreviewDto,
  HouseImportResultDto,
  HouseStatsDto,
  HouseStatusHistoryDto,
  HouseTemplateDto,
  HouseTypeDto,
} from "../mappers";
import type {
  CreateHouseInput,
  CreateHouseTemplateInput,
  CreateHouseTypeInput,
  HouseImportCommitInput,
  HouseImportPreviewInput,
  ReviseHouseTemplateInput,
  UpdateHouseInput,
  UpdateHouseTemplateInput,
  UpdateHouseTypeInput,
} from "../schemas/house.schemas";

type ListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ListResponse<T> = { data: T[]; meta: ListMeta };

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

const ROOT = ["houses"] as const;

export const houseKeys = {
  all: ROOT,
  list: (params: Record<string, unknown>) => [...ROOT, "list", params] as const,
  detail: (id: string) => [...ROOT, "detail", id] as const,
  stats: (projectId: string) => [...ROOT, "stats", projectId] as const,
  history: (id: string) => [...ROOT, "history", id] as const,
  types: (params: Record<string, unknown>) => [...ROOT, "types", params] as const,
  templates: (params: Record<string, unknown>) =>
    [...ROOT, "templates", params] as const,
  filters: (projectId?: string | null) => [...ROOT, "filters", projectId] as const,
};

function invalidateHouses(qc: ReturnType<typeof useQueryClient>, projectId?: string) {
  qc.invalidateQueries({ queryKey: houseKeys.all });
  if (projectId) {
    qc.invalidateQueries({ queryKey: ["projects", "dashboard", projectId] });
  }
}

export function useHousesQuery(params: {
  projectId: string;
  page: number;
  pageSize: number;
  q: string;
  phaseId?: string;
  sectorId?: string;
  blockId?: string;
  houseTypeId?: string;
  status?: string;
  includeArchived?: boolean;
  sort: string;
  order: "asc" | "desc";
}) {
  const search = new URLSearchParams({
    projectId: params.projectId,
    page: String(params.page),
    pageSize: String(params.pageSize),
    q: params.q,
    sort: params.sort,
    order: params.order,
    ...(params.phaseId ? { phaseId: params.phaseId } : {}),
    ...(params.sectorId ? { sectorId: params.sectorId } : {}),
    ...(params.blockId ? { blockId: params.blockId } : {}),
    ...(params.houseTypeId ? { houseTypeId: params.houseTypeId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.includeArchived ? { includeArchived: "true" } : {}),
  });

  return useQuery({
    queryKey: houseKeys.list(params),
    queryFn: async () => {
      const response = await fetch(`/api/v1/houses?${search.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Failed to load houses");
      return payload as ListResponse<HouseDto>;
    },
    enabled: !!params.projectId,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useHouseQuery(id: string) {
  return useQuery({
    queryKey: houseKeys.detail(id),
    queryFn: () => api<HouseDto>(`/api/v1/houses/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useHouseTemplateQuery(id?: string) {
  return useQuery({
    queryKey: [...ROOT, "template", id] as const,
    queryFn: () => api<HouseTemplateDto>(`/api/v1/house-templates/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useHouseStatsQuery(projectId: string) {
  return useQuery({
    queryKey: houseKeys.stats(projectId),
    queryFn: () => api<HouseStatsDto>(`/api/v1/houses/stats?projectId=${projectId}`),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useHouseTypesQuery(params: {
  projectId?: string;
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 50),
    q: params.q ?? "",
    ...(params.projectId ? { projectId: params.projectId } : {}),
  });
  return useQuery({
    queryKey: houseKeys.types(params),
    queryFn: async () => {
      const response = await fetch(`/api/v1/house-types?${search.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Failed to load types");
      return payload as ListResponse<HouseTypeDto>;
    },
    staleTime: 60_000,
  });
}

export function useHouseTemplatesQuery(params: {
  houseTypeId?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 50),
    ...(params.houseTypeId ? { houseTypeId: params.houseTypeId } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
  });
  return useQuery({
    queryKey: houseKeys.templates(params),
    queryFn: async () => {
      const response = await fetch(`/api/v1/house-templates?${search.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load templates");
      }
      return payload as ListResponse<HouseTemplateDto>;
    },
    staleTime: 60_000,
  });
}

export function useHouseStatusHistoryQuery(id: string) {
  return useQuery({
    queryKey: houseKeys.history(id),
    queryFn: () => api<HouseStatusHistoryDto[]>(`/api/v1/houses/${id}/status`),
    enabled: !!id,
  });
}

export function useSavedHouseFiltersQuery(projectId?: string | null) {
  return useQuery({
    queryKey: houseKeys.filters(projectId),
    queryFn: () =>
      api<
        Array<{
          id: string;
          name: string;
          payload: Record<string, unknown>;
        }>
      >(
        `/api/v1/houses/saved-filters${projectId ? `?projectId=${projectId}` : ""}`,
      ),
  });
}

export function useCreateHouseMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHouseInput) =>
      api<HouseDto>("/api/v1/houses", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useUpdateHouseMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHouseInput }) =>
      api<HouseDto>(`/api/v1/houses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useBulkHousesMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { action: string; ids: string[] }) =>
      api("/api/v1/houses/bulk", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useHouseImportMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: (HouseImportPreviewInput | HouseImportCommitInput) & { commit?: boolean },
    ) => {
      if (input.commit) {
        return api<HouseImportResultDto>("/api/v1/houses/import", {
          method: "POST",
          body: JSON.stringify({ ...input, commit: true, dryRun: false }),
        });
      }
      return api<HouseImportPreviewDto>("/api/v1/houses/import", {
        method: "POST",
        body: JSON.stringify({ ...input, dryRun: true }),
      });
    },
    onSuccess: (_data, vars) => {
      if (vars.commit) invalidateHouses(qc, projectId);
    },
  });
}

export function useReviseHouseTemplateMutation(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviseHouseTemplateInput }) =>
      api<HouseTemplateDto>(`/api/v1/house-templates/${id}/revisions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useCreateHouseTypeMutation(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHouseTypeInput) =>
      api<HouseTypeDto>("/api/v1/house-types", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useUpdateHouseTypeMutation(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHouseTypeInput }) =>
      api<HouseTypeDto>(`/api/v1/house-types/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useDeleteHouseTypeMutation(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/house-types/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useCreateHouseTemplateMutation(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHouseTemplateInput) =>
      api<HouseTemplateDto>("/api/v1/house-templates", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useUpdateHouseTemplateMutation(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHouseTemplateInput }) =>
      api<HouseTemplateDto>(`/api/v1/house-templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateHouses(qc, projectId),
  });
}

export function useSaveHouseFilterMutation(projectId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      projectId?: string | null;
      payload: Record<string, unknown>;
    }) =>
      api("/api/v1/houses/saved-filters", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: houseKeys.filters(projectId) }),
  });
}
