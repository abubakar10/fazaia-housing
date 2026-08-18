"use client";

import { cn } from "@/lib/utils";
import { APP_FULL_NAME, APP_SHORT_NAME } from "@/lib/constants";

type BrandTitleProps = {
  className?: string;
  shortClassName?: string;
  fullClassName?: string;
  align?: "left" | "center";
  variant?: "default" | "light";
};

export function BrandTitle({
  className,
  shortClassName,
  fullClassName,
  align = "left",
  variant = "default",
}: BrandTitleProps) {
  return (
    <div
      className={cn(
        "space-y-1",
        align === "center" && "text-center",
        className,
      )}
    >
      <p
        className={cn(
          "text-lg font-bold tracking-[0.28em] uppercase sm:text-xl",
          variant === "default" && "text-gradient-primary",
          variant === "light" && "text-white",
          shortClassName,
        )}
      >
        {APP_SHORT_NAME}
      </p>
      <p
        className={cn(
          "text-xs leading-relaxed sm:text-sm",
          variant === "default" && "text-muted-foreground",
          variant === "light" && "text-sky-100/80",
          align === "center" && "mx-auto max-w-xs",
          fullClassName,
        )}
      >
        {APP_FULL_NAME}
      </p>
    </div>
  );
}
