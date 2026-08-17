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
import { BrandLogo } from "@/components/brand";
import { formatDate, formatMoney, formatPercent } from "@/lib/utils";
import type { ProjectDashboardDto } from "../mappers";
import {
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "../mappers";
import { buildProjectReport } from "../lib/dashboard-report";
import { ActivityTimeline } from "./activity-timeline";
import { ProjectKpiGrid } from "./project-kpi-grid";
import { ReportGauge } from "./report-gauge";
import { ReportLineChart } from "./report-line-chart";

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
  const report = buildProjectReport(dashboard);
  const currency = summary.currencyCode || "PKR";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-soft">
        <div className="flex flex-col gap-4 border-b border-border/60 bg-primary px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" animated={false} className="ring-white/40" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                Project dashboard
              </p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-white">
                {summary.name}
                {summary.location ? ` · ${summary.location}` : ""}
              </h2>
            </div>
          </div>
          <div className="text-sm sm:text-right">
            <p className="text-white/80">Report date</p>
            <p className="font-semibold text-white">{formatDate(report.reportDate)}</p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <DateTile label="Project start" value={formatDate(report.startDate)} />
          <DateTile label="Contract finish" value={formatDate(report.contractFinish)} />
          <DateTile label="Forecast finish" value={formatDate(report.forecastFinish)} />
        </div>
      </section>

      {report.previewBudget ? (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Cost, cash, manpower, and equipment charts are a customer preview until
          billing, DPR, and budget modules are live. House counts and construction
          progress are live.
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-white shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Schedule performance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Planned value"
              value={formatMoney(report.plannedValue, currency)}
              hint={formatPercent(report.plannedPct)}
            />
            <Metric
              label="Earned value"
              value={formatMoney(report.earnedValue, currency)}
              hint={formatPercent(report.earnedPct)}
            />
            <Metric
              label="Variance"
              value={formatMoney(report.variance, currency)}
              hint={report.variance > 0 ? "Behind plan" : "On / ahead"}
            />
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-white shadow-soft">
          <CardContent className="grid grid-cols-2 gap-2 pt-6">
            <ReportGauge label="SPI" value={report.spi} />
            <ReportGauge label="CPI" value={report.cpi} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="BAC" value={formatMoney(report.bac, currency)} hint="Budget at completion" />
        <MetricCard label="EAC" value={formatMoney(report.eac, currency)} hint="Estimate at completion" />
        <MetricCard label="ETG" value={formatMoney(report.etg, currency)} hint="Estimate to go" />
        <MetricCard
          label="Cost variance"
          value={formatMoney(report.costVariance, currency)}
          hint="Earned − actual"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportLineChart
          title="Progress — plan vs actual"
          labels={report.months}
          series={[
            { label: "Plan", color: "#00aeef", values: report.progress.map((p) => p.plan) },
            { label: "Actual", color: "#38bdf8", values: report.progress.map((p) => p.actual) },
          ]}
        />
        <ReportLineChart
          title="Cash-in vs cash-out"
          labels={report.months}
          series={[
            { label: "Cash-in", color: "#00aeef", values: report.cashIn.map((p) => p.actual) },
            { label: "Cash-out", color: "#7dd3fc", values: report.cashOut.map((p) => p.actual) },
          ]}
        />
        <ReportLineChart
          title="Manpower"
          labels={report.months}
          series={[
            { label: "Plan", color: "#00aeef", values: report.manpower.map((p) => p.plan) },
            { label: "Actual", color: "#38bdf8", values: report.manpower.map((p) => p.actual) },
          ]}
        />
        <ReportLineChart
          title="Equipment"
          labels={report.months}
          series={[
            { label: "Plan", color: "#00aeef", values: report.equipment.map((p) => p.plan) },
            { label: "Actual", color: "#38bdf8", values: report.equipment.map((p) => p.actual) },
          ]}
        />
      </div>

      <Card className="border-border/70 bg-white shadow-soft">
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
        <h3 className="mb-3 text-sm font-semibold">Live project counts</h3>
        <ProjectKpiGrid kpis={dashboard.kpis} />
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Houses" value={dashboard.houseStats.total} />
        <StatCard label="House types" value={dashboard.houseStats.houseTypeCount} />
        <StatCard label="Planning" value={dashboard.houseStats.planning} />
        <StatCard label="Completed" value={dashboard.houseStats.completed} />
        <StatCard
          label="Constr. progress"
          value={`${dashboard.houseStats.constructionProgressPercent}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-white shadow-soft">
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

        <Card className="border-border/70 bg-white shadow-soft">
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
        <Card className="border-border/70 border-dashed bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListTodo className="size-4 text-primary" />
              Pending workflow tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Module 22 workflow tasks will appear here.
          </CardContent>
        </Card>
        <Card className="border-border/70 border-dashed bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-primary" />
              Recent documents
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Module 29 document vault will appear here.
          </CardContent>
        </Card>
        <Card className="border-border/70 border-dashed bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="size-4 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Module 28 notifications will appear here.
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-white shadow-soft">
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

function DateTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary/10 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-canvas/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-xs text-primary">{hint}</p> : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-border/70 bg-white shadow-soft">
      <CardContent className="pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          {label}
        </p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-border/70 bg-white shadow-soft">
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
