import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PageSkeletonProps = {
  rows?: number;
  className?: string;
};

export function PageSkeleton({ rows = 6, className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70">
        <div className="border-b border-border/70 bg-muted/30 px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-4"
            >
              <Skeleton className="h-4 w-full" />
              <Skeleton className="hidden h-4 w-full sm:block" />
              <Skeleton className="hidden h-4 w-full sm:block" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
