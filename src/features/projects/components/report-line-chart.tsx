"use client";

import { cn } from "@/lib/utils";

type Series = {
  label: string;
  color: string;
  values: number[];
};

type ReportLineChartProps = {
  title: string;
  labels: string[];
  series: Series[];
  className?: string;
};

function toPath(values: number[], max: number, width: number, height: number) {
  if (!values.length || max <= 0) return "";
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function ReportLineChart({
  title,
  labels,
  series,
  className,
}: ReportLineChartProps) {
  const width = 320;
  const height = 140;
  const max = Math.max(
    1,
    ...series.flatMap((item) => item.values),
  );

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-white p-4 shadow-soft", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {series.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1="0"
            x2={width}
            y1={height - tick * height}
            y2={height - tick * height}
            stroke="#e4f3fa"
          />
        ))}
        {series.map((item) => (
          <path
            key={item.label}
            d={toPath(item.values, max, width, height)}
            fill="none"
            stroke={item.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{labels[0]}</span>
        <span>{labels[Math.floor(labels.length / 2)]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}
