import { ShieldCheck, KeyRound, Workflow } from "lucide-react";
import { PageHeader, PageMotion } from "@/components/layout";
import { EmptyState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth";

export default async function DashboardHomePage() {
  const user = await getCurrentUser();

  return (
    <PageMotion className="space-y-8">
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ""}`}
        description="Module 1 authentication is active. Sessions are protected with Auth.js, Argon2 password hashing, and audit logging."
      />

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(20_95_70_/0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgb(210_40_40_/0.08),transparent_40%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge variant="secondary">Module 1 · Authentication</Badge>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Secure access layer ready
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Signed in as <span className="font-medium text-foreground">{user?.email}</span>.
              User management and RBAC arrive in Modules 2–3.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                icon: KeyRound,
                title: "Credentials + Argon2",
                body: "Login, lockout, password reset",
              },
              {
                icon: ShieldCheck,
                title: "Protected routes",
                body: "Middleware + secure cookies",
              },
              {
                icon: Workflow,
                title: "Audit trail",
                body: "Login, logout, reset events",
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
        description="Projects, store, billing, and inbox remain disabled until their roadmap modules begin."
      />
    </PageMotion>
  );
}
