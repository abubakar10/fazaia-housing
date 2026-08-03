"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Shield } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { Can } from "./can";
import type { RoleDto } from "../mappers";
import {
  useDeleteRoleMutation,
  useRolesQuery,
} from "../hooks/use-rbac";
import { CreateRoleDialog } from "./create-role-dialog";

export function RolesPageClient() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleDto | null>(null);

  const query = useRolesQuery({ page, pageSize, q });
  const deleteMutation = useDeleteRoleMutation();

  const columns = useMemo<ColumnDef<RoleDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Role",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/admin/roles/${row.original.id}`}
              className="font-medium text-primary hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </div>
        ),
      },
      {
        accessorKey: "isSystem",
        header: "Type",
        cell: ({ row }) =>
          row.original.isSystem ? (
            <Badge variant="secondary">System</Badge>
          ) : (
            <Badge variant="outline">Custom</Badge>
          ),
      },
      {
        accessorKey: "globalRead",
        header: "Scope",
        cell: ({ row }) =>
          row.original.globalRead ? (
            <Badge>Global read</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Scoped</span>
          ),
      },
      {
        id: "permissions",
        header: "Permissions",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.permissions.length}</span>
        ),
      },
      {
        accessorKey: "userCount",
        header: "Users",
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
                <Link href={`/admin/roles/${row.original.id}`}>Open</Link>
              </DropdownMenuItem>
              <Can permission={PERMISSIONS.ROLES_UPDATE}>
                <DropdownMenuItem
                  disabled={row.original.isSystem}
                  onClick={() => setDeleteTarget(row.original)}
                >
                  Soft delete
                </DropdownMenuItem>
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Manage system and custom roles, permission matrix, and assignments."
        actions={
          <Can permission={PERMISSIONS.ROLES_CREATE}>
            <Button className="min-h-11" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create role
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Shield className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="min-h-11 w-full rounded-xl border border-border/70 bg-background pr-3 pl-10 text-sm outline-none focus:border-primary"
            placeholder="Search roles…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
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
          isLoading={query.isLoading}
          emptyTitle="No roles found"
          emptyDescription="Create a custom role or seed system roles."
          page={page}
          pageSize={pageSize}
          total={query.data?.meta.total ?? 0}
          onPageChange={setPage}
        />
      )}

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Soft delete role?"
        description={
          deleteTarget
            ? `Role ${deleteTarget.name} will be soft-deleted and removed from new assignments.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success("Role deleted");
            setDeleteTarget(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Delete failed");
          }
        }}
      />
    </PageMotion>
  );
}
