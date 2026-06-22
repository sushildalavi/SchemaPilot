import { useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
}

/**
 * SpotlightCard — card with cursor-following spotlight effect.
 */
export function SpotlightCard({
  children,
  className,
  gradientSize = 300,
  gradientColor = "rgba(99,102,241,0.08)",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn("group relative overflow-hidden", className)}
    >
      {/* spotlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500 z-0"
        style={{
          opacity,
          background: `radial-gradient(${gradientSize}px circle at ${pos.x}px ${pos.y}px, ${gradientColor}, transparent 60%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
