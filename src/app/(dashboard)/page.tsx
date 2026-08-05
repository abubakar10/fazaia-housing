"use client";

import { ShieldCheck, KeyRound, Workflow } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { EmptyState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/use-auth";

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <PageMotion className="space-y-8">
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="Authentication, users, RBAC, and organization hierarchy are active."
      />

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(20_95_70_/0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgb(210_40_40_/0.08),transparent_40%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge variant="secondary">Modules 0–4</Badge>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Platform foundation ready
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {user?.email ?? "…"}
              </span>
              .
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                icon: KeyRound,
                title: "Auth.js + Argon2",
                body: "Login, lockout, password reset",
              },
              {
                icon: ShieldCheck,
                title: "RBAC",
                body: "Roles, overrides, filtered nav",
              },
              {
                icon: Workflow,
                title: "Organization",
                body: "Hierarchy + user placement",
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
        title="Business modules still gated"
        description="Phases, store, billing, and inbox remain disabled until their roadmap modules begin."
      />
    </PageMotion>
  );
}
