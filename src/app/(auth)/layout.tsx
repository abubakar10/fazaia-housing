export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,95,70,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(30,58,95,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(245,247,250,0.9))]" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
