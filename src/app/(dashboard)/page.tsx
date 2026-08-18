"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, KeyRound, Sparkles, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, PageMotion } from "@/components/layout";
import { EmptyState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { APP_FULL_NAME, APP_SHORT_NAME } from "@/lib/constants";

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <PageMotion className="space-y-8">
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="Authentication, users, RBAC, and organization hierarchy are active."
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/92 p-6 shadow-[0_30px_90px_-35px_rgba(0,174,239,0.55)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,174,239,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.18),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,250,255,0.98))]" />
        <div className="animate-orb pointer-events-none absolute -right-10 top-10 size-32 rounded-full bg-primary/15 blur-3xl" />
        <div className="animate-orb-slow pointer-events-none absolute -left-6 bottom-0 size-36 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <BrandLogo size="md" floating className="rounded-3xl" />
              <Badge variant="secondary" className="shadow-soft">Modules 0–7</Badge>
              <Badge className="shadow-glow">{APP_SHORT_NAME}</Badge>
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {APP_SHORT_NAME}
              </h2>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary/80">
                {APP_FULL_NAME}
              </p>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              A polished, modern housing operations workspace for projects, teams,
              approvals, and construction visibility.
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {user?.email ?? "…"}
              </span>
              .
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="min-h-11 rounded-full px-5" asChild>
                <Link href="/projects">
                  Open Projects
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="min-h-11 rounded-full px-5" asChild>
                <Link href="/">
                  View Overview
                </Link>
              </Button>
            </div>
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
              {
                icon: Sparkles,
                title: "Dashboard polish",
                body: "Animated, branded customer-ready workspace",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.08 }}
                className="rounded-3xl border border-white/70 bg-white/80 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
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
