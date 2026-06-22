import type { CSSProperties } from "react";
import { cn } from "../lib/utils";

interface Props {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  reverse?: boolean;
  initialOffset?: number;
  anchor?: number;
}

/**
 * BorderGlow — animated light that travels along the border.
 * Parent must have `position: relative` and `overflow: hidden`.
 */
export function BorderGlow({
  className,
  size = 100,
  duration = 8,
  delay = 0,
  colorFrom = "#6366f1",
  colorTo = "#a855f7",
  borderWidth = 1,
  reverse = false,
  anchor = 90,
}: Props) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "[border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box]",
        "![mask-composite:intersect]",
        "[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square",
        "after:w-[calc(var(--size)*1px)]",
        reverse ? "after:animate-border-beam-reverse" : "after:animate-border-beam",
        "after:[animation-delay:var(--delay)]",
        "after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]",
        `after:[offset-anchor:calc(var(--anchor)*1%)_50%]`,
        "after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className,
      )}
    />
  );
}
