"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: 36,
  md: 48,
  lg: 88,
  xl: 148,
} as const;

type BrandLogoProps = {
  size?: keyof typeof SIZES;
  animated?: boolean;
  floating?: boolean;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  size = "md",
  animated = true,
  floating = false,
  className,
  priority,
}: BrandLogoProps) {
  const reduceMotion = useReducedMotion();
  const px = SIZES[size];

  return (
    <motion.div
      className={cn(
        "brand-logo-ring relative shrink-0 overflow-hidden rounded-2xl bg-white",
        floating && !reduceMotion && "animate-falcon-float",
        className,
      )}
      style={{ width: px, height: px }}
      initial={animated && !reduceMotion ? { opacity: 0, x: -18, scale: 0.88 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image
        src="/brand/falcon-logo.png"
        alt="Falcon Housing"
        width={px}
        height={px}
        className="size-full object-cover"
        priority={priority}
      />
    </motion.div>
  );
}
