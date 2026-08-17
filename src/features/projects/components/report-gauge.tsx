"use client";

type ReportGaugeProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
};

export function ReportGauge({
  label,
  value,
  min = 0.5,
  max = 1.5,
}: ReportGaugeProps) {
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -90 + ratio * 180;
  const status =
    value >= 1 ? "On / ahead" : value >= 0.9 ? "Watch" : "Behind";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[220px]">
        <path
          d="M20 110 A80 80 0 0 1 180 110"
          fill="none"
          stroke="#fecaca"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M20 110 A80 80 0 0 1 100 30"
          fill="none"
          stroke="#fde68a"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M100 30 A80 80 0 0 1 180 110"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <g transform={`rotate(${angle} 100 110)`}>
          <polygon points="100,38 94,110 106,110" fill="#00aeef" />
          <circle cx="100" cy="110" r="8" fill="#00aeef" />
          <circle cx="100" cy="110" r="4" fill="#ffffff" />
        </g>
      </svg>
      <p className="text-2xl font-semibold text-primary">{value.toFixed(2)}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-xs text-muted-foreground">{status}</p>
    </div>
  );
}
