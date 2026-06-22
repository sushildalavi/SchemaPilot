/**
 * GridBackdrop — animated perspective grid background.
 * Animation 3: infinite grid-scroll upward
 */
import { cn } from "../lib/utils";

interface Props {
  className?: string;
  angle?: number;
}

export function GridBackdrop({ className, angle = 65 }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-50",
        className,
      )}
      style={{ perspective: "200px" }}
    >
      <div
        className="absolute inset-0 origin-[100%_0%]"
        style={{ transform: `rotateX(${angle}deg)` }}
      >
        {/* Moving grid */}
        <div
          className="animate-retro-grid"
          style={{
            width: "100%",
            height: "300%",
            backgroundImage: `
              linear-gradient(to right, rgba(99,102,241,0.18) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99,102,241,0.18) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>
      {/* Fade overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-transparent to-[#0f1117]/60" />
    </div>
  );
}
