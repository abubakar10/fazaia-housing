"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Archive, MoreHorizontal, Plus, RotateCcw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Can } from "@/features/rbac/components/can";
import { formatDate } from "@/lib/utils";
import type { ProjectDto } from "../mappers";
import { PROJECT_STATUS_LABELS } from "../mappers";
import {
  useArchiveProjectMutation,
  useProjectsQuery,
  useRestoreProjectMutation,
} from "../hooks/use-projects";
import { CreateProjectDialog } from "./create-project-dialog";

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "ACTIVE"
      ? "default"
      : status === "ARCHIVED"
        ? "outline"
        : status === "ON_HOLD"
          ? "secondary"
          : "outline";
  return (
    <Badge variant={variant}>
      {PROJECT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function ProjectsPageClient() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sort] = useState("updatedAt");
  const [order] = useState<"asc" | "desc">("desc");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState<{
    type: "archive" | "restore";
    project: ProjectDto;
  } | null>(null);

  const query = useProjectsQuery({
    page,
    pageSize,
    q,
    status: status === "all" ? undefined : status,
    sort,
    order,
    includeArchived: status === "ARCHIVED" || status === "all",
  });

  const archiveMutation = useArchiveProjectMutation();
  const restoreMutation = useRestoreProjectMutation();

  const columns = useMemo<ColumnDef<ProjectDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Project",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/projects/${row.original.id}`}
              className="font-medium text-primary hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.code}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "org",
        header: "Organization",
        cell: ({ row }) => row.original.orgUnit?.name ?? "—",
      },
      {
        accessorKey: "memberCount",
        header: "Members",
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-9 min-w-9">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${row.original.id}`}>View</Link>
              </DropdownMenuItem>
              <Can permission="projects.archive">
                {row.original.status === "ARCHIVED" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      setConfirm({ type: "restore", project: row.original })
                    }
                  >
                    <RotateCcw className="size-4" />
                    Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      setConfirm({ type: "archive", project: row.original })
                    }
                  >
                    <Archive className="size-4" />
                    Archive
                  </DropdownMenuItem>
                )}
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  async function handleConfirm() {
    if (!confirm) return;
    try {
      if (confirm.type === "archive") {
        await archiveMutation.mutateAsync(confirm.project.id);
        toast.success("Project archived");
      } else {
        await restoreMutation.mutateAsync(confirm.project.id);
        toast.success("Project restored");
      }
      setConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Failed to load projects"
        description={query.error?.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage housing construction programs, membership, and active context."
        actions={
          <Can permission="projects.create">
            <Button className="min-h-11" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New project
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="min-h-11 w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Planning</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        searchPlaceholder="Search projects…"
        searchValue={q}
        onSearchChange={setQ}
        page={page}
        pageSize={pageSize}
        total={query.data?.meta.total ?? 0}
        onPageChange={setPage}
      />

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.type === "archive" ? "Archive project?" : "Restore project?"
        }
        description={
          confirm?.type === "archive"
            ? `${confirm?.project.name} will be read-only and hidden from default lists.`
            : `${confirm?.project.name} will return to its previous lifecycle status.`
        }
        confirmLabel={confirm?.type === "archive" ? "Archive" : "Restore"}
        onConfirm={handleConfirm}
        loading={archiveMutation.isPending || restoreMutation.isPending}
      />
    </PageMotion>
  );
}
