import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#eef9ff] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,174,239,0.18),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(56,189,248,0.14),transparent_30%),linear-gradient(180deg,#f8fdff_0%,#edf8ff_45%,#e2f3ff_100%)]" />
      <div className="animate-orb pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-[#00aeef]/18 blur-3xl" />
      <div className="animate-orb-slow pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-[#7dd3fc]/18 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-50"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,174,239,0.24), transparent)",
          animation: "wing-pulse 3.6s ease-in-out infinite",
        }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-[linear-gradient(180deg,transparent,rgba(0,174,239,0.08),transparent)]" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
