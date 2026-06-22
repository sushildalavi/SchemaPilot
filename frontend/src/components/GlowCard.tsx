/**
 * GlowCard — card with animated neon gradient border glow.
 * Animation 4: rotating neon border gradient + inner glow pulse
 */
import { type ReactNode, useState } from "react";
import { cn } from "../lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  borderSize?: number;
  borderRadius?: number;
  neonColors?: { firstColor: string; secondColor: string };
}

export function GlowCard({
  children,
  className,
  borderSize = 2,
  borderRadius = 16,
  neonColors = { firstColor: "#6366f1", secondColor: "#8b5cf6" },
}: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn("group relative", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 animate-neon-border rounded-[inherit] transition-opacity duration-500"
        style={{
          padding: borderSize,
          background: `conic-gradient(from var(--neon-angle,0deg), ${neonColors.firstColor}, ${neonColors.secondColor}, #a855f7, ${neonColors.firstColor})`,
          opacity: hovered ? 1 : 0.5,
          borderRadius,
        }}
      >
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background: "var(--surface, #161b27)",
            margin: borderSize,
            borderRadius: borderRadius - borderSize,
          }}
        />
      </div>

      {/* Glow */}
      <div
        className="absolute inset-0 rounded-[inherit] transition-all duration-500"
        style={{
          filter: `blur(${hovered ? 20 : 10}px)`,
          background: `linear-gradient(135deg, ${neonColors.firstColor}22, ${neonColors.secondColor}22)`,
          opacity: hovered ? 1 : 0.5,
          zIndex: -1,
          transform: "translateY(4px) scale(0.98)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
