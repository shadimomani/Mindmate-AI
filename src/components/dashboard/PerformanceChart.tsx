import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Flame, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface DayPerformance {
  day: string;
  shortDay: string;
  rate: number;
  completed: number;
  total: number;
}

export const PerformanceChart = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [weekData, setWeekData] = useState<DayPerformance[]>([]);
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      // Fetch last 7 days of tasks
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("completed, created_at")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      // Group by day
      const dayMap: Record<string, { completed: number; total: number }> = {};
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayNamesAr = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        dayMap[key] = { completed: 0, total: 0 };
      }

      if (tasks) {
        for (const task of tasks) {
          const key = new Date(task.created_at).toDateString();
          if (dayMap[key]) {
            dayMap[key].total++;
            if (task.completed) dayMap[key].completed++;
          }
        }
      }

      const isAr = document.documentElement.lang === "ar";
      const chartData: DayPerformance[] = [];
      let totalRate = 0;
      let daysWithTasks = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        const dayIdx = d.getDay();
        const stats = dayMap[key] || { completed: 0, total: 0 };
        const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        if (stats.total > 0) {
          totalRate += rate;
          daysWithTasks++;
        }

        chartData.push({
          day: key,
          shortDay: isAr ? dayNamesAr[dayIdx] : dayNames[dayIdx],
          rate,
          completed: stats.completed,
          total: stats.total,
        });
      }

      setWeekData(chartData);
      setWeeklyAvg(daysWithTasks > 0 ? Math.round(totalRate / daysWithTasks) : 0);

      // Calculate streak: consecutive days with >= 60% completion going backwards
      let currentStreak = 0;
      for (let i = chartData.length - 1; i >= 0; i--) {
        const d = chartData[i];
        if (d.total === 0) break;
        if (d.rate >= 60) {
          currentStreak++;
        } else {
          break;
        }
      }
      setStreak(currentStreak);
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) return null;

  // Convert weekly avg to 5-star rating
  const starRating = Math.round((weeklyAvg / 100) * 5 * 10) / 10; // e.g. 3.5
  const fullStars = Math.floor(starRating);
  const hasHalf = starRating - fullStars >= 0.3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            {t("weeklyPerformance")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("last7Days")}
          </p>
        </div>

        {/* Streak badge */}
        <div className="flex items-center gap-1.5 bg-accent/10 rounded-xl px-3 py-1.5">
          <Flame className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-accent tabular-nums">{streak}</span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {t("dayStreak")}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="shortDay"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number) => [`${value}%`, t("completionRate")]}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="hsl(var(--accent))"
              strokeWidth={2.5}
              fill="url(#perfGrad)"
              dot={{ r: 3, fill: "hsl(var(--accent))", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "hsl(var(--accent))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Star rating */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">{t("weeklyRating")}</p>
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 transition-colors ${
                  i < fullStars
                    ? "text-accent fill-accent"
                    : i === fullStars && hasHalf
                    ? "text-accent fill-accent/40"
                    : "text-muted-foreground/20"
                }`}
              />
            ))}
            <span className="text-sm font-bold text-foreground ms-2 tabular-nums">
              {starRating.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t("avgCompletion")}</p>
          <p className="text-lg font-serif font-bold text-foreground tabular-nums">
            {weeklyAvg}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};
