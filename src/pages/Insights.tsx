import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { BarChart3, Briefcase, Heart, Sparkles, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { startOfDay, subDays, format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

type TaskCategory = "work" | "personal" | "leisure";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
}

const SECTIONS: {
  id: TaskCategory;
  title: string;
  icon: typeof Briefcase;
  bgClass: string;
  borderClass: string;
  accentClass: string;
  progressClass: string;
  barColor: string;
}[] = [
  {
    id: "work",
    title: "Work",
    icon: Briefcase,
    bgClass: "bg-blue-50/60 dark:bg-blue-950/20",
    borderClass: "border-blue-200/60 dark:border-blue-800/40",
    accentClass: "text-blue-600 dark:text-blue-400",
    progressClass: "[&>div]:bg-blue-500",
    barColor: "hsl(217, 72%, 60%)",
  },
  {
    id: "personal",
    title: "Personal",
    icon: Heart,
    bgClass: "bg-emerald-50/60 dark:bg-emerald-950/20",
    borderClass: "border-emerald-200/60 dark:border-emerald-800/40",
    accentClass: "text-emerald-600 dark:text-emerald-400",
    progressClass: "[&>div]:bg-emerald-500",
    barColor: "hsl(152, 60%, 48%)",
  },
  {
    id: "leisure",
    title: "Leisure",
    icon: Sparkles,
    bgClass: "bg-amber-50/60 dark:bg-amber-950/20",
    borderClass: "border-amber-200/60 dark:border-amber-800/40",
    accentClass: "text-amber-600 dark:text-amber-400",
    progressClass: "[&>div]:bg-amber-500",
    barColor: "hsl(38, 80%, 55%)",
  },
];

// Supportive feedback generator
function generateFeedback(rates: Record<TaskCategory, number>, totalCompleted: number): string {
  const avg = (rates.work + rates.personal + rates.leisure) / 3;
  const maxSection = (Object.entries(rates) as [TaskCategory, number][]).sort((a, b) => b[1] - a[1])[0];
  const minSection = (Object.entries(rates) as [TaskCategory, number][]).sort((a, b) => a[1] - b[1])[0];

  if (totalCompleted === 0) return "A fresh start awaits. Begin when you're ready.";
  if (avg >= 75) return "Strong consistency this week. Keep the rhythm steady.";
  if (avg >= 50) {
    const diff = maxSection[1] - minSection[1];
    if (diff < 20) return "Your time is distributed evenly across areas. Good balance.";
    const label = SECTIONS.find(s => s.id === maxSection[0])?.title || maxSection[0];
    return `You focused more on ${label} this week. That's okay.`;
  }
  return "This week was lighter. Let's reset gently tomorrow.";
}

function generateSectionInsight(section: typeof SECTIONS[0], rate: number): string | null {
  if (rate >= 80) return `${section.title} goals are on track. Steady progress.`;
  if (rate >= 50) return `${section.title} is progressing. Small steps count.`;
  if (rate > 0) return `${section.title} was less active. No pressure.`;
  return null;
}

const Insights = () => {
  const { user } = useAuth();
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const todayStart = startOfDay(new Date()).toISOString();
      const weekStart = subDays(new Date(), 6);

      const [{ data: today }, { data: week }] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id).gte("created_at", todayStart),
        supabase.from("tasks").select("*").eq("user_id", user.id).gte("created_at", weekStart.toISOString()),
      ]);

      setTodayTasks(today || []);
      setWeekTasks(week || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Daily stats per section
  const dailyStats = useMemo(() => {
    return SECTIONS.map((s) => {
      const sectionTasks = todayTasks.filter((t) => (t.category || "work") === s.id);
      const completed = sectionTasks.filter((t) => t.completed).length;
      const total = sectionTasks.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...s, completed, total, pct };
    });
  }, [todayTasks]);

  // Weekly stats per section
  const weeklyRates = useMemo(() => {
    const rates: Record<TaskCategory, { completed: number; total: number }> = {
      work: { completed: 0, total: 0 },
      personal: { completed: 0, total: 0 },
      leisure: { completed: 0, total: 0 },
    };
    weekTasks.forEach((t) => {
      const cat = (t.category || "work") as TaskCategory;
      if (rates[cat]) {
        rates[cat].total++;
        if (t.completed) rates[cat].completed++;
      }
    });
    return rates;
  }, [weekTasks]);

  // Chart data: per-day breakdown
  const chartData = useMemo(() => {
    const days: Record<string, Record<TaskCategory, number>> = {};
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, "EEE");
      days[key] = { work: 0, personal: 0, leisure: 0 };
    }
    weekTasks.filter(t => t.completed).forEach((t) => {
      const key = format(new Date(t.updated_at), "EEE");
      const cat = (t.category || "work") as TaskCategory;
      if (days[key] && days[key][cat] !== undefined) {
        days[key][cat]++;
      }
    });
    return Object.entries(days).map(([day, cats]) => ({ day, ...cats }));
  }, [weekTasks]);

  const weeklyCompletionRates: Record<TaskCategory, number> = {
    work: weeklyRates.work.total > 0 ? Math.round((weeklyRates.work.completed / weeklyRates.work.total) * 100) : 0,
    personal: weeklyRates.personal.total > 0 ? Math.round((weeklyRates.personal.completed / weeklyRates.personal.total) * 100) : 0,
    leisure: weeklyRates.leisure.total > 0 ? Math.round((weeklyRates.leisure.completed / weeklyRates.leisure.total) * 100) : 0,
  };

  const totalWeekCompleted = weekTasks.filter(t => t.completed).length;
  const feedbackMessage = generateFeedback(weeklyCompletionRates, totalWeekCompleted);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mb-1 sm:mb-2">Insights</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Your progress across life domains</p>
          </div>
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="w-full max-w-xs mx-auto grid grid-cols-2 h-10 rounded-xl">
            <TabsTrigger value="daily" className="rounded-lg text-sm">Today</TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-lg text-sm">This Week</TabsTrigger>
          </TabsList>

          {/* ===== DAILY TAB ===== */}
          <TabsContent value="daily" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dailyStats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn("rounded-2xl border p-5", s.bgClass, s.borderClass)}
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <Icon className={cn("w-5 h-5", s.accentClass)} />
                      <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{s.completed} of {s.total} completed</span>
                        <span className="font-medium">{s.pct}%</span>
                      </div>
                      <Progress value={s.pct} className={cn("h-2", s.progressClass)} />
                    </div>
                    {s.total === 0 && (
                      <p className="text-xs text-muted-foreground/60 mt-3">No tasks planned today</p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Daily summary */}
            {todayTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-foreground">Today's Balance</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {todayTasks.filter(t => t.completed).length} of {todayTasks.length} total tasks completed across all domains.
                </p>
              </motion.div>
            )}
          </TabsContent>

          {/* ===== WEEKLY TAB ===== */}
          <TabsContent value="weekly" className="mt-6 space-y-5">
            {/* Section completion rates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SECTIONS.map((s, i) => {
                const Icon = s.icon;
                const rate = weeklyCompletionRates[s.id];
                const stats = weeklyRates[s.id];
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn("rounded-2xl border p-5", s.bgClass, s.borderClass)}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <Icon className={cn("w-5 h-5", s.accentClass)} />
                      <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                    </div>
                    <p className={cn("text-3xl font-bold mb-1", s.accentClass)}>{rate}%</p>
                    <p className="text-xs text-muted-foreground">{stats.completed} of {stats.total} tasks</p>
                    <Progress value={rate} className={cn("h-1.5 mt-3", s.progressClass)} />
                  </motion.div>
                );
              })}
            </div>

            {/* Bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                Weekly Distribution
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="work" stackId="a" fill={SECTIONS[0].barColor} radius={[0, 0, 0, 0]} name="Work" />
                    <Bar dataKey="personal" stackId="a" fill={SECTIONS[1].barColor} radius={[0, 0, 0, 0]} name="Personal" />
                    <Bar dataKey="leisure" stackId="a" fill={SECTIONS[2].barColor} radius={[4, 4, 0, 0]} name="Leisure" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Behavioral insights */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-border bg-card p-5 space-y-3"
            >
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Observations
              </h3>
              <div className="space-y-2">
                {SECTIONS.map((s) => {
                  const insight = generateSectionInsight(s, weeklyCompletionRates[s.id]);
                  if (!insight) return null;
                  return (
                    <p key={s.id} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className={cn("inline-block w-2 h-2 rounded-full mt-1.5 shrink-0")} style={{ backgroundColor: s.barColor }} />
                      {insight}
                    </p>
                  );
                })}
              </div>
            </motion.div>

            {/* Supportive feedback */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center"
            >
              <p className="text-sm font-medium text-foreground">{feedbackMessage}</p>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Insights;
