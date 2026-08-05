"use client";

import { useEffect } from "react";
import { Check, ChevronsUpDown, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_LABELS } from "../mappers";
import {
  useProjectContextQuery,
  useSetProjectContextMutation,
} from "../hooks/use-projects";
import { useProjectContextStore } from "@/stores/project-context-store";

export function ProjectContextSwitcher() {
  const { data, isLoading } = useProjectContextQuery();
  const setMutation = useSetProjectContextMutation();
  const localId = useProjectContextStore((s) => s.projectId);
  const setLocalId = useProjectContextStore((s) => s.setProjectId);

  useEffect(() => {
    if (data?.projectId) {
      setLocalId(data.projectId);
    }
  }, [data?.projectId, setLocalId]);

  const activeId = data?.projectId ?? localId;
  const active =
    data?.project ??
    data?.availableProjects.find((p) => p.id === activeId) ??
    null;

  async function selectProject(projectId: string | null) {
    try {
      const result = await setMutation.mutateAsync(projectId);
      setLocalId(result.projectId);
      toast.success(
        result.projectId
          ? `Project context: ${result.project?.name ?? "selected"}`
          : "Project context cleared",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to switch project",
      );
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="min-h-11 max-w-[14rem] justify-between gap-2 px-3"
          disabled={isLoading}
        >
          <FolderKanban className="size-4 shrink-0 text-primary" />
          <span className="truncate text-left text-sm">
            {active ? active.name : "All projects"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,20rem)] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search projects…" />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup heading="Context">
              <CommandItem
                value="all-projects"
                onSelect={() => selectProject(null)}
              >
                <Check
                  className={cn(
                    "size-4",
                    !activeId ? "opacity-100" : "opacity-0",
                  )}
                />
                All projects
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Your projects">
              {(data?.availableProjects ?? []).map((project) => (
                <CommandItem
                  key={project.id}
                  value={`${project.code} ${project.name}`}
                  onSelect={() => selectProject(project.id)}
                >
                  <Check
                    className={cn(
                      "size-4",
                      activeId === project.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {project.code} · {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
