"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type FalconLoaderProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

export function FalconLoader({
  label = "Loading…",
  className,
  compact = false,
}: FalconLoaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        compact ? "py-4" : "py-12",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative">
        {!reduceMotion ? (
          <span className="absolute -inset-2 rounded-3xl border-2 border-primary/30 animate-falcon-spin" />
        ) : null}
        <motion.div
          className="brand-logo-ring relative size-16 overflow-hidden rounded-2xl bg-white"
          animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/brand/falcon-logo.png"
            alt=""
            width={64}
            height={64}
            className="size-full object-cover"
          />
        </motion.div>
      </div>
      {label ? (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
