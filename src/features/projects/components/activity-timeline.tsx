"use client";

import { formatDate } from "@/lib/utils";
import type { ProjectActivityEvent } from "../mappers";

type ActivityTimelineProps = {
  events: ProjectActivityEvent[];
  emptyMessage?: string;
  className?: string;
};

export function ActivityTimeline({
  events,
  emptyMessage = "No activity yet.",
  className,
}: ActivityTimelineProps) {
  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="activity-empty">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol className={className ?? "space-y-4"}>
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/70" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{event.label}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(event.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
