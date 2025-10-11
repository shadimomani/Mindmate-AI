import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export const StatsCard = ({ title, value, subtitle, icon: Icon, trend = "neutral" }: StatsCardProps) => {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground"
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-sans font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon className="w-5 h-5 text-accent" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-serif font-bold text-foreground">{value}</p>
        <p className={`text-sm font-sans ${trendColors[trend]}`}>{subtitle}</p>
      </div>
    </div>
  );
};
