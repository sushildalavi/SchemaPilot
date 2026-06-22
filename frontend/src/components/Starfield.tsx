import { cn } from "../lib/utils";

interface Props {
  number?: number;
  className?: string;
}

/**
 * Starfield — animated meteor shower particles.
 * Parent must have `position: relative` and `overflow: hidden`.
 */
export function Starfield({ number = 12, className }: Props) {
  const meteors = Array.from({ length: number });
  return (
    <>
      {meteors.map((_, i) => (
        <span
          key={i}
          className={cn(
            "animate-meteor pointer-events-none absolute top-0 left-1/2 h-px w-px rotate-[215deg] rounded-full",
            "bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
            "before:absolute before:top-1/2 before:h-px before:-translate-y-1/2",
            "before:bg-gradient-to-r before:from-white/0 before:via-white/50 before:to-white/0",
            "before:content-['']",
            className,
          )}
          style={{
            top: "0",
            left: `${Math.floor(Math.random() * 100)}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.floor(Math.random() * 6) + 4}s`,
            width: `${Math.floor(Math.random() * 80) + 60}px`,
          }}
        />
      ))}
    </>
  );
}
