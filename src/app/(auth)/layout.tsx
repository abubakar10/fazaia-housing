import type { ReactNode } from "react";
import { BrandLogo, BrandTitle } from "@/components/brand";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="mesh-bg absolute inset-0" />
        <div className="animate-orb pointer-events-none absolute -left-20 top-20 size-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="animate-orb-slow pointer-events-none absolute bottom-10 right-10 size-96 rounded-full bg-sky-400/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <BrandLogo size="md" floating priority className="rounded-2xl ring-2 ring-white/20" />
          <BrandTitle variant="light" />
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Modern housing operations, built for clarity.
          </h1>
          <p className="text-base leading-relaxed text-sky-100/85">
            Manage projects, teams, approvals, and construction progress in one
            polished workspace designed for Air Force officers housing programs.
          </p>
          <div className="flex flex-wrap gap-3">
            {["Secure access", "Live dashboards", "Role-based control"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-sky-200/60">
          Airforce Officers Housing Scheme · Enterprise platform
        </p>
      </section>

      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,180,240,0.12),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(56,189,248,0.1),transparent_35%)]" />
        <div className="animate-orb pointer-events-none absolute -right-16 top-24 size-64 rounded-full bg-primary/10 blur-3xl lg:hidden" />
        <div className="relative z-10 w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
