"use client";

import Link from "next/link";
import {
  Archive,
  Bell,
  Calendar,
  FileText,
  ListTodo,
  Settings,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Can } from "@/features/rbac/components/can";
import { formatDate } from "@/lib/utils";
import type { ProjectDashboardDto } from "../mappers";
import {
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "../mappers";
import { ActivityTimeline } from "./activity-timeline";
import { ProjectKpiGrid } from "./project-kpi-grid";

type Props = {
  dashboard: ProjectDashboardDto;
  projectId: string;
  readOnly?: boolean;
};

export function ProjectDashboardView({
  dashboard,
  projectId,
  readOnly,
}: Props) {
  const { summary } = dashboard;

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-soft">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Project summary</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.code} · {PROJECT_TYPE_LABELS[summary.projectType]} ·{" "}
              {PROJECT_PRIORITY_LABELS[summary.projectPriority]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{PROJECT_STATUS_LABELS[summary.status]}</Badge>
            {summary.fiscalYear ? (
              <Badge variant="outline">FY {summary.fiscalYear}</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Manager</p>
            <p className="font-medium">{summary.projectManager?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Client / owner</p>
            <p className="font-medium">{summary.clientOwner ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Consultant</p>
            <p className="font-medium">{summary.consultant ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Organization</p>
            <p className="font-medium">{summary.orgUnit?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{summary.location ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Members</p>
            <p className="font-medium">{dashboard.memberCount}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Can permission="projects.members">
          <Button
            variant="outline"
            className="min-h-11"
            disabled={readOnly}
            asChild
          >
            <Link href={`/projects/${projectId}?tab=members`}>
              <UserPlus className="size-4" />
              Manage members
            </Link>
          </Button>
        </Can>
        <Can permission="projects.update">
          <Button variant="outline" className="min-h-11" asChild>
            <Link href={`/projects/${projectId}?tab=settings`}>
              <Settings className="size-4" />
              Settings
            </Link>
          </Button>
        </Can>
        <Can permission="projects.archive">
          <Button variant="outline" className="min-h-11" asChild>
            <Link href={`/projects/${projectId}?tab=settings`}>
              <Archive className="size-4" />
              Archive
            </Link>
          </Button>
        </Can>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold">KPI snapshot</h3>
        <ProjectKpiGrid kpis={dashboard.kpis} />
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/70 shadow-soft">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Houses</p>
            <p className="text-2xl font-semibold">{dashboard.houseStats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-soft">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">House types</p>
            <p className="text-2xl font-semibold">
              {dashboard.houseStats.houseTypeCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-soft">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Planning</p>
            <p className="text-2xl font-semibold">{dashboard.houseStats.planning}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-soft">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-semibold">{dashboard.houseStats.completed}</p>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Construction progress: {dashboard.houseStats.constructionProgressPercent}%
        (placeholder until execution modules).
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4 text-primary" />
              Upcoming deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dates scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {dashboard.deadlines.map((d) => (
                  <li key={d.id} className="flex justify-between gap-3 text-sm">
                    <span>{d.label}</span>
                    <span className="font-medium">{formatDate(d.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Assigned members</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.memberPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              <ul className="space-y-3">
                {dashboard.memberPreview.map((m) => (
                  <li key={m.id} className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.role?.name ?? "Member"} · {m.user.email}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListTodo className="size-4" />
              Pending workflow tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Module 22 workflow tasks will appear here.
          </CardContent>
        </Card>
        <Card className="border-border/70 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4" />
              Recent documents
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Module 29 document vault will appear here.
          </CardContent>
        </Card>
        <Card className="border-border/70 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="size-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Module 28 notifications will appear here.
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline events={dashboard.recentActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
