"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UserDto } from "../mappers";
import type {
  AdminResetPasswordInput,
  CreateUserInput,
  InviteUserInput,
  UpdateProfileInput,
  UpdateUserInput,
} from "../schemas/user.schemas";

type ListParams = {
  page: number;
  pageSize: number;
  q: string;
  status?: string;
  sort: string;
  order: "asc" | "desc";
};

type ListResponse = {
  data: UserDto[];
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

const USERS_ROOT = ["users"] as const;

export const userKeys = {
  all: USERS_ROOT,
  list: (params: ListParams) => [...USERS_ROOT, "list", params] as const,
  detail: (id: string) => [...USERS_ROOT, "detail", id] as const,
  linkOptions: [...USERS_ROOT, "link-options"] as const,
};

export function useUsersQuery(params: ListParams) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    q: params.q,
    sort: params.sort,
    order: params.order,
  });
  if (params.status) search.set("status", params.status);

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const response = await fetch(`/api/v1/users?${search.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to load users");
      }
      return payload as ListResponse;
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useUserQuery(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => api<UserDto>(`/api/v1/users/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useLinkOptionsQuery() {
  return useQuery({
    queryKey: userKeys.linkOptions,
    queryFn: () =>
      api<{
        employees: Array<{
          id: string;
          code: string;
          name: string;
          designation: string | null;
          userId: string | null;
        }>;
        contractors: Array<{
          id: string;
          code: string;
          name: string;
          email: string | null;
          primaryUserId: string | null;
        }>;
      }>("/api/v1/users/link-options"),
    staleTime: 5 * 60_000,
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api<{ user: UserDto; temporaryPassword?: string }>("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useInviteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteUserInput) =>
      api<{ user: UserDto; temporaryPassword?: string }>(
        "/api/v1/users?mode=invite",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUserMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) =>
      api<UserDto>(`/api/v1/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useMeQuery() {
  return useQuery({
    queryKey: [...USERS_ROOT, "me"] as const,
    queryFn: () => api<UserDto>("/api/v1/me"),
    staleTime: 60_000,
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      api<UserDto>("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...USERS_ROOT, "me"] as const });
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useActivateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<UserDto>(`/api/v1/users/${id}/activate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeactivateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<UserDto>(`/api/v1/users/${id}/deactivate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useResetPasswordMutation(id: string) {
  return useMutation({
    mutationFn: (input: AdminResetPasswordInput) =>
      api<{ ok: boolean; temporaryPassword?: string }>(
        `/api/v1/users/${id}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
  });
}

export function useSoftDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<UserDto>(`/api/v1/users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
