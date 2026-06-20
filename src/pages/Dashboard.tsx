import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { startOfDay } from "date-fns";
import { calculateAdaptiveLimits, type AdaptiveLimits } from "@/lib/commitmentAlgorithm";
import { Briefcase, Heart, Coffee, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { AnimatedProgress } from "@/components/AnimatedProgress";
import { WeeklyPlanner } from "@/components/dashboard/WeeklyPlanner";
import { AIMemoryInput } from "@/components/dashboard/AIMemoryInput";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";
import { PageTransition } from "@/components/PageTransition";

type TaskCategory = "work" | "personal" | "leisure";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: TaskCategory;
  estimated_time: number;
  created_at: string;
}

const SECTION_KEYS: { id: TaskCategory; labelKey: string; icon: typeof Briefcase; color: string; soft: string }[] = [
  { id: "work", labelKey: "work", icon: Briefcase, color: "var(--section-work)", soft: "var(--section-work-soft)" },
  { id: "personal", labelKey: "life", icon: Heart, color: "var(--section-personal)", soft: "var(--section-personal-soft)" },
  { id: "leisure", labelKey: "balance", icon: Coffee, color: "var(--section-leisure)", soft: "var(--section-leisure-soft)" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [limits, setLimits] = useState<AdaptiveLimits | null>(null);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? t('goodMorning') : currentHour < 18 ? t('goodAfternoon') : t('goodEvening');

  // One-time guide message
  useEffect(() => {
    if (!user) return;
    const key = `mindmate_about_shown_${user.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setTimeout(() => {
        toast({
          title: isRTL ? "💡 تعرف على التطبيق" : "💡 Learn About the App",
          description: isRTL
            ? "تقدر تزور صفحة 'عن التطبيق' من القائمة الجانبية لتعرف كيف تستفيد من MindMate."
            : "Visit the 'About' page from the sidebar to learn how to get the most out of MindMate.",
        });
      }, 2000);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (profile?.display_name) setDisplayName(profile.display_name);

      calculateAdaptiveLimits(user.id).then(setLimits);

      const todayStart = startOfDay(new Date()).toISOString();
      // Only purge INCOMPLETE old tasks — keep completed history for Insights/analytics
      await supabase
        .from("tasks")
        .delete()
        .eq("user_id", user.id)
        .eq("completed", false)
        .lt("created_at", todayStart);

      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", todayStart)
        .order("sort_order", { ascending: true });

      if (data) {
        setTasks(
          data.map((t: any) => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
            category: (t.category || "work") as TaskCategory,
            estimated_time: t.estimated_time || 15,
            created_at: t.created_at,
          }))
        );
      }
    };

    load();
  }, [user]);

  const toggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      await supabase.from("tasks").update({ completed: !task.completed }).eq("id", id);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    },
    [tasks]
  );

  const commitmentScore = limits
    ? Math.max(1, Math.min(10, Math.round(limits.completionRate / 10)))
    : null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const animatedScore = useCountUp(commitmentScore ?? 0, 1200);

  return (
    <DashboardLayout>
      <PageTransition>
      <div className="max-w-2xl mx-auto px-1 sm:px-0 space-y-8 sm:space-y-10">
        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-2"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground">
            {greeting}
            {displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">
            {t('herePlanForToday')}
          </p>
        </motion.div>

        {/* ── Commitment Score ── */}
        {commitmentScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="flex items-center gap-4 bg-card rounded-2xl border border-border p-5 shadow-soft"
          >
            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-accent/10">
              <span className="text-2xl font-serif font-bold text-accent tabular-nums">
                {Math.round(animatedScore)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                / 10
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t('commitmentScore')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {commitmentScore >= 8
                  ? t('greatConsistency')
                  : commitmentScore >= 5
                  ? t('buildingMomentum')
                  : t('startSmall')}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Overall Progress ── */}
        {totalTasks > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {completedTasks} {t('ofCompleted')} {totalTasks} {t('completed')}
              </span>
              <span className="font-medium tabular-nums">{Math.round(useCountUp(overallProgress, 1000))}%</span>
            </div>
            <AnimatedProgress value={overallProgress} />
          </motion.div>
        )}

        {/* ── AI Memory ── */}
        <AIMemoryInput />

        {/* ── Weekly Plan ── */}
        <WeeklyPlanner />

        {/* ── Today's Plan ── */}
        <div className="space-y-4">
          {SECTION_KEYS.map((section, sectionIdx) => {
            const sectionTasks = tasks.filter((t) => t.category === section.id);
            if (sectionTasks.length === 0) return null;

            const Icon = section.icon;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + sectionIdx * 0.1 }}
                className="rounded-2xl border p-4 sm:p-5"
                style={{
                  backgroundColor: `hsl(${section.soft})`,
                  borderColor: `hsl(${section.color} / 0.2)`,
                }}
              >
                {(() => {
                  const done = sectionTasks.filter((t) => t.completed).length;
                  const total = sectionTasks.length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `hsl(${section.color} / 0.12)` }}
                        >
                          <Icon
                            className="w-4 h-4"
                            style={{ color: `hsl(${section.color})` }}
                          />
                        </div>
                        <span
                          className="text-xs font-semibold uppercase tracking-wider flex-1"
                          style={{ color: `hsl(${section.color})` }}
                        >
                          {t(section.labelKey)}
                        </span>
                        <span
                          className="text-[11px] font-medium tabular-nums"
                          style={{ color: `hsl(${section.color})` }}
                        >
                          {done}/{total}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full mb-3 overflow-hidden"
                        style={{ backgroundColor: `hsl(${section.color} / 0.12)` }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: `hsl(${section.color})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </>
                  );
                })()}

                <AnimatePresence>
                  {sectionTasks.map((task) => (
                    <motion.button
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-2 last:mb-0 text-left touch-manipulation",
                        task.completed
                          ? "bg-background/40"
                          : "bg-background/70 hover:bg-background/90"
                      )}
                    >
                      {task.completed ? (
                        <CheckCircle2
                          className="w-5 h-5 shrink-0"
                          style={{ color: `hsl(${section.color})` }}
                        />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                      )}

                      <span
                        className={cn(
                          "flex-1 text-sm sm:text-base",
                          task.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {task.title}
                      </span>

                      {task.estimated_time > 0 && (
                        <span className="text-[11px] text-muted-foreground/60 tabular-nums shrink-0">
                          {task.estimated_time}m
                        </span>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {totalTasks === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-16 text-muted-foreground"
            >
              <p className="text-sm">{t('noPlanYet')}</p>
              <p className="text-xs mt-1">{t('tasksAppearHere')}</p>
            </motion.div>
          )}
        </div>
      </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Dashboard;
