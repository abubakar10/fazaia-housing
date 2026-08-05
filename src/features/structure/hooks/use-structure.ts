"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  BlockDto,
  PhaseDto,
  ProjectHierarchyDto,
  SectorDto,
} from "../mappers";
import type {
  BulkCreateBlocksInput,
  BulkCreatePhasesInput,
  BulkCreateSectorsInput,
  CreateBlockInput,
  CreatePhaseInput,
  CreateSectorInput,
  UpdateBlockInput,
  UpdatePhaseInput,
  UpdateSectorInput,
} from "../schemas/structure.schemas";

type ListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ListResponse<T> = { data: T[]; meta: ListMeta };

type PhaseListParams = {
  projectId: string;
  page: number;
  pageSize: number;
  q: string;
  status?: string;
  includeArchived?: boolean;
  sort: string;
  order: "asc" | "desc";
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

const ROOT = ["structure"] as const;

export const structureKeys = {
  all: ROOT,
  hierarchy: (projectId: string) => [...ROOT, "hierarchy", projectId] as const,
  phases: (params: PhaseListParams) => [...ROOT, "phases", params] as const,
  sectors: (params: Record<string, unknown>) => [...ROOT, "sectors", params] as const,
  blocks: (params: Record<string, unknown>) => [...ROOT, "blocks", params] as const,
};

function invalidateStructure(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: structureKeys.all });
  qc.invalidateQueries({ queryKey: ["projects", "dashboard", projectId] });
}

export function useProjectHierarchyQuery(projectId: string, includeArchived = false) {
  return useQuery({
    queryKey: [...structureKeys.hierarchy(projectId), includeArchived],
    queryFn: () =>
      api<ProjectHierarchyDto>(
        `/api/v1/projects/${projectId}/hierarchy?includeArchived=${includeArchived}`,
      ),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function usePhasesQuery(params: PhaseListParams) {
  const search = new URLSearchParams({
    projectId: params.projectId,
    page: String(params.page),
    pageSize: String(params.pageSize),
    q: params.q,
    sort: params.sort,
    order: params.order,
    ...(params.status ? { status: params.status } : {}),
    ...(params.includeArchived ? { includeArchived: "true" } : {}),
  });

  return useQuery({
    queryKey: structureKeys.phases(params),
    queryFn: async () => {
      const response = await fetch(`/api/v1/phases?${search.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Failed to load phases");
      return payload as ListResponse<PhaseDto>;
    },
    enabled: !!params.projectId,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useCreatePhaseMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePhaseInput) =>
      api<PhaseDto>("/api/v1/phases", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useUpdatePhaseMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePhaseInput }) =>
      api<PhaseDto>(`/api/v1/phases/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useArchivePhaseMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<PhaseDto>(`/api/v1/phases/${id}/archive`, { method: "POST" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useRestorePhaseMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<PhaseDto>(`/api/v1/phases/${id}/restore`, { method: "POST" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useDeletePhaseMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<PhaseDto>(`/api/v1/phases/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useBulkPhasesMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkCreatePhasesInput | { action: string; ids: string[] }) =>
      api("/api/v1/phases/bulk", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useCreateSectorMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSectorInput) =>
      api<SectorDto>("/api/v1/sectors", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useUpdateSectorMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSectorInput }) =>
      api<SectorDto>(`/api/v1/sectors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useArchiveSectorMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<SectorDto>(`/api/v1/sectors/${id}/archive`, { method: "POST" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useRestoreSectorMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<SectorDto>(`/api/v1/sectors/${id}/restore`, { method: "POST" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useDeleteSectorMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<SectorDto>(`/api/v1/sectors/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useBulkSectorsMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkCreateSectorsInput | { action: string; ids: string[] }) =>
      api("/api/v1/sectors/bulk", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useCreateBlockMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockInput) =>
      api<BlockDto>("/api/v1/blocks", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useUpdateBlockMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBlockInput }) =>
      api<BlockDto>(`/api/v1/blocks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useArchiveBlockMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<BlockDto>(`/api/v1/blocks/${id}/archive`, { method: "POST" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useRestoreBlockMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<BlockDto>(`/api/v1/blocks/${id}/restore`, { method: "POST" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useDeleteBlockMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<BlockDto>(`/api/v1/blocks/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}

export function useBulkBlocksMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkCreateBlocksInput | { action: string; ids: string[] }) =>
      api("/api/v1/blocks/bulk", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateStructure(qc, projectId),
  });
}
