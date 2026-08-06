"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, PageMotion } from "@/components/layout";
import { ErrorState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { HOUSE_STATUS_LABELS } from "../mappers";
import {
  useHouseQuery,
  useHouseStatusHistoryQuery,
  useHouseTemplateQuery,
} from "../hooks/use-houses";

type Props = { houseId: string };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "location", label: "Location" },
  { id: "template", label: "Template" },
  { id: "timeline", label: "Timeline" },
  { id: "documents", label: "Documents" },
  { id: "activities", label: "Activities" },
  { id: "boq", label: "BOQ" },
  { id: "materials", label: "Materials" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function PlaceholderPanel({ title, moduleHint }: { title: string; moduleHint: string }) {
  return (
    <Card className="border-border/70 border-dashed">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Placeholder — {moduleHint}. No execution data is stored on the house yet.
      </CardContent>
    </Card>
  );
}

export function HouseDetailClient({ houseId }: Props) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) ?? "overview";
  const houseQuery = useHouseQuery(houseId);
  const historyQuery = useHouseStatusHistoryQuery(houseId);
  const templateQuery = useHouseTemplateQuery(
    houseQuery.data?.houseTemplateId ?? undefined,
  );

  if (houseQuery.isError) {
    return (
      <ErrorState
        title="Failed to load house"
        description={houseQuery.error.message}
        onRetry={() => houseQuery.refetch()}
      />
    );
  }

  if (houseQuery.isLoading || !houseQuery.data) {
    return null;
  }

  const house = houseQuery.data;
  const backHref = `/projects/${house.projectId}?tab=houses`;

  return (
    <PageMotion className="space-y-6">
      <PageHeader
        title={house.code}
        description={`${house.plotNo ? `Plot ${house.plotNo} · ` : ""}${
          HOUSE_STATUS_LABELS[house.status] ?? house.status
        }`}
        actions={
          <Button variant="outline" className="min-h-11" asChild>
            <Link href={backHref}>Back to houses</Link>
          </Button>
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
            <Link href={`/houses/${houseId}?tab=${t.id}`}>{t.label}</Link>
          </Button>
        ))}
      </div>

      {tab === "overview" ? (
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge>{HOUSE_STATUS_LABELS[house.status] ?? house.status}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">House type</p>
              <p className="font-medium">
                {house.houseType
                  ? `${house.houseType.code} — ${house.houseType.name}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Template</p>
              <p className="font-medium">
                {house.houseTemplate
                  ? `${house.houseTemplate.code} v${house.houseTemplate.version}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Owner</p>
              <p className="font-medium">{house.ownerName ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Progress</p>
              <p className="font-medium">{house.progressPct}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Seeded from template</p>
              <p className="font-medium">{house.seededFromTemplate ? "Yes" : "No"}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground">Notes</p>
              <p className="font-medium whitespace-pre-wrap">{house.notes ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "location" ? (
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Phase</p>
              <p className="font-medium">
                {house.phase ? `${house.phase.code} — ${house.phase.name}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Sector</p>
              <p className="font-medium">
                {house.sector ? `${house.sector.code} — ${house.sector.name}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Block</p>
              <p className="font-medium">
                {house.block ? `${house.block.code} — ${house.block.name}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Plot</p>
              <p className="font-medium">{house.plotNo ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">GPS latitude</p>
              <p className="font-medium">{house.gpsLatitude ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">GPS longitude</p>
              <p className="font-medium">{house.gpsLongitude ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "template" ? (
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Assigned template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!house.houseTemplateId ? (
              <p className="text-muted-foreground">No template assigned.</p>
            ) : templateQuery.isLoading ? (
              <p className="text-muted-foreground">Loading template…</p>
            ) : templateQuery.data ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Code / version</p>
                    <p className="font-medium">
                      {templateQuery.data.code} v{templateQuery.data.version}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{templateQuery.data.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Activities</p>
                    <p className="font-medium">{templateQuery.data.activityCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">BOQ items</p>
                    <p className="font-medium">{templateQuery.data.boqCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Materials</p>
                    <p className="font-medium">{templateQuery.data.materialCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Est. cost / days</p>
                    <p className="font-medium">
                      {templateQuery.data.estimatedCost ?? "—"} /{" "}
                      {templateQuery.data.estimatedDurationDays ?? "—"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Template definitions only — execution seeding is deferred.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Template not found.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "timeline" ? (
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Status timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {(historyQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No status changes yet.</p>
            ) : (
              <ol className="space-y-3">
                {(historyQuery.data ?? []).map((event) => (
                  <li
                    key={event.id}
                    className="rounded-xl border border-border/60 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">
                      {event.fromStatus
                        ? `${HOUSE_STATUS_LABELS[event.fromStatus] ?? event.fromStatus} → `
                        : ""}
                      {HOUSE_STATUS_LABELS[event.toStatus] ?? event.toStatus}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.createdAt)}
                      {event.note ? ` · ${event.note}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "documents" ? (
        <PlaceholderPanel title="Documents" moduleHint="document vault" />
      ) : null}
      {tab === "activities" ? (
        <PlaceholderPanel title="Activities" moduleHint="construction execution" />
      ) : null}
      {tab === "boq" ? (
        <PlaceholderPanel title="BOQ" moduleHint="BOQ / costing modules" />
      ) : null}
      {tab === "materials" ? (
        <PlaceholderPanel title="Materials" moduleHint="materials / inventory modules" />
      ) : null}

      {tab === "history" ? (
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Change history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(house.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p className="font-medium">{formatDate(house.updatedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">{house.version}</p>
              </div>
            </div>
            <ol className="space-y-2 border-t border-border/60 pt-3">
              {(historyQuery.data ?? []).map((event) => (
                <li key={event.id} className="text-sm">
                  <span className="font-medium">
                    {HOUSE_STATUS_LABELS[event.toStatus] ?? event.toStatus}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatDate(event.createdAt)}
                    {event.note ? ` · ${event.note}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </PageMotion>
  );
}
