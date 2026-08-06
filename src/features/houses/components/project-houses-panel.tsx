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
import { HOUSE_STATUS_LABELS, type HouseDto } from "../mappers";
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
  const [importPreview, setImportPreview] = useState<{
    valid: number;
    invalid: number;
    duplicates: number;
  } | null>(null);
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
            <p className="font-medium">{row.original.code}</p>
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
        houseTemplateId: newTemplateId === "__none__" ? null : newTemplateId,
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
      })) as {
        valid: number;
        invalid: number;
        duplicates: number;
      };
      setImportPreview(preview);
      toast.message(
        `Preview: ${preview.valid} valid, ${preview.invalid} invalid, ${preview.duplicates} duplicates`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    }
  }

  async function handleCommitImport() {
    try {
      const rows = parseCsv(csvText).filter(
        (r) => r.phaseCode && r.sectorCode && r.blockCode && r.houseTypeCode,
      );
      const result = (await importMutation.mutateAsync({
        projectId,
        rows,
        commit: true,
      })) as { imported: number };
      toast.success(`Imported ${result.imported} houses`);
      setCsvText("");
      setImportPreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    }
  }

  async function runBulk() {
    if (!confirm || !selectedIds.length) return;
    try {
      await bulkMutation.mutateAsync({
        action: confirm.action,
        ids: selectedIds,
      });
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

  const stats = statsQuery.data;

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 p-3">
            <p className="text-xs text-muted-foreground">Houses</p>
            <p className="text-xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-3">
            <p className="text-xs text-muted-foreground">Types</p>
            <p className="text-xl font-semibold">{stats.houseTypeCount}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-3">
            <p className="text-xs text-muted-foreground">Planning</p>
            <p className="text-xl font-semibold">{stats.planning}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-3">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-xl font-semibold">{stats.completed}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          value={phaseId}
          onValueChange={(v) => {
            setPhaseId(v);
            setSectorId("all");
            setBlockId("all");
            setPage(1);
          }}
        >
          <SelectTrigger className="min-h-11">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All phases</SelectItem>
            {phases.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.code} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="min-h-11">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {HOUSE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={houseTypeId}
          onValueChange={(v) => {
            setHouseTypeId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="min-h-11">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(typesQuery.data?.data ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.code} — {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => {
            setPhaseId("all");
            setSectorId("all");
            setBlockId("all");
            setHouseTypeId("all");
            setStatus("PLANNING");
            setPage(1);
          }}
        >
          Quick: Planning
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => {
            setStatus("UNDER_CONSTRUCTION");
            setPage(1);
          }}
        >
          Quick: Construction
        </Button>
      </div>

      {(savedFiltersQuery.data?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-2">
          {savedFiltersQuery.data!.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant="secondary"
              className="min-h-9"
              onClick={() => {
                const p = f.payload;
                if (typeof p.q === "string") setQ(p.q);
                if (typeof p.status === "string") setStatus(p.status);
                if (typeof p.phaseId === "string") setPhaseId(p.phaseId);
                if (typeof p.houseTypeId === "string") setHouseTypeId(p.houseTypeId);
              }}
            >
              {f.name}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="Save current filter as…"
          className="min-h-11"
        />
        <Button
          variant="outline"
          className="min-h-11"
          disabled={!filterName.trim()}
          onClick={async () => {
            try {
              await saveFilterMutation.mutateAsync({
                name: filterName.trim(),
                projectId,
                payload: { q, status, phaseId, sectorId, blockId, houseTypeId },
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
      </div>

      {selectedIds.length > 0 && !readOnly ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setConfirm({ action: "archive" })}
          >
            <Archive className="size-4" />
            Archive ({selectedIds.length})
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setConfirm({ action: "restore" })}
          >
            <RotateCcw className="size-4" />
            Restore
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setConfirm({ action: "delete" })}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={housesQuery.data?.data ?? []}
        isLoading={housesQuery.isLoading}
        searchPlaceholder="Search house # or plot…"
        searchValue={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        page={page}
        pageSize={50}
        total={housesQuery.data?.meta.total ?? 0}
        onPageChange={setPage}
        emptyTitle="No houses"
        emptyDescription="Create houses or import from CSV."
      />

      {!readOnly ? (
        <div className="space-y-4 rounded-2xl border border-border/70 p-4">
          <p className="text-sm font-medium">Add house</p>
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
              Headers: phase,sector,block,type,code,plot,template,owner,notes
            </p>
            <textarea
              className="min-h-28 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"phase,sector,block,type,code,plot\nPH-001,SEC-A,BLK-01,HT-001,HSE-001,P-12"}
            />
            {importPreview ? (
              <p className="text-xs text-muted-foreground">
                Preview — valid {importPreview.valid}, invalid {importPreview.invalid},
                duplicates {importPreview.duplicates}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Can permission="houses.import">
                <Button variant="outline" className="min-h-11" onClick={handlePreviewImport}>
                  Preview
                </Button>
                <Button className="min-h-11" onClick={handleCommitImport} disabled={!importPreview || importPreview.invalid > 0}>
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
