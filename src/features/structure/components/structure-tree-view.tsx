"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Layers,
  Map,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  HierarchyBlockNode,
  HierarchyPhaseNode,
  HierarchySectorNode,
  ProjectHierarchyDto,
} from "../mappers";
import { STRUCTURE_STATUS_LABELS } from "../mappers";

export type StructureSelection =
  | { type: "project" }
  | { type: "phase"; id: string; node: HierarchyPhaseNode }
  | { type: "sector"; id: string; node: HierarchySectorNode; phaseId: string }
  | {
      type: "block";
      id: string;
      node: HierarchyBlockNode;
      sectorId: string;
      phaseId: string;
    };

type Props = {
  hierarchy: ProjectHierarchyDto;
  selection: StructureSelection;
  onSelect: (selection: StructureSelection) => void;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "ARCHIVED" ? "outline" : "secondary"} className="text-[10px]">
      {STRUCTURE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function StructureTreeView({ hierarchy, selection, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function isOpen(id: string, fallback = true) {
    return expanded[id] ?? fallback;
  }

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !isOpen(id) }));
  }

  if (!hierarchy.phases.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 px-4 py-12 text-center">
        <FolderTree className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No structure yet</p>
        <p className="text-xs text-muted-foreground">
          Create a phase to start Project → Phase → Sector → Block.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/50 p-2 sm:p-3">
      <button
        type="button"
        className={cn(
          "mb-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm",
          selection.type === "project"
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted/60",
        )}
        onClick={() => onSelect({ type: "project" })}
      >
        <FolderTree className="size-4 shrink-0" />
        <span className="font-medium">Project root</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {hierarchy.counts.phases}P · {hierarchy.counts.sectors}S ·{" "}
          {hierarchy.counts.blocks}B
        </span>
      </button>

      {hierarchy.phases.map((phase) => {
        const phaseOpen = isOpen(phase.id);
        const phaseSelected =
          selection.type === "phase" && selection.id === phase.id;
        return (
          <div key={phase.id}>
            <div
              className={cn(
                "flex min-h-11 items-center gap-1 rounded-xl px-1 py-1 text-sm",
                phaseSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/60",
              )}
              style={{ paddingLeft: "0.75rem" }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => toggle(phase.id)}
                aria-label={phaseOpen ? "Collapse" : "Expand"}
              >
                {phaseOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </Button>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => onSelect({ type: "phase", id: phase.id, node: phase })}
              >
                <Layers className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{phase.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {phase.code}
                </span>
                <StatusBadge status={phase.status} />
              </button>
            </div>

            {phaseOpen
              ? phase.children.map((sector) => {
                  const sectorOpen = isOpen(sector.id);
                  const sectorSelected =
                    selection.type === "sector" && selection.id === sector.id;
                  return (
                    <div key={sector.id}>
                      <div
                        className={cn(
                          "flex min-h-11 items-center gap-1 rounded-xl px-1 py-1 text-sm",
                          sectorSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/60",
                        )}
                        style={{ paddingLeft: "1.75rem" }}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          onClick={() => toggle(sector.id)}
                        >
                          {sectorOpen ? (
                            <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronRight className="size-3.5" />
                          )}
                        </Button>
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          onClick={() =>
                            onSelect({
                              type: "sector",
                              id: sector.id,
                              node: sector,
                              phaseId: phase.id,
                            })
                          }
                        >
                          <Map className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium">{sector.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {sector.code}
                          </span>
                          <StatusBadge status={sector.status} />
                        </button>
                      </div>

                      {sectorOpen
                        ? sector.children.map((block) => {
                            const blockSelected =
                              selection.type === "block" && selection.id === block.id;
                            return (
                              <button
                                key={block.id}
                                type="button"
                                className={cn(
                                  "flex min-h-11 w-full items-center gap-2 rounded-xl px-2 py-1 text-left text-sm",
                                  blockSelected
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted/60",
                                )}
                                style={{ paddingLeft: "3.25rem" }}
                                onClick={() =>
                                  onSelect({
                                    type: "block",
                                    id: block.id,
                                    node: block,
                                    sectorId: sector.id,
                                    phaseId: phase.id,
                                  })
                                }
                              >
                                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium">{block.name}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {block.code}
                                </span>
                                <StatusBadge status={block.status} />
                              </button>
                            );
                          })
                        : null}
                    </div>
                  );
                })
              : null}
          </div>
        );
      })}
    </div>
  );
}
