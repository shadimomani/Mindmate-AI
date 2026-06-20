import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

const trendColors = {
  up: "text-green-600",
  down: "text-red-600",
  neutral: "text-muted-foreground",
};

const AnimatedValue = ({ value }: { value: string | number }) => {
  const numeric =
    typeof value === "number"
      ? value
      : (() => {
          const m = String(value).match(/^-?\d+(\.\d+)?/);
          return m ? parseFloat(m[0]) : NaN;
        })();

  const animated = useCountUp(Number.isFinite(numeric) ? numeric : 0, 1100);

  if (!Number.isFinite(numeric)) return <>{value}</>;

  if (typeof value === "number") return <>{Math.round(animated)}</>;

  const suffix = String(value).replace(/^-?\d+(\.\d+)?/, "");
  const display = Number.isInteger(numeric) ? Math.round(animated) : animated.toFixed(1);
  return <>{display}{suffix}</>;
};

export const StatsCard = ({ title, value, subtitle, icon: Icon, trend = "neutral" }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl p-6 shadow-soft border border-border card-hover"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-sans font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon className="w-5 h-5 text-accent" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-serif font-bold text-foreground tabular-nums">
          <AnimatedValue value={value} />
        </p>
        <p className={`text-sm font-sans ${trendColors[trend]}`}>{subtitle}</p>
      </div>
    </motion.div>
  );
};
