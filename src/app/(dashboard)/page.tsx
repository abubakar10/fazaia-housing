"use client";

import { ShieldCheck, KeyRound, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, PageMotion } from "@/components/layout";
import { EmptyState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand";
import { useAuth } from "@/features/auth/hooks/use-auth";

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <PageMotion className="space-y-8">
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="Authentication, users, RBAC, and organization hierarchy are active."
      />

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(0_174_239_/0.18),transparent_45%),radial-gradient(circle_at_bottom_left,rgb(6_21_45_/0.08),transparent_40%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" floating />
              <Badge variant="secondary">Modules 0–7</Badge>
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Falcon Housing platform
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
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.08 }}
                className="rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur transition-shadow hover:shadow-glow"
              >
                <item.icon className="mb-3 size-4 text-primary" />
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
              </motion.div>
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
