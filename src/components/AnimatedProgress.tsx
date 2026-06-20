import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  value: number;
  className?: string;
}

/** Progress bar that animates its fill from 0 → value on mount and on value changes. */
export const AnimatedProgress = ({ value, className }: AnimatedProgressProps) => {
  const reduced = useReducedMotion();
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <ProgressPrimitive.Indicator asChild>
        <motion.div
          className="h-full bg-primary origin-left"
          initial={{ scaleX: reduced ? v / 100 : 0 }}
          animate={{ scaleX: v / 100 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%" }}
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
};

export default AnimatedProgress;
