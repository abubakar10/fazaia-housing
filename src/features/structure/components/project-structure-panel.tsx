"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { ErrorState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Can } from "@/features/rbac/components/can";
import {
  useArchiveBlockMutation,
  useArchivePhaseMutation,
  useArchiveSectorMutation,
  useBulkBlocksMutation,
  useBulkPhasesMutation,
  useBulkSectorsMutation,
  useCreateBlockMutation,
  useCreatePhaseMutation,
  useCreateSectorMutation,
  useDeleteBlockMutation,
  useDeletePhaseMutation,
  useDeleteSectorMutation,
  useProjectHierarchyQuery,
  useRestoreBlockMutation,
  useRestorePhaseMutation,
  useRestoreSectorMutation,
} from "../hooks/use-structure";
import { STRUCTURE_STATUS_LABELS } from "../mappers";
import {
  StructureTreeView,
  type StructureSelection,
} from "./structure-tree-view";

type Props = {
  projectId: string;
  projectName: string;
  readOnly?: boolean;
};

type ConfirmKind =
  | { kind: "archive" | "restore" | "delete"; entity: "phase" | "sector" | "block"; id: string; name: string }
  | { kind: "bulk-archive" | "bulk-restore" | "bulk-delete"; entity: "phase" | "sector" | "block"; ids: string[] };

