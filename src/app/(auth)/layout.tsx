import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#040b16] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,174,239,0.28),transparent_38%),radial-gradient(circle_at_82%_8%,rgba(0,174,239,0.16),transparent_32%),linear-gradient(180deg,#040b16_0%,#06152d_55%,#02060d_100%)]" />
      <div className="animate-orb pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-[#00aeef]/25 blur-3xl" />
      <div className="animate-orb-slow pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-[#00aeef]/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-40"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,174,239,0.35), transparent)",
          animation: "wing-pulse 3.6s ease-in-out infinite",
        }}
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
