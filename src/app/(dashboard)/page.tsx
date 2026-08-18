"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, PageMotion } from "@/components/layout";
import { EmptyState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLogo, BrandTitle } from "@/components/brand";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { APP_SHORT_NAME } from "@/lib/constants";

const QUICK_STATS = [
  { label: "Active modules", value: "7", hint: "Foundation stack" },
  { label: "Security", value: "RBAC", hint: "Role-based access" },
  { label: "Platform", value: APP_SHORT_NAME, hint: "Housing ERP" },
];

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <PageMotion className="space-y-8">
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="Your command center for projects, users, organization, and housing operations."
      />

      <section className="glass-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,180,240,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_38%)]" />
        <div className="animate-orb pointer-events-none absolute -right-8 top-8 size-40 rounded-full bg-primary/12 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <BrandLogo size="md" floating className="rounded-2xl" />
              <Badge variant="secondary" className="rounded-full px-3">
                Live MVP
              </Badge>
            </div>

            <BrandTitle
              shortClassName="!text-3xl sm:!text-4xl !tracking-[0.2em] font-bold"
              fullClassName="!text-sm !text-muted-foreground"
            />

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              A refined workspace for housing scheme operations — projects, teams,
              approvals, and construction visibility in one place.
            </p>

            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-semibold text-foreground">
                {user?.email ?? "…"}
              </span>
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="min-h-11 rounded-full px-6 gradient-primary border-0 text-white shadow-glow hover:opacity-95"
                asChild
              >
                <Link href="/projects">
                  Open Projects
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-h-11 rounded-full border-primary/25 bg-white/80 px-6 hover:bg-primary/5"
                asChild
              >
                <Link href="/organization">Organization</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: KeyRound, title: "Secure login", body: "Auth.js + Argon2" },
              { icon: ShieldCheck, title: "RBAC", body: "Roles & permissions" },
              { icon: Workflow, title: "Organization", body: "Hierarchy & placement" },
              { icon: Sparkles, title: "Modern UI", body: "Animated dashboards" },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.06 }}
                className="group rounded-2xl border border-white/80 bg-white/70 p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <item.icon className="size-4" />
                </div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            className="rounded-2xl border border-border/60 bg-white/80 p-5 shadow-soft"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gradient-primary">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            icon: Building2,
            title: "Projects & houses",
            body: "Create projects, structure sites, and track house inventory.",
          },
          {
            icon: Users,
            title: "Users & access",
            body: "Invite teams, assign roles, and control module visibility.",
          },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.08 }}
            className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-soft transition-shadow hover:shadow-elevated"
          >
            <item.icon className="mb-3 size-5 text-primary" />
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
          </motion.div>
        ))}
      </div>

      <EmptyState
        title="More modules coming soon"
        description="Store, billing, inbox, and advanced reporting will unlock as the roadmap continues."
        className="border-border/50 bg-white/60"
      />
    </PageMotion>
  );
}
