"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { MoreHorizontal, Plus, UserPlus } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/feedback";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { UserDto } from "../mappers";
import {
  useActivateUserMutation,
  useDeactivateUserMutation,
  useSoftDeleteUserMutation,
  useUsersQuery,
} from "../hooks/use-users";
import { InviteUserDialog } from "./invite-user-dialog";
import { CreateUserDialog } from "./create-user-dialog";

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "ACTIVE"
      ? "default"
      : status === "INVITED"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

export function UsersPageClient() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState<{
    type: "deactivate" | "activate" | "delete";
    user: UserDto;
  } | null>(null);

  const query = useUsersQuery({
    page,
    pageSize,
    q,
    status: status === "all" ? undefined : status,
    sort,
    order,
  });

  const activateMutation = useActivateUserMutation();
  const deactivateMutation = useDeactivateUserMutation();
  const deleteMutation = useSoftDeleteUserMutation();

  const columns = useMemo<ColumnDef<UserDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/admin/users/${row.original.id}`}
              className="font-medium text-primary hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "links",
        header: "Links",
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground">
            <p>
              Emp: {row.original.employee?.code ?? "—"}
            </p>
            <p>
              Con: {row.original.contractor?.code ?? "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "lastLoginAt",
        header: "Last login",
        cell: ({ row }) => formatDate(row.original.lastLoginAt),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${row.original.id}`}>View details</Link>
              </DropdownMenuItem>
              {row.original.status !== "ACTIVE" ? (
                <DropdownMenuItem
                  onClick={() =>
                    setConfirm({ type: "activate", user: row.original })
                  }
                >
                  Activate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    setConfirm({ type: "deactivate", user: row.original })
                  }
                >
                  Deactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  setConfirm({ type: "delete", user: row.original })
                }
              >
                Soft delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  async function runConfirm() {
    if (!confirm) return;
    try {
      if (confirm.type === "activate") {
        await activateMutation.mutateAsync(confirm.user.id);
        toast.success("User activated");
      } else if (confirm.type === "deactivate") {
        await deactivateMutation.mutateAsync(confirm.user.id);
        toast.success("User deactivated");
      } else {
        await deleteMutation.mutateAsync(confirm.user.id);
        toast.success("User soft-deleted");
      }
      setConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title="Users"
        description="Invite, activate, and manage platform users. Link accounts to employees or contractors."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="size-4" />
              Invite
            </Button>
            <Button className="min-h-11" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create user
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="min-h-11 w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INVITED">Invited</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="LOCKED">Locked</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={`${sort}:${order}`}
          onValueChange={(value) => {
            const [nextSort, nextOrder] = (value ?? "createdAt:desc").split(":");
            setSort(nextSort);
            setOrder((nextOrder as "asc" | "desc") || "desc");
          }}
        >
          <SelectTrigger className="min-h-11 w-full sm:w-56">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Newest first</SelectItem>
            <SelectItem value="createdAt:asc">Oldest first</SelectItem>
            <SelectItem value="name:asc">Name A–Z</SelectItem>
            <SelectItem value="name:desc">Name Z–A</SelectItem>
            <SelectItem value="email:asc">Email A–Z</SelectItem>
            <SelectItem value="status:asc">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isError ? (
        <ErrorState
          description={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={query.data?.data ?? []}
          isLoading={query.isLoading || query.isFetching}
          searchValue={q}
          onSearchChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          searchPlaceholder="Search name, email, phone…"
          page={page}
          pageSize={pageSize}
          total={query.data?.meta.total ?? 0}
          onPageChange={setPage}
          emptyTitle="No users found"
          emptyDescription="Invite a user or create one to get started."
        />
      )}

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.type === "activate"
            ? "Activate user?"
            : confirm?.type === "deactivate"
              ? "Deactivate user?"
              : "Soft delete user?"
        }
        description={
          confirm
            ? `${confirm.user.name} (${confirm.user.email}) will be updated.`
            : undefined
        }
        confirmLabel="Confirm"
        destructive={confirm?.type !== "activate"}
        loading={
          activateMutation.isPending ||
          deactivateMutation.isPending ||
          deleteMutation.isPending
        }
        onConfirm={runConfirm}
      />
    </PageMotion>
  );
}
