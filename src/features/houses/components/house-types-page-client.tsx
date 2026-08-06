"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { ErrorState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Can } from "@/features/rbac/components/can";
import { useProjectContextQuery } from "@/features/projects/hooks/use-projects";
import { HOUSE_TYPE_CATEGORY_LABELS } from "../mappers";
import {
  useCreateHouseTemplateMutation,
  useCreateHouseTypeMutation,
  useDeleteHouseTypeMutation,
  useHouseTemplateQuery,
  useHouseTemplatesQuery,
  useHouseTypesQuery,
  useReviseHouseTemplateMutation,
  useUpdateHouseTemplateMutation,
} from "../hooks/use-houses";

type LineDraft = {
  name: string;
  quantity: string;
  unit: string;
};

export function HouseTypesPageClient() {
  const contextQuery = useProjectContextQuery();
  const projectId = contextQuery.data?.projectId ?? undefined;
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("RESIDENTIAL");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [tplName, setTplName] = useState("");
  const [activityDraft, setActivityDraft] = useState<LineDraft>({
    name: "",
    quantity: "1",
    unit: "",
  });
  const [boqDraft, setBoqDraft] = useState<LineDraft>({
    name: "",
    quantity: "1",
    unit: "",
  });
  const [materialDraft, setMaterialDraft] = useState<LineDraft>({
    name: "",
    quantity: "1",
    unit: "",
  });
  const [revisionNote, setRevisionNote] = useState("");

  const typesQuery = useHouseTypesQuery({ projectId, q, pageSize: 50 });
  const templatesQuery = useHouseTemplatesQuery({
    houseTypeId: selectedTypeId || undefined,
    projectId,
  });
  const templateDetailQuery = useHouseTemplateQuery(selectedTemplateId || undefined);
  const createType = useCreateHouseTypeMutation(projectId);
  const deleteType = useDeleteHouseTypeMutation(projectId);
  const createTemplate = useCreateHouseTemplateMutation(projectId);
  const updateTemplate = useUpdateHouseTemplateMutation(projectId);
  const reviseTemplate = useReviseHouseTemplateMutation(projectId);

  if (typesQuery.isError) {
    return (
      <ErrorState
        title="Failed to load house types"
        description={typesQuery.error.message}
        onRetry={() => typesQuery.refetch()}
      />
    );
  }

  const detail = templateDetailQuery.data;

  async function appendLine(
    kind: "activities" | "boqItems" | "materials",
    draft: LineDraft,
    reset: (v: LineDraft) => void,
  ) {
    if (!detail || !draft.name.trim()) return;
    const nextItem = {
      name: draft.name.trim(),
      quantity: Number(draft.quantity) || 1,
      unit: draft.unit.trim() || null,
      sortOrder:
        kind === "activities"
          ? detail.activities.length
          : kind === "boqItems"
            ? detail.boqItems.length
            : detail.materials.length,
    };
    try {
      await updateTemplate.mutateAsync({
        id: detail.id,
        input: {
          [kind]: [
            ...(kind === "activities"
              ? detail.activities
              : kind === "boqItems"
                ? detail.boqItems
                : detail.materials
            ).map((item, index) => ({
              code: item.code,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              sortOrder: item.sortOrder ?? index,
              ...("estimatedDurationDays" in item
                ? { estimatedDurationDays: item.estimatedDurationDays }
                : {}),
              ...("unitRate" in item ? { unitRate: item.unitRate } : {}),
            })),
            nextItem,
          ],
        },
      });
      toast.success("Template line added");
      reset({ name: "", quantity: "1", unit: "" });
      templateDetailQuery.refetch();
      templatesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title="House types & templates"
        description="Typology catalog with versioned templates and relational activity / BOQ / material definitions."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Input
            className="min-h-11"
            placeholder="Search types…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="divide-y divide-border rounded-2xl border border-border/70">
            {(typesQuery.data?.data ?? []).map((type) => (
              <li
                key={type.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => {
                    setSelectedTypeId(type.id);
                    setSelectedTemplateId("");
                  }}
                >
                  <p className="font-medium">{type.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {type.code} · {HOUSE_TYPE_CATEGORY_LABELS[type.category]} ·{" "}
                    {type.templateCount} templates · {type.houseCount} houses
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{type.status}</Badge>
                  <Can permission="house_types.manage">
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-9"
                      onClick={async () => {
                        try {
                          await deleteType.mutateAsync(type.id);
                          toast.success("House type deleted");
                          if (selectedTypeId === type.id) {
                            setSelectedTypeId("");
                            setSelectedTemplateId("");
                          }
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "Delete failed",
                          );
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </Can>
                </div>
              </li>
            ))}
          </ul>

          <Can permission="house_types.manage">
            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
              <p className="text-sm font-medium">Add house type</p>
              <Input
                className="min-h-11"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                className="min-h-11"
                placeholder="Code (auto)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(HOUSE_TYPE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="min-h-11"
                disabled={!name.trim() || createType.isPending}
                onClick={async () => {
                  try {
                    await createType.mutateAsync({
                      projectId: projectId ?? null,
                      name: name.trim(),
                      code: code.trim() || null,
                      category: category as
                        | "RESIDENTIAL"
                        | "COMMERCIAL"
                        | "MIXED"
                        | "OTHER",
                    });
                    toast.success("House type created");
                    setName("");
                    setCode("");
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Create failed",
                    );
                  }
                }}
              >
                <Plus className="size-4" />
                Create type
              </Button>
            </div>
          </Can>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium">
            Templates{selectedTypeId ? "" : " — select a type"}
          </p>
          <ul className="divide-y divide-border rounded-2xl border border-border/70">
            {(templatesQuery.data?.data ?? []).map((tpl) => (
              <li key={tpl.id} className="p-4">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                >
                  <p className="font-medium">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tpl.code} v{tpl.version} · {tpl.status}
                    {tpl.isDefault ? " · default" : ""} · {tpl.activityCount} act ·{" "}
                    {tpl.boqCount} boq · {tpl.materialCount} mat
                  </p>
                </button>
              </li>
            ))}
            {selectedTypeId && !(templatesQuery.data?.data.length ?? 0) ? (
              <li className="p-4 text-sm text-muted-foreground">No templates yet.</li>
            ) : null}
          </ul>

          {selectedTypeId ? (
            <Can permission="house_types.manage">
              <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                <p className="text-sm font-medium">Add template</p>
                <Input
                  className="min-h-11"
                  placeholder="Template name"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                />
                <Button
                  className="min-h-11"
                  disabled={!tplName.trim() || createTemplate.isPending}
                  onClick={async () => {
                    try {
                      await createTemplate.mutateAsync({
                        houseTypeId: selectedTypeId,
                        projectId: projectId ?? null,
                        name: tplName.trim(),
                        status: "ACTIVE",
                        isDefault: !(templatesQuery.data?.data.length ?? 0),
                        activities: [],
                        boqItems: [],
                        materials: [],
                      });
                      toast.success("Template created");
                      setTplName("");
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Create failed",
                      );
                    }
                  }}
                >
                  <Plus className="size-4" />
                  Create template
                </Button>
              </div>
            </Can>
          ) : null}

          {detail ? (
            <div className="space-y-4 rounded-2xl border border-border/70 p-4">
              <div>
                <p className="font-medium">
                  {detail.name} · {detail.code} v{detail.version}
                </p>
                <p className="text-xs text-muted-foreground">
                  Template definitions only (no execution seeding).
                </p>
              </div>

              <section className="space-y-2">
                <p className="text-sm font-medium">Activities ({detail.activityCount})</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {detail.activities.map((a) => (
                    <li key={a.id}>
                      {a.sortOrder}. {a.name} · qty {a.quantity}
                      {a.unit ? ` ${a.unit}` : ""}
                    </li>
                  ))}
                </ul>
                <Can permission="house_types.manage">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      className="min-h-10"
                      placeholder="Activity name"
                      value={activityDraft.name}
                      onChange={(e) =>
                        setActivityDraft((d) => ({ ...d, name: e.target.value }))
                      }
                    />
                    <Input
                      className="min-h-10"
                      placeholder="Qty"
                      value={activityDraft.quantity}
                      onChange={(e) =>
                        setActivityDraft((d) => ({ ...d, quantity: e.target.value }))
                      }
                    />
                    <Input
                      className="min-h-10"
                      placeholder="Unit"
                      value={activityDraft.unit}
                      onChange={(e) =>
                        setActivityDraft((d) => ({ ...d, unit: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-9"
                    onClick={() =>
                      appendLine("activities", activityDraft, setActivityDraft)
                    }
                  >
                    Add activity
                  </Button>
                </Can>
              </section>

              <section className="space-y-2">
                <p className="text-sm font-medium">BOQ ({detail.boqCount})</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {detail.boqItems.map((b) => (
                    <li key={b.id}>
                      {b.sortOrder}. {b.name} · qty {b.quantity}
                      {b.unit ? ` ${b.unit}` : ""}
                    </li>
                  ))}
                </ul>
                <Can permission="house_types.manage">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      className="min-h-10"
                      placeholder="BOQ item"
                      value={boqDraft.name}
                      onChange={(e) =>
                        setBoqDraft((d) => ({ ...d, name: e.target.value }))
                      }
                    />
                    <Input
                      className="min-h-10"
                      placeholder="Qty"
                      value={boqDraft.quantity}
                      onChange={(e) =>
                        setBoqDraft((d) => ({ ...d, quantity: e.target.value }))
                      }
                    />
                    <Input
                      className="min-h-10"
                      placeholder="Unit"
                      value={boqDraft.unit}
                      onChange={(e) =>
                        setBoqDraft((d) => ({ ...d, unit: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-9"
                    onClick={() => appendLine("boqItems", boqDraft, setBoqDraft)}
                  >
                    Add BOQ item
                  </Button>
                </Can>
              </section>

              <section className="space-y-2">
                <p className="text-sm font-medium">Materials ({detail.materialCount})</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {detail.materials.map((m) => (
                    <li key={m.id}>
                      {m.sortOrder}. {m.name} · qty {m.quantity}
                      {m.unit ? ` ${m.unit}` : ""}
                    </li>
                  ))}
                </ul>
                <Can permission="house_types.manage">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      className="min-h-10"
                      placeholder="Material"
                      value={materialDraft.name}
                      onChange={(e) =>
                        setMaterialDraft((d) => ({ ...d, name: e.target.value }))
                      }
                    />
                    <Input
                      className="min-h-10"
                      placeholder="Qty"
                      value={materialDraft.quantity}
                      onChange={(e) =>
                        setMaterialDraft((d) => ({
                          ...d,
                          quantity: e.target.value,
                        }))
                      }
                    />
                    <Input
                      className="min-h-10"
                      placeholder="Unit"
                      value={materialDraft.unit}
                      onChange={(e) =>
                        setMaterialDraft((d) => ({ ...d, unit: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-9"
                    onClick={() =>
                      appendLine("materials", materialDraft, setMaterialDraft)
                    }
                  >
                    Add material
                  </Button>
                </Can>
              </section>

              <Can permission="house_types.manage">
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <p className="text-sm font-medium">Create revision</p>
                  <Input
                    className="min-h-11"
                    placeholder="Revision note"
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                  />
                  <Button
                    className="min-h-11"
                    disabled={reviseTemplate.isPending}
                    onClick={async () => {
                      try {
                        const next = await reviseTemplate.mutateAsync({
                          id: detail.id,
                          input: {
                            revisionNote: revisionNote.trim() || null,
                            activate: true,
                          },
                        });
                        toast.success(`Revised to v${next.version}`);
                        setRevisionNote("");
                        setSelectedTemplateId(next.id);
                        templatesQuery.refetch();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Revise failed",
                        );
                      }
                    }}
                  >
                    Revise template
                  </Button>
                </div>
              </Can>
            </div>
          ) : null}
        </div>
      </div>
    </PageMotion>
  );
}
