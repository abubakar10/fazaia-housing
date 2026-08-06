"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Archive,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { DataTable } from "@/components/data-table";
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
import { useProjectHierarchyQuery } from "@/features/structure/hooks/use-structure";
import type { ColumnDef } from "@tanstack/react-table";
import {
  HOUSE_STATUS_LABELS,
  type HouseDto,
  type HouseImportPreviewDto,
} from "../mappers";
import {
  useBulkHousesMutation,
  useCreateHouseMutation,
  useHouseImportMutation,
  useHousesQuery,
  useHouseStatsQuery,
  useHouseTemplatesQuery,
  useHouseTypesQuery,
  useSaveHouseFilterMutation,
  useSavedHouseFiltersQuery,
} from "../hooks/use-houses";

type Props = {
  projectId: string;
  readOnly?: boolean;
};

const STATUS_OPTIONS = Object.keys(HOUSE_STATUS_LABELS);

export function ProjectHousesPanel({ projectId, readOnly }: Props) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [phaseId, setPhaseId] = useState<string>("all");
  const [sectorId, setSectorId] = useState<string>("all");
  const [blockId, setBlockId] = useState<string>("all");
  const [houseTypeId, setHouseTypeId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<{
    action: "archive" | "restore" | "delete";
  } | null>(null);

  const [newNameCode, setNewNameCode] = useState("");
  const [newPlot, setNewPlot] = useState("");
  const [newPhaseId, setNewPhaseId] = useState("");
  const [newSectorId, setNewSectorId] = useState("");
  const [newBlockId, setNewBlockId] = useState("");
  const [newTypeId, setNewTypeId] = useState("");
  const [newTemplateId, setNewTemplateId] = useState("__none__");
  const [csvText, setCsvText] = useState("");
  const [importPreview, setImportPreview] = useState<HouseImportPreviewDto | null>(
    null,
  );
  const [filterName, setFilterName] = useState("");

  const hierarchyQuery = useProjectHierarchyQuery(projectId, true);
  const statsQuery = useHouseStatsQuery(projectId);
  const typesQuery = useHouseTypesQuery({ projectId, pageSize: 100 });
  const templatesQuery = useHouseTemplatesQuery({
    houseTypeId: newTypeId || undefined,
    projectId,
  });
  const savedFiltersQuery = useSavedHouseFiltersQuery(projectId);

  const housesQuery = useHousesQuery({
    projectId,
    page,
    pageSize: 50,
    q,
    phaseId: phaseId === "all" ? undefined : phaseId,
    sectorId: sectorId === "all" ? undefined : sectorId,
    blockId: blockId === "all" ? undefined : blockId,
    houseTypeId: houseTypeId === "all" ? undefined : houseTypeId,
    status: status === "all" ? undefined : status,
    includeArchived: status === "ARCHIVED" || status === "all",
    sort: "code",
    order: "asc",
  });

  const createMutation = useCreateHouseMutation(projectId);
  const bulkMutation = useBulkHousesMutation(projectId);
  const importMutation = useHouseImportMutation(projectId);
  const saveFilterMutation = useSaveHouseFilterMutation(projectId);

  const phases = useMemo(
    () => hierarchyQuery.data?.phases ?? [],
    [hierarchyQuery.data?.phases],
  );

  const columns = useMemo<ColumnDef<HouseDto>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getRowModel().rows.length > 0 &&
              selectedIds.length === table.getRowModel().rows.length
            }
            onCheckedChange={(checked) => {
              setSelectedIds(
                checked ? table.getRowModel().rows.map((r) => r.original.id) : [],
              );
            }}
            disabled={readOnly}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={() => {
              setSelectedIds((prev) =>
                prev.includes(row.original.id)
                  ? prev.filter((id) => id !== row.original.id)
                  : [...prev, row.original.id],
              );
            }}
            disabled={readOnly}
          />
        ),
      },
      {
        accessorKey: "code",
        header: "House #",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/houses/${row.original.id}`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {row.original.code}
            </Link>
            <p className="text-xs text-muted-foreground">
              {row.original.plotNo ? `Plot ${row.original.plotNo}` : "—"}
            </p>
          </div>
        ),
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.phase?.code}/{row.original.sector?.code}/
            {row.original.block?.code}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => row.original.houseType?.name ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline">
            {HOUSE_STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
    ],
    [readOnly, selectedIds],
  );

  async function handleCreate() {
    if (!newPhaseId || !newSectorId || !newBlockId || !newTypeId) {
      toast.error("Select phase, sector, block, and house type");
      return;
    }
    try {
      await createMutation.mutateAsync({
        projectId,
        phaseId: newPhaseId,
        sectorId: newSectorId,
        blockId: newBlockId,
        houseTypeId: newTypeId,
        houseTemplateId:
          newTemplateId === "__none__" ? null : newTemplateId || null,
        code: newNameCode.trim() || null,
        plotNo: newPlot.trim() || null,
      });
      toast.success("House created");
      setNewNameCode("");
      setNewPlot("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  }

  function parseCsv(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return [];
    const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const get = (key: string) => {
        const idx = header.indexOf(key);
        return idx >= 0 ? cols[idx] || undefined : undefined;
      };
      return {
        code: get("code") || get("house") || null,
        plotNo: get("plot") || get("plotno") || get("plot_no") || null,
        phaseCode: get("phase") || get("phasecode") || "",
        sectorCode: get("sector") || get("sectorcode") || "",
        blockCode: get("block") || get("blocksize") || get("blockcode") || "",
        houseTypeCode: get("type") || get("housetype") || get("house_type") || "",
        houseTemplateCode: get("template") || null,
        ownerName: get("owner") || null,
        notes: get("notes") || null,
      };
    });
  }

  async function handlePreviewImport() {
    try {
      const rows = parseCsv(csvText).filter(
        (r) => r.phaseCode && r.sectorCode && r.blockCode && r.houseTypeCode,
      );
      if (!rows.length) {
        toast.error("No valid CSV rows. Need headers: phase,sector,block,type");
        return;
      }
      const preview = (await importMutation.mutateAsync({
        projectId,
        rows,
        dryRun: true,
      })) as HouseImportPreviewDto;
      setImportPreview(preview);
      toast.message(
        `Dry run: ${preview.summary.wouldImport} would import, ${preview.summary.blocked} blocked, ${preview.duplicates} duplicates`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dry run failed");
    }
  }

  async function handleCommitImport() {
    try {
      const rows = parseCsv(csvText).filter(
        (r) => r.phaseCode && r.sectorCode && r.blockCode && r.houseTypeCode,
      );
      const result = await importMutation.mutateAsync({
        projectId,
        rows,
        commit: true,
      });
      toast.success(
        `Imported ${(result as { imported: number }).imported} houses` +
          ((result as { rolledBack?: boolean }).rolledBack ? " (rolled back)" : ""),
      );
      setCsvText("");
      setImportPreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    }
  }

  async function runBulk() {
    if (!confirm || !selectedIds.length) return;
    try {
      await bulkMutation.mutateAsync({ action: confirm.action, ids: selectedIds });
      toast.success(`Bulk ${confirm.action} complete`);
      setSelectedIds([]);
      setConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk action failed");
    }
  }

  if (housesQuery.isError) {
    return (
      <ErrorState
        title="Failed to load houses"
        description={housesQuery.error.message}
        onRetry={() => housesQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/70 p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">{statsQuery.data?.total ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-border/70 p-3">
          <p className="text-xs text-muted-foreground">Planning</p>
          <p className="text-xl font-semibold">{statsQuery.data?.planning ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-border/70 p-3">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-xl font-semibold">{statsQuery.data?.completed ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-border/70 p-3">
          <p className="text-xs text-muted-foreground">Types</p>
          <p className="text-xl font-semibold">
            {statsQuery.data?.houseTypeCount ?? "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={phaseId} onValueChange={(v) => { setPhaseId(v); setPage(1); }}>
          <SelectTrigger className="min-h-11 w-[160px]"><SelectValue placeholder="Phase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All phases</SelectItem>
            {phases.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectorId} onValueChange={(v) => { setSectorId(v); setPage(1); }}>
          <SelectTrigger className="min-h-11 w-[160px]"><SelectValue placeholder="Sector" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sectors</SelectItem>
            {phases.flatMap((p) => p.children ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={blockId} onValueChange={(v) => { setBlockId(v); setPage(1); }}>
          <SelectTrigger className="min-h-11 w-[160px]"><SelectValue placeholder="Block" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All blocks</SelectItem>
            {phases.flatMap((p) => p.children ?? []).flatMap((s) => s.children ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={houseTypeId} onValueChange={(v) => { setHouseTypeId(v); setPage(1); }}>
          <SelectTrigger className="min-h-11 w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(typesQuery.data?.data ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="min-h-11 w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{HOUSE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!readOnly && selectedIds.length ? (
        <div className="flex flex-wrap gap-2">
          <Can permission="houses.update">
            <Button variant="outline" className="min-h-11" onClick={() => setConfirm({ action: "archive" })}>
              <Archive className="size-4" /> Archive
            </Button>
            <Button variant="outline" className="min-h-11" onClick={() => setConfirm({ action: "restore" })}>
              <RotateCcw className="size-4" /> Restore
            </Button>
            <Button variant="outline" className="min-h-11" onClick={() => setConfirm({ action: "delete" })}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </Can>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={housesQuery.data?.data ?? []}
        isLoading={housesQuery.isLoading}
        searchValue={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        page={page}
        pageSize={50}
        total={housesQuery.data?.meta.total ?? 0}
        onPageChange={setPage}
        getRowId={(row) => row.id}
        virtualized
        emptyTitle="No houses"
        emptyDescription="Create a house or import CSV rows for this project."
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Input
              className="min-h-11 w-40"
              placeholder="Save filter name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
            <Button
              variant="outline"
              className="min-h-11"
              disabled={!filterName.trim() || saveFilterMutation.isPending}
              onClick={async () => {
                try {
                  await saveFilterMutation.mutateAsync({
                    name: filterName.trim(),
                    projectId,
                    payload: { phaseId, sectorId, blockId, houseTypeId, status, q },
                  });
                  toast.success("Filter saved");
                  setFilterName("");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Save failed");
                }
              }}
            >
              Save filter
            </Button>
            {(savedFiltersQuery.data ?? []).slice(0, 3).map((f) => (
              <Button
                key={f.id}
                variant="ghost"
                className="min-h-11"
                onClick={() => {
                  const p = f.payload;
                  if (typeof p.phaseId === "string") setPhaseId(p.phaseId);
                  if (typeof p.sectorId === "string") setSectorId(p.sectorId);
                  if (typeof p.blockId === "string") setBlockId(p.blockId);
                  if (typeof p.houseTypeId === "string") setHouseTypeId(p.houseTypeId);
                  if (typeof p.status === "string") setStatus(p.status);
                  if (typeof p.q === "string") setQ(p.q);
                  setPage(1);
                }}
              >
                {f.name}
              </Button>
            ))}
          </div>
        }
      />

      {!readOnly ? (
        <div className="space-y-4 rounded-2xl border border-border/70 p-4">
          <p className="text-sm font-medium">Create house</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select value={newPhaseId} onValueChange={(v) => { setNewPhaseId(v); setNewSectorId(""); setNewBlockId(""); }}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Phase" /></SelectTrigger>
              <SelectContent>
                {phases.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newSectorId} onValueChange={(v) => { setNewSectorId(v); setNewBlockId(""); }}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Sector" /></SelectTrigger>
              <SelectContent>
                {(phases.find((p) => p.id === newPhaseId)?.children ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newBlockId} onValueChange={setNewBlockId}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Block" /></SelectTrigger>
              <SelectContent>
                {(phases.find((p) => p.id === newPhaseId)?.children.find((s) => s.id === newSectorId)?.children ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.code} — {b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newTypeId} onValueChange={(v) => { setNewTypeId(v); setNewTemplateId("__none__"); }}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="House type" /></SelectTrigger>
              <SelectContent>
                {(typesQuery.data?.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.code} — {t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newTemplateId} onValueChange={setNewTemplateId}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No template</SelectItem>
                {(templatesQuery.data?.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.code} v{t.version} — {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input className="min-h-11" placeholder="Code (auto)" value={newNameCode} onChange={(e) => setNewNameCode(e.target.value)} />
            <Input className="min-h-11" placeholder="Plot number" value={newPlot} onChange={(e) => setNewPlot(e.target.value)} />
          </div>
          <Can permission="houses.create">
            <Button className="min-h-11" onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus className="size-4" />
              Create house
            </Button>
          </Can>

          <div className="border-t border-border/60 pt-4 space-y-2">
            <p className="text-sm font-medium">CSV import</p>
            <p className="text-xs text-muted-foreground">
              Headers: phase,sector,block,type,code,plot,template,owner,notes · Dry run before commit · rollback on failure
            </p>
            <textarea
              className="min-h-28 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"phase,sector,block,type,code,plot\nPH-001,SEC-A,BLK-01,HT-001,HSE-001,P-12"}
            />
            {importPreview ? (
              <div className="space-y-2 rounded-xl border border-border/60 p-3 text-xs">
                <p className="font-medium">
                  Dry run summary — would import {importPreview.summary.wouldImport}, blocked{" "}
                  {importPreview.summary.blocked}, auto-coded {importPreview.summary.autoCoded},
                  duplicates {importPreview.duplicates}, warnings {importPreview.warnings}
                </p>
                {importPreview.errorReport.length ? (
                  <div>
                    <p className="font-medium text-destructive">Error report</p>
                    <ul className="mt-1 max-h-28 space-y-1 overflow-auto text-muted-foreground">
                      {importPreview.errorReport.slice(0, 20).map((issue, idx) => (
                        <li key={`${issue.row}-${issue.field}-${idx}`}>
                          Row {issue.row}
                          {issue.field ? ` · ${issue.field}` : ""}: {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {importPreview.duplicatePreview.length ? (
                  <div>
                    <p className="font-medium">Duplicate preview</p>
                    <ul className="mt-1 max-h-28 space-y-1 overflow-auto text-muted-foreground">
                      {importPreview.duplicatePreview.slice(0, 20).map((dup, idx) => (
                        <li key={`${dup.row}-${dup.field}-${idx}`}>
                          Row {dup.row} · {dup.field}={dup.value} ({dup.source})
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Can permission="houses.import">
                <Button variant="outline" className="min-h-11" onClick={handlePreviewImport}>
                  Dry run
                </Button>
                <Button
                  className="min-h-11"
                  onClick={handleCommitImport}
                  disabled={!importPreview || importPreview.invalid > 0}
                >
                  <Upload className="size-4" />
                  Commit import
                </Button>
              </Can>
            </div>
          </div>
        </div>
      ) : null}

      {!readOnly ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:hidden">
          <Button className="min-h-11 w-full" onClick={handleCreate} disabled={createMutation.isPending}>
            <Plus className="size-4" />
            Add house
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Bulk ${confirm?.action}?`}
        description={`${selectedIds.length} house(s) will be updated.`}
        confirmLabel="Confirm"
        onConfirm={runBulk}
        loading={bulkMutation.isPending}
      />
    </div>
  );
}
