"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, PageMotion } from "@/components/layout";
import { ErrorState } from "@/components/feedback";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Can } from "@/features/rbac/components/can";
import { PROJECT_STATUS_LABELS } from "../mappers";
import {
  useArchiveProjectMutation,
  useProjectDashboardQuery,
  useRestoreProjectMutation,
} from "../hooks/use-projects";
import { ProjectDashboardView } from "./project-dashboard-view";
import { ProjectMembersPanel } from "./project-members-panel";
import { ProjectSettingsForm } from "./project-settings-form";
import { ProjectStructurePanel } from "@/features/structure/components/project-structure-panel";

type Props = { projectId: string };

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "structure", label: "Structure" },
  { id: "members", label: "Members" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProjectDetailClient({ projectId }: Props) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) ?? "dashboard";
  const dashboardQuery = useProjectDashboardQuery(projectId);
  const archiveMutation = useArchiveProjectMutation();
  const restoreMutation = useRestoreProjectMutation();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const project = dashboardQuery.data?.summary;
  const readOnly = project?.status === "ARCHIVED";

  async function handleArchive() {
    try {
      if (project?.status === "ARCHIVED") {
        await restoreMutation.mutateAsync(projectId);
        toast.success("Project restored");
      } else {
        await archiveMutation.mutateAsync(projectId);
        toast.success("Project archived");
      }
      setConfirmArchive(false);
      dashboardQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        title="Failed to load project"
        description={dashboardQuery.error.message}
        onRetry={() => dashboardQuery.refetch()}
      />
    );
  }

  if (dashboardQuery.isLoading || !dashboardQuery.data || !project) {
    return null;
  }

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title={project.name}
        description={`${project.code} · ${PROJECT_STATUS_LABELS[project.status] ?? project.status}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="min-h-11" asChild>
              <Link href="/projects">Back</Link>
            </Button>
            <Can permission="projects.archive">
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => setConfirmArchive(true)}
              >
                {project.status === "ARCHIVED" ? "Restore" : "Archive"}
              </Button>
            </Can>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            className="min-h-11"
            asChild
          >
            <Link href={`/projects/${projectId}?tab=${t.id}`}>{t.label}</Link>
          </Button>
        ))}
        {readOnly ? <Badge variant="secondary">Read-only (archived)</Badge> : null}
      </div>

      {tab === "dashboard" ? (
        <ProjectDashboardView
          dashboard={dashboardQuery.data}
          projectId={projectId}
          readOnly={readOnly}
        />
      ) : null}

      {tab === "structure" ? (
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Project structure</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectStructurePanel
              projectId={projectId}
              projectName={project.name}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "members" ? (
        <Card className="border-border/70 shadow-soft pb-20 md:pb-0">
          <CardHeader>
            <CardTitle className="text-base">Project members</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectMembersPanel projectId={projectId} readOnly={readOnly} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "settings" ? (
        <Can permission="projects.update">
          <Card className="border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Project settings</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectSettingsForm project={project} readOnly={readOnly} />
            </CardContent>
          </Card>
        </Can>
      ) : null}

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={project.status === "ARCHIVED" ? "Restore project?" : "Archive project?"}
        description={
          project.status === "ARCHIVED"
            ? `Restore ${project.name} to its previous lifecycle status.`
            : `${project.name} will become read-only and hidden from default lists.`
        }
        confirmLabel={project.status === "ARCHIVED" ? "Restore" : "Archive"}
        onConfirm={handleArchive}
        loading={archiveMutation.isPending || restoreMutation.isPending}
      />
    </PageMotion>
  );
}
