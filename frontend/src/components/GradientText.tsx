/**
 * GradientText — text with spinning conic gradient border.
 * Animation 5: infinite spinning gradient pill
 */
import { type ReactNode } from "react";
import { cn } from "../lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

export function GradientText({ children, className }: Props) {
  return (
    <div
      className={cn(
        "group relative flex cursor-default items-center justify-center rounded-full px-4 py-1.5",
        "bg-[length:var(--bg-size,400%)] transition-[background-position] duration-300",
        "shadow-[inset_0_-8px_10px_rgba(99,102,241,0.1)]",
        "[background-image:linear-gradient(to_right,#6366f1,#8b5cf6,#a855f7,#6366f1)] animate-gradient-text",
        className,
      )}
    >
      <div
        className="absolute inset-0 z-0 rounded-full"
        style={{
          background:
            "linear-gradient(to right, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
          filter: "blur(8px)",
        }}
      />
      <span
        className={cn(
          "relative z-10 inline-flex items-center gap-2 text-sm font-medium",
          "bg-clip-text text-transparent",
          "[background-image:linear-gradient(to_right,#c7d2fe,#e0e7ff,#a5b4fc,#c7d2fe)]",
          "[background-size:200%] animate-gradient-text",
        )}
      >
        {children}
      </span>
    </div>
  );
}
