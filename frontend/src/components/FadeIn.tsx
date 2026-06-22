/**
 * FadeIn — fade-in with blur effect, triggers on mount.
 * Animation 2: blur+opacity+y entry
 */
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.45,
  yOffset = 10,
  blur = "6px",
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        delay: 0.04 + delay,
        duration,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
