import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { MiniChart } from "./MiniChart";
import { SpotlightCard } from "./SpotlightCard";

interface Props {
  label: string;
  value: number;
  sub?: string;
  trend?: number[];
  color?: string;
  sparkColor?: string;
}

export function MetricCard({ label, value, sub, trend, color = "var(--text-1)", sparkColor = "#6366f1" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 60, stiffness: 100 });
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toLocaleString();
    });
  }, [spring]);

  return (
    <SpotlightCard className="card h-full" gradientColor={`${sparkColor}18`}>
      <div className="p-5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{label}</span>
          {trend && trend.length > 2 && (
            <MiniChart data={trend} width={56} height={22} color={sparkColor} />
          )}
        </div>
        <p className="mono" style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color }}>
          <motion.span ref={ref}>0</motion.span>
        </p>
        {sub && <p className="caption">{sub}</p>}
      </div>
    </SpotlightCard>
  );
}
