import { cn } from "@/lib/utils";
import { FalconLoader } from "@/components/brand";

type PageSkeletonProps = {
  rows?: number;
  className?: string;
};

export function PageSkeleton({ rows = 6, className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)} aria-busy="true" aria-live="polite">
      <FalconLoader label="Loading data…" />
      <div className="space-y-3">
        <div className="h-8 w-56 overflow-hidden rounded-md bg-[linear-gradient(90deg,#e4f3fa_0%,#c8ebf8_50%,#e4f3fa_100%)] bg-[length:200%_100%] animate-shimmer" />
        <div className="h-4 w-96 max-w-full overflow-hidden rounded-md bg-[linear-gradient(90deg,#e4f3fa_0%,#c8ebf8_50%,#e4f3fa_100%)] bg-[length:200%_100%] animate-shimmer" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-12 border-b border-border/50 bg-[linear-gradient(90deg,#e4f3fa_0%,#d7eef8_50%,#e4f3fa_100%)] bg-[length:200%_100%] animate-shimmer last:border-0"
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
