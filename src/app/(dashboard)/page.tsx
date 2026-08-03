import Link from "next/link";
import { ArrowRight, Boxes, ShieldCheck, Workflow } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardHomePage() {
  return (
    <PageMotion className="space-y-8">
      <PageHeader
        title="Foundation ready"
        description="Module 0 is live: design system, app shell, shared kits, Prisma baselines, and health checks. Authentication starts in Module 1."
        actions={
          <Button asChild className="min-h-11">
            <Link href="/login">
              Open auth shell
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(20_95_70_/0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgb(210_40_40_/0.08),transparent_40%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge variant="secondary">Module 0 · Foundation</Badge>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              FAZIA Housing ERP shell
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Premium light-theme operating surface for construction delivery.
              Business modules are intentionally gated until their roadmap
              phase begins.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                icon: Boxes,
                title: "Shared kits",
                body: "Forms, DataTable, feedback states",
              },
              {
                icon: ShieldCheck,
                title: "Platform baselines",
                body: "User, AuditLog, Idempotency, Flags",
              },
              {
                icon: Workflow,
                title: "Clean boundaries",
                body: "UI → services → repositories later",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur"
              >
                <item.icon className="mb-3 size-4 text-primary" />
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EmptyState
        title="No operational data yet"
        description="Projects, store, billing, and inbox activate in later modules. This empty state verifies the shared feedback contract."
      />
    </PageMotion>
  );
}
