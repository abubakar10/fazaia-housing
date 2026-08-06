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
import {
  HOUSE_TYPE_CATEGORY_LABELS,
} from "../mappers";
import {
  useCreateHouseTemplateMutation,
  useCreateHouseTypeMutation,
  useDeleteHouseTypeMutation,
  useHouseTemplatesQuery,
  useHouseTypesQuery,
} from "../hooks/use-houses";

export function HouseTypesPageClient() {
  const contextQuery = useProjectContextQuery();
  const projectId = contextQuery.data?.projectId ?? undefined;
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("RESIDENTIAL");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [tplName, setTplName] = useState("");

  const typesQuery = useHouseTypesQuery({ projectId, q, pageSize: 50 });
  const templatesQuery = useHouseTemplatesQuery({
    houseTypeId: selectedTypeId || undefined,
    projectId,
  });
  const createType = useCreateHouseTypeMutation(projectId);
  const deleteType = useDeleteHouseTypeMutation(projectId);
  const createTemplate = useCreateHouseTemplateMutation(projectId);

  if (typesQuery.isError) {
    return (
      <ErrorState
        title="Failed to load house types"
        description={typesQuery.error.message}
        onRetry={() => typesQuery.refetch()}
      />
    );
  }

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title="House types & templates"
        description="Typology catalog and reusable templates for future execution seeding."
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
              <li key={type.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => setSelectedTypeId(type.id)}
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
                          if (selectedTypeId === type.id) setSelectedTypeId("");
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
            {!typesQuery.isLoading && !(typesQuery.data?.data.length ?? 0) ? (
              <li className="p-4 text-sm text-muted-foreground">No house types yet.</li>
            ) : null}
          </ul>

          <Can permission="house_types.manage">
            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
              <p className="text-sm font-medium">Create house type</p>
              <Input className="min-h-11" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input className="min-h-11" placeholder="Code (auto)" value={code} onChange={(e) => setCode(e.target.value)} />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(HOUSE_TYPE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
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
                      category: category as "RESIDENTIAL" | "COMMERCIAL" | "MIXED" | "OTHER",
                    });
                    toast.success("House type created");
                    setName("");
                    setCode("");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Create failed");
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
                <p className="font-medium">{tpl.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tpl.code} v{tpl.version} · {tpl.status}
                  {tpl.isDefault ? " · default" : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Duration {tpl.estimatedDurationDays ?? "—"} days · Cost{" "}
                  {tpl.estimatedCost ?? "—"}
                </p>
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
                        defaultActivities: [],
                        defaultBoq: [],
                        defaultMaterials: [],
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
        </div>
      </div>
    </PageMotion>
  );
}
