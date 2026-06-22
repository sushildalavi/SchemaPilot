import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "../lib/utils";

interface Props {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  decimalPlaces?: number;
}

/**
 * CountTicker — spring-animated number that counts up/down.
 */
export function CountTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(direction === "down" ? value : 0);
  const spring = useSpring(motionVal, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => {
      motionVal.set(direction === "down" ? 0 : value);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [motionVal, isInView, delay, value, direction]);

  useEffect(() => {
    spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number(latest.toFixed(decimalPlaces)));
      }
    });
  }, [spring, decimalPlaces]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums", className)}
    />
  );
}
