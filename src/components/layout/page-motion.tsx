"use client";

import { motion, useReducedMotion } from "framer-motion";

type PageMotionProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageMotion({ children, className }: PageMotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
