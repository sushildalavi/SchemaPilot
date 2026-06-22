/**
 * StaggeredList — items animate in one-by-one with spring physics.
 * Animation 1: sequential spring slide-in
 */
import React, {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/utils";

interface StaggeredListProps {
  className?: string;
  children: ReactNode;
  delay?: number;
}

export function StaggeredList({
  className,
  children,
  delay = 800,
}: StaggeredListProps) {
  const [index, setIndex] = useState(0);
  const childrenArray = useMemo(
    () => React.Children.toArray(children),
    [children],
  );

  useEffect(() => {
    if (index < childrenArray.length - 1) {
      const timeout = setTimeout(() => setIndex((prev) => prev + 1), delay);
      return () => clearTimeout(timeout);
    }
  }, [index, delay, childrenArray.length]);

  const itemsToShow = useMemo(
    () => childrenArray.slice(0, index + 1).reverse(),
    [index, childrenArray],
  );

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <AnimatePresence>
        {itemsToShow.map((item) => (
          <StaggeredListItem key={(item as React.ReactElement).key}>
            {item}
          </StaggeredListItem>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StaggeredListItem({ children }: { children: ReactNode }) {
  const animations = {
    initial: { scale: 0.92, opacity: 0, y: 12 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.92, opacity: 0 },
    transition: { type: "spring" as const, stiffness: 350, damping: 30 },
  };

  return (
    <motion.div {...animations} layout className="w-full">
      {children}
    </motion.div>
  );
}
