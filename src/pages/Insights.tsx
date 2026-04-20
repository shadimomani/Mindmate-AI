import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { LearningInsights } from "@/components/dashboard/LearningInsights";

interface DayRecord {
  label: string;
  dateStr: string;
  completed: number;
  isToday: boolean;
}

const Insights = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [weekTasks, setWeekTasks] = useState<
    { completed: boolean; created_at: string }[]
  >([]);

  useEffect(() => {
    if (!user) return;
    const fetchWeek = async () => {
      const weekStart = subDays(startOfDay(new Date()), 6);
      const { data } = await supabase
        .from("tasks")
        .select("completed, created_at")
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString());
      setWeekTasks(data || []);
    };
    fetchWeek();
  }, [user]);

  const days: DayRecord[] = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayTasks = weekTasks.filter(
        (t) => format(new Date(t.created_at), "yyyy-MM-dd") === dateStr
      );
      return {
        label: format(d, "EEE"),
        dateStr,
        completed: dayTasks.filter((t) => t.completed).length,
        isToday: dateStr === todayStr,
      };
    });
  }, [weekTasks]);

  const totalCompleted = days.reduce((s, d) => s + d.completed, 0);
  const activeDays = days.filter((d) => d.completed > 0).length;
  const currentStreak = (() => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].completed > 0) streak++;
      else break;
    }
    return streak;
  })();

  function encouragement(totalCompleted: number, activeDays: number): string {
    if (totalCompleted === 0) return t('newWeekStart');
    if (activeDays >= 6) return t('incredibleConsistency');
    if (activeDays >= 4) return t('strongWeek');
    if (activeDays >= 2) return t('youShowedUp');
    return t('evenOneDayCounts');
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto px-1 sm:px-0 space-y-8 sm:space-y-10 animate-in fade-in duration-500">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {t('yourWeek')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('consistencyOverPerfection')}
          </p>
        </motion.div>

        {currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-2 text-sm font-medium"
          >
            🔥 {currentStreak} {t('dayStreak')}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {t('thisWeek')}
          </p>

          {days.map((day, i) => (
            <motion.div
              key={day.dateStr}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className={cn(
                "flex items-center gap-3 py-2 px-3 rounded-xl transition-colors",
                day.isToday && "bg-accent/5"
              )}
            >
              <span
                className={cn(
                  "w-10 text-sm font-medium shrink-0",
                  day.isToday ? "text-accent font-semibold" : "text-muted-foreground"
                )}
              >
                {day.label}
              </span>

              <div className="flex items-center gap-1.5 flex-1">
                {day.completed > 0 ? (
                  Array.from({ length: Math.min(day.completed, 5) }, (_, j) => (
                    <div
                      key={j}
                      className="w-6 h-6 rounded-lg bg-accent/15 flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-accent" />
                    </div>
                  ))
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground/30" />
                )}
              </div>

              {day.isToday && (
                <span className="text-[10px] text-accent font-medium uppercase tracking-wider">
                  {t('todayLabel')}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* ── Performance Chart ── */}
        <PerformanceChart />

        {/* ── AI Learning Insights ── */}
        <LearningInsights />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-accent/15 bg-accent/5 p-5 text-center"
        >
          <p className="text-sm font-medium text-foreground">
            {encouragement(totalCompleted, activeDays)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t('smallActionsChange')}
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Insights;