export function ProjectStructurePanel({ projectId, projectName, readOnly }: Props) {
  const hierarchyQuery = useProjectHierarchyQuery(projectId, true);
  const [selection, setSelection] = useState<StructureSelection>({ type: "project" });
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);

  const createPhase = useCreatePhaseMutation(projectId);
  const createSector = useCreateSectorMutation(projectId);
  const createBlock = useCreateBlockMutation(projectId);
  const archivePhase = useArchivePhaseMutation(projectId);
  const archiveSector = useArchiveSectorMutation(projectId);
  const archiveBlock = useArchiveBlockMutation(projectId);
  const restorePhase = useRestorePhaseMutation(projectId);
  const restoreSector = useRestoreSectorMutation(projectId);
  const restoreBlock = useRestoreBlockMutation(projectId);
  const deletePhase = useDeletePhaseMutation(projectId);
  const deleteSector = useDeleteSectorMutation(projectId);
  const deleteBlock = useDeleteBlockMutation(projectId);
  const bulkPhases = useBulkPhasesMutation(projectId);
  const bulkSectors = useBulkSectorsMutation(projectId);
  const bulkBlocks = useBulkBlocksMutation(projectId);

  const hierarchy = hierarchyQuery.data;

  const breadcrumb = useMemo(() => {
    const items = [{ label: projectName, onClick: () => setSelection({ type: "project" }) }];
    if (!hierarchy) return items;
    if (selection.type === "phase" || selection.type === "sector" || selection.type === "block") {
      const phase =
        selection.type === "phase"
          ? selection.node
          : hierarchy.phases.find((p) =>
              selection.type === "sector"
                ? p.id === selection.phaseId
                : p.id === selection.phaseId,
            );
      if (phase) {
        items.push({
          label: phase.name,
          onClick: () => setSelection({ type: "phase", id: phase.id, node: phase }),
        });
      }
    }
    if (selection.type === "sector" || selection.type === "block") {
      const phase = hierarchy.phases.find((p) => p.id === selection.phaseId);
      const sector =
        selection.type === "sector"
          ? selection.node
          : phase?.children.find((s) => s.id === selection.sectorId);
      if (sector) {
        items.push({
          label: sector.name,
          onClick: () =>
            setSelection({
              type: "sector",
              id: sector.id,
              node: sector,
              phaseId: selection.phaseId,
            }),
        });
      }
    }
    if (selection.type === "block") {
      items.push({ label: selection.node.name, onClick: () => undefined });
    }
    return items;
  }, [hierarchy, projectName, selection]);

  const tableRows = useMemo(() => {
    if (!hierarchy) return [];
    if (selection.type === "project") {
      return hierarchy.phases.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        meta: `${p.children.length} sectors`,
        entity: "phase" as const,
      }));
    }
    if (selection.type === "phase") {
      return selection.node.children.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        status: s.status,
        meta: `${s.children.length} blocks`,
        entity: "sector" as const,
      }));
    }
    if (selection.type === "sector") {
      return selection.node.children.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        status: b.status,
        meta: "Block",
        entity: "block" as const,
      }));
    }
    return [
      {
        id: selection.node.id,
        code: selection.node.code,
        name: selection.node.name,
        status: selection.node.status,
        meta: "Block",
        entity: "block" as const,
      },
    ];
  }, [hierarchy, selection]);

  const filteredRows = tableRows.filter((row) => {
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      row.name.toLowerCase().includes(needle) ||
      row.code.toLowerCase().includes(needle)
    );
  });

  const createLabel =
    selection.type === "project"
      ? "phase"
      : selection.type === "phase"
        ? "sector"
        : selection.type === "sector"
          ? "block"
          : null;

  async function handleCreate() {
    if (!name.trim() || !createLabel) return;
    try {
      if (selection.type === "project") {
        await createPhase.mutateAsync({
          projectId,
          name: name.trim(),
          code: code.trim() || null,
        });
      } else if (selection.type === "phase") {
        await createSector.mutateAsync({
          phaseId: selection.id,
          name: name.trim(),
          code: code.trim() || null,
        });
      } else if (selection.type === "sector") {
        await createBlock.mutateAsync({
          sectorId: selection.id,
          name: name.trim(),
          code: code.trim() || null,
        });
      }
      toast.success(`${createLabel[0]!.toUpperCase()}${createLabel.slice(1)} created`);
      setName("");
      setCode("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  }

  async function handleBulkCreate() {
    const names = bulkNames
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!names.length || !createLabel) return;
    try {
      if (selection.type === "project") {
        await bulkPhases.mutateAsync({
          projectId,
          items: names.map((n) => ({ name: n })),
        });
      } else if (selection.type === "phase") {
        await bulkSectors.mutateAsync({
          phaseId: selection.id,
          items: names.map((n) => ({ name: n })),
        });
      } else if (selection.type === "sector") {
        await bulkBlocks.mutateAsync({
          sectorId: selection.id,
          items: names.map((n) => ({ name: n })),
        });
      }
      toast.success(`Created ${names.length} ${createLabel}(s)`);
      setBulkNames("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk create failed");
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    try {
      if (confirm.kind === "archive") {
        if (confirm.entity === "phase") await archivePhase.mutateAsync(confirm.id);
        if (confirm.entity === "sector") await archiveSector.mutateAsync(confirm.id);
        if (confirm.entity === "block") await archiveBlock.mutateAsync(confirm.id);
        toast.success("Archived");
      } else if (confirm.kind === "restore") {
        if (confirm.entity === "phase") await restorePhase.mutateAsync(confirm.id);
        if (confirm.entity === "sector") await restoreSector.mutateAsync(confirm.id);
        if (confirm.entity === "block") await restoreBlock.mutateAsync(confirm.id);
        toast.success("Restored");
      } else if (confirm.kind === "delete") {
        if (confirm.entity === "phase") await deletePhase.mutateAsync(confirm.id);
        if (confirm.entity === "sector") await deleteSector.mutateAsync(confirm.id);
        if (confirm.entity === "block") await deleteBlock.mutateAsync(confirm.id);
        toast.success("Deleted");
      } else if (confirm.kind === "bulk-archive") {
        const body = { action: "archive", ids: confirm.ids };
        if (confirm.entity === "phase") await bulkPhases.mutateAsync(body);
        if (confirm.entity === "sector") await bulkSectors.mutateAsync(body);
        if (confirm.entity === "block") await bulkBlocks.mutateAsync(body);
        toast.success("Bulk archived");
      } else if (confirm.kind === "bulk-restore") {
        const body = { action: "restore", ids: confirm.ids };
        if (confirm.entity === "phase") await bulkPhases.mutateAsync(body);
        if (confirm.entity === "sector") await bulkSectors.mutateAsync(body);
        if (confirm.entity === "block") await bulkBlocks.mutateAsync(body);
        toast.success("Bulk restored");
      } else if (confirm.kind === "bulk-delete") {
        const body = { action: "delete", ids: confirm.ids };
        if (confirm.entity === "phase") await bulkPhases.mutateAsync(body);
        if (confirm.entity === "sector") await bulkSectors.mutateAsync(body);
        if (confirm.entity === "block") await bulkBlocks.mutateAsync(body);
        toast.success("Bulk deleted");
      }
      setSelectedIds([]);
      setConfirm(null);
      if (selection.type !== "project") setSelection({ type: "project" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const pending =
    createPhase.isPending ||
    createSector.isPending ||
    createBlock.isPending ||
    archivePhase.isPending ||
    deletePhase.isPending ||
    bulkPhases.isPending ||
    bulkSectors.isPending ||
    bulkBlocks.isPending;

  if (hierarchyQuery.isError) {
    return (
      <ErrorState
        title="Failed to load structure"
        description={hierarchyQuery.error.message}
        onRetry={() => hierarchyQuery.refetch()}
      />
    );
  }

  if (hierarchyQuery.isLoading || !hierarchy) return null;

  const childEntity =
    selection.type === "project"
      ? "phase"
      : selection.type === "phase"
        ? "sector"
        : selection.type === "sector"
          ? "block"
          : "block";

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {breadcrumb.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <span>/</span> : null}
            <button
              type="button"
              className="hover:text-foreground hover:underline"
              onClick={item.onClick}
            >
              {item.label}
            </button>
          </span>
        ))}
      </nav>

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,320px)_1fr]">
        <div className="min-w-0">
          <StructureTreeView
            hierarchy={hierarchy}
            selection={selection}
            onSelect={(next) => {
              setSelection(next);
              setSelectedIds([]);
              setQ("");
            }}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="min-h-11"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-h-11 w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIds.length > 0 && !readOnly ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setConfirm({
                    kind: "bulk-archive",
                    entity: childEntity,
                    ids: selectedIds,
                  })
                }
              >
                <Archive className="size-4" />
                Archive ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setConfirm({
                    kind: "bulk-restore",
                    entity: childEntity,
                    ids: selectedIds,
                  })
                }
              >
                <RotateCcw className="size-4" />
                Restore
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setConfirm({
                    kind: "bulk-delete",
                    entity: childEntity,
                    ids: selectedIds,
                  })
                }
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          ) : null}

          {/* Desktop / tablet table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border/70 md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={
                        filteredRows.length > 0 &&
                        filteredRows.every((r) => selectedIds.includes(r.id))
                      }
                      onCheckedChange={(checked) => {
                        setSelectedIds(checked ? filteredRows.map((r) => r.id) : []);
                      }}
                      disabled={readOnly}
                    />
                  </th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Info</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No items at this level.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="border-t border-border/60">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                          disabled={readOnly}
                        />
                      </td>
                      <td className="p-3 font-medium">{row.code}</td>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {STRUCTURE_STATUS_LABELS[row.status] ?? row.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{row.meta}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {row.status !== "ARCHIVED" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={readOnly}
                              onClick={() =>
                                setConfirm({
                                  kind: "archive",
                                  entity: row.entity,
                                  id: row.id,
                                  name: row.name,
                                })
                              }
                            >
                              Archive
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={readOnly}
                              onClick={() =>
                                setConfirm({
                                  kind: "restore",
                                  entity: row.entity,
                                  id: row.id,
                                  name: row.name,
                                })
                              }
                            >
                              Restore
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={readOnly}
                            onClick={() =>
                              setConfirm({
                                kind: "delete",
                                entity: row.entity,
                                id: row.id,
                                name: row.name,
                              })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items at this level.</p>
            ) : (
              filteredRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-border/70 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.code}</p>
                    </div>
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => toggleSelect(row.id)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {STRUCTURE_STATUS_LABELS[row.status] ?? row.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{row.meta}</span>
                  </div>
                  {!readOnly ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9"
                        onClick={() =>
                          setConfirm({
                            kind: row.status === "ARCHIVED" ? "restore" : "archive",
                            entity: row.entity,
                            id: row.id,
                            name: row.name,
                          })
                        }
                      >
                        {row.status === "ARCHIVED" ? "Restore" : "Archive"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9"
                        onClick={() =>
                          setConfirm({
                            kind: "delete",
                            entity: row.entity,
                            id: row.id,
                            name: row.name,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {createLabel && !readOnly ? (
            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
              <p className="text-sm font-medium">Add {createLabel}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="min-h-11"
                />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Code (auto if empty)"
                  className="min-h-11"
                />
              </div>
              <Can
                permission={
                  createLabel === "phase"
                    ? "phases.manage"
                    : createLabel === "sector"
                      ? "sectors.manage"
                      : "blocks.manage"
                }
              >
                <Button
                  className="min-h-11 w-full sm:w-auto"
                  onClick={handleCreate}
                  disabled={!name.trim() || pending}
                >
                  <Plus className="size-4" />
                  Create {createLabel}
                </Button>
              </Can>

              <div className="border-t border-border/60 pt-3 space-y-2">
                <p className="text-sm font-medium">Bulk create</p>
                <textarea
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                  placeholder={"One name per line\nPhase North\nPhase South"}
                  className="min-h-24 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
                />
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={handleBulkCreate}
                  disabled={!bulkNames.trim() || pending}
                >
                  Bulk create
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() =>
                    toast.message("CSV import is prepared and not enabled yet.")
                  }
                >
                  <Upload className="size-4" />
                  CSV import (coming soon)
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {!readOnly && createLabel ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:hidden">
          <Button
            className="min-h-11 w-full"
            onClick={handleCreate}
            disabled={!name.trim() || pending}
          >
            <Plus className="size-4" />
            Add {createLabel}
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.kind.includes("delete")
            ? "Soft delete?"
            : confirm?.kind.includes("restore")
              ? "Restore?"
              : "Archive?"
        }
        description={
          confirm && "name" in confirm
            ? `${confirm.name} will be ${confirm.kind}.`
            : confirm
              ? `${confirm.ids.length} item(s) will be updated.`
              : ""
        }
        confirmLabel="Confirm"
        onConfirm={runConfirm}
        loading={pending}
      />
    </div>
  );
}
