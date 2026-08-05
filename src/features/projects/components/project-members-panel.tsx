"use client";

import Link from "next/link";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Can } from "@/features/rbac/components/can";
import { useRolesQuery } from "@/features/rbac/hooks/use-rbac";
import { useUsersQuery } from "@/features/users/hooks/use-users";
import { formatDate } from "@/lib/utils";
import type { ProjectMemberDto } from "../mappers";
import {
  useProjectMembersQuery,
  useSetProjectMembersMutation,
} from "../hooks/use-projects";

type Props = {
  projectId: string;
  readOnly?: boolean;
};

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  INVITED: "Invited",
  LOCKED: "Locked",
};

async function fetchAllMembers(projectId: string): Promise<ProjectMemberDto[]> {
  const response = await fetch(`/api/v1/projects/${projectId}/members`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Failed to load members");
  }
  return payload.data as ProjectMemberDto[];
}

export function ProjectMembersPanel({ projectId, readOnly }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sort, setSort] = useState<"createdAt" | "name" | "email">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const membersQuery = useProjectMembersQuery(projectId, {
    page,
    pageSize,
    q,
    status: statusFilter === "all" ? undefined : statusFilter,
    roleId: roleFilter === "all" ? undefined : roleFilter,
    sort,
    order,
  });

  const setMutation = useSetProjectMembersMutation(projectId);
  const usersQuery = useUsersQuery({
    page: 1,
    pageSize: 100,
    q: "",
    status: "ACTIVE",
    sort: "name",
    order: "asc",
  });
  const rolesQuery = useRolesQuery({
    page: 1,
    pageSize: 50,
    q: "",
  });

  const [addUserId, setAddUserId] = useState<string>("");
  const [addRoleId, setAddRoleId] = useState<string>("__none__");

  const members = membersQuery.data?.data ?? [];
  const total = membersQuery.data?.meta?.total ?? 0;

  async function saveMembers(next: ProjectMemberDto[]) {
    await setMutation.mutateAsync({
      members: next.map((m) => ({
        userId: m.userId,
        employeeId: m.employeeId,
        contractorId: m.contractorId,
        roleId: m.roleId,
        roleHint: m.roleHint,
      })),
    });
  }

  async function addMember() {
    if (!addUserId) return;

    try {
      const allMembers = await fetchAllMembers(projectId);
      if (allMembers.some((m) => m.userId === addUserId)) {
        toast.error("User is already a member");
        return;
      }

      const user = usersQuery.data?.data.find((u) => u.id === addUserId);
      if (!user) return;

      const roleId = addRoleId === "__none__" ? null : addRoleId;
      const next: ProjectMemberDto[] = [
        ...allMembers,
        {
          id: `new-${addUserId}`,
          projectId,
          userId: addUserId,
          employeeId: user.employee?.id ?? null,
          contractorId: user.contractor?.id ?? null,
          roleId,
          roleHint: null,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status,
            avatarUrl: user.avatarUrl,
          },
          employee: user.employee,
          contractor: user.contractor,
          role: rolesQuery.data?.data.find((r) => r.id === roleId) ?? null,
          joinedAt: new Date().toISOString(),
        },
      ];

      await saveMembers(next);
      toast.success("Member added");
      setAddUserId("");
      setAddRoleId("__none__");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add member");
    }
  }

  async function removeMember(userId: string) {
    try {
      const allMembers = await fetchAllMembers(projectId);
      const next = allMembers.filter((m) => m.userId !== userId);
      await saveMembers(next);
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  const columns: ColumnDef<ProjectMemberDto>[] = [
      {
        id: "name",
        header: "Member",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">{row.original.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.user.email}
            </p>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) =>
          row.original.role ? (
            <Badge variant="secondary">{row.original.role.name}</Badge>
          ) : (
            "—"
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline">
            {USER_STATUS_LABELS[row.original.user.status] ?? row.original.user.status}
          </Badge>
        ),
      },
      {
        id: "joinedAt",
        header: "Joined",
        cell: ({ row }) => formatDate(row.original.joinedAt),
      },
      {
        id: "links",
        header: "Links",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.employee ? (
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href={`/admin/users/${row.original.userId}`}>
                  Emp: {row.original.employee.code}
                </Link>
              </Button>
            ) : null}
            {row.original.contractor ? (
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href={`/admin/users/${row.original.userId}`}>
                  Con: {row.original.contractor.code}
                </Link>
              </Button>
            ) : null}
            {!row.original.employee && !row.original.contractor ? (
              <span className="text-muted-foreground">—</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Can permission="projects.members">
            <Button
              variant="outline"
              size="sm"
              className="min-h-9"
              disabled={readOnly || setMutation.isPending}
              onClick={() => removeMember(row.original.userId)}
            >
              Remove
            </Button>
          </Can>
        ),
      },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-h-11">
              <SelectValue placeholder="User status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="INVITED">Invited</SelectItem>
              <SelectItem value="LOCKED">Locked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="min-h-11">
              <SelectValue placeholder="Project role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {(rolesQuery.data?.data ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={`${sort}:${order}`}
            onValueChange={(value) => {
              const [s, o] = value.split(":") as [
                "createdAt" | "name" | "email",
                "asc" | "desc",
              ];
              setSort(s);
              setOrder(o);
            }}
          >
            <SelectTrigger className="min-h-11">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:asc">Joined (oldest)</SelectItem>
              <SelectItem value="createdAt:desc">Joined (newest)</SelectItem>
              <SelectItem value="name:asc">Name (A–Z)</SelectItem>
              <SelectItem value="name:desc">Name (Z–A)</SelectItem>
              <SelectItem value="email:asc">Email (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 p-4 lg:border-0 lg:p-0">
        <p className="mb-3 text-sm font-medium">Add member</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Select value={addUserId} onValueChange={setAddUserId} disabled={readOnly}>
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {(usersQuery.data?.data ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={addRoleId} onValueChange={setAddRoleId} disabled={readOnly}>
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Project role (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No role</SelectItem>
                {(rolesQuery.data?.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Can permission="projects.members">
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={addMember}
              disabled={readOnly || !addUserId || setMutation.isPending}
            >
              <UserPlus className="size-4" />
              Add
            </Button>
          </Can>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={members}
        isLoading={membersQuery.isLoading}
        searchPlaceholder="Search members…"
        searchValue={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyTitle="No members"
        emptyDescription="Add users to collaborate on this project."
      />

      <Can permission="projects.members">
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:hidden">
          <Button
            className="min-h-11 w-full"
            onClick={addMember}
            disabled={readOnly || !addUserId || setMutation.isPending}
          >
            <UserPlus className="size-4" />
            Add member
          </Button>
        </div>
      </Can>
    </div>
  );
}
