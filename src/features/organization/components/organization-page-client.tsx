"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Network, Plus } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/feedback";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSIONS } from "@/domain/policies/permissions";
import { Can } from "@/features/rbac/components/can";
import type { OrgUnitDto } from "../mappers";
import {
  useDeleteOrgUnitMutation,
  useOrgTreeQuery,
  useOrgUnitsQuery,
} from "../hooks/use-organization";
import { CreateOrgUnitDialog } from "./create-org-unit-dialog";
import { OrgTreeView } from "./org-tree-view";

export function OrganizationPageClient() {
  const [view, setView] = useState<"tree" | "table">("tree");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("sortOrder");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgUnitDto | null>(null);

  const treeQuery = useOrgTreeQuery({ enabled: view === "tree" || createOpen });
  const listQuery = useOrgUnitsQuery({
    page,
    pageSize,
    q,
    type: type === "all" ? undefined : type,
    status: status === "all" ? undefined : status,
    sort,
    order,
    enabled: view === "table",
  });
  const deleteMutation = useDeleteOrgUnitMutation();

  const columns = useMemo<ColumnDef<OrgUnitDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Unit",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/organization/${row.original.id}`}
              className="font-medium text-primary hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "ACTIVE" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "parent",
        header: "Parent",
        cell: ({ row }) =>
          row.original.parent ? (
            <span className="text-sm">{row.original.parent.name}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Root</span>
          ),
      },
      {
        accessorKey: "childCount",
        header: "Children",
      },
      {
        accessorKey: "activeUserCount",
        header: "Users",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button asChild variant="outline" size="sm" className="min-h-10">
              <Link href={`/organization/${row.original.id}`}>Open</Link>
            </Button>
            <Can permission={PERMISSIONS.ORG_DELETE}>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-10"
                onClick={() => setDeleteTarget(row.original)}
              >
                Delete
              </Button>
            </Can>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title="Organization"
        description="HQ → Region → Division → Site → Store / Finance hierarchy."
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-xl border border-border/70 p-1">
              <Button
                type="button"
                variant={view === "tree" ? "secondary" : "ghost"}
                size="sm"
                className="min-h-10"
                onClick={() => setView("tree")}
              >
                <Network className="size-4" />
                Tree
              </Button>
              <Button
                type="button"
                variant={view === "table" ? "secondary" : "ghost"}
                size="sm"
                className="min-h-10"
                onClick={() => setView("table")}
              >
                Table
              </Button>
            </div>
            <Can permission={PERMISSIONS.ORG_CREATE}>
              <Button className="min-h-11" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Add unit
              </Button>
            </Can>
          </div>
        }
      />

      {view === "tree" ? (
        treeQuery.isError ? (
          <ErrorState
            description={treeQuery.error.message}
            onRetry={() => treeQuery.refetch()}
          />
        ) : treeQuery.isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
        ) : (
          <OrgTreeView
            nodes={treeQuery.data ?? []}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row">
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v ?? "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="min-h-11 w-full lg:w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {["HQ", "REGION", "DIVISION", "SITE", "OFFICE", "STORE", "FINANCE", "OTHER"].map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v ?? "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="min-h-11 w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sort}:${order}`}
              onValueChange={(value) => {
                const [nextSort, nextOrder] = (value ?? "sortOrder:asc").split(":");
                setSort(nextSort);
                setOrder((nextOrder as "asc" | "desc") || "asc");
              }}
            >
              <SelectTrigger className="min-h-11 w-full lg:w-52">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sortOrder:asc">Sort order</SelectItem>
                <SelectItem value="name:asc">Name A–Z</SelectItem>
                <SelectItem value="code:asc">Code A–Z</SelectItem>
                <SelectItem value="createdAt:desc">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {listQuery.isError ? (
            <ErrorState
              description={listQuery.error.message}
              onRetry={() => listQuery.refetch()}
            />
          ) : (
            <DataTable
              columns={columns}
              data={listQuery.data?.data ?? []}
              isLoading={listQuery.isLoading || listQuery.isFetching}
              searchValue={q}
              onSearchChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              searchPlaceholder="Search name or code…"
              page={page}
              pageSize={pageSize}
              total={listQuery.data?.meta.total ?? 0}
              onPageChange={setPage}
              emptyTitle="No organization units"
              emptyDescription="Create the first unit to build the hierarchy."
            />
          )}
        </>
      )}

      <CreateOrgUnitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultParentId={selectedId}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Soft delete organization unit?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be soft-deleted. Blocked if children or active users exist.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success("Organization unit deleted");
            setDeleteTarget(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Delete failed");
          }
        }}
      />
    </PageMotion>
  );
}
