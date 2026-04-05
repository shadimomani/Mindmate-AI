import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Circle,
  Loader2,
  CalendarDays,
  Target,
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "prompt" | "brain_dump" | "reflection" | "generating" | "plan";

interface WeeklyScheduleTask {
  title: string;
  completed: boolean;
}

interface WeeklyScheduleDay {
  day: string;
  tasks: WeeklyScheduleTask[];
}

interface GeneratedWeeklyScheduleDay {
  day: string;
  tasks: string[];
}

interface WeeklyPlan {
  weekly_schedule: GeneratedWeeklyScheduleDay[];
  task_priorities: string[];
  commitment_score: number;
  feedback_message: string;
  week_start: string;
}

interface SavedPlan {
  id: string;
  week_start: string;
  schedule: WeeklyScheduleDay[];
  task_priorities: string[];
  commitment_score: number;
  feedback_message: string;
  status: string;
}

const DAY_COLORS: Record<string, string> = {
  Monday: "217 72% 60%",
  Tuesday: "152 60% 48%",
  Wednesday: "38 80% 55%",
  Thursday: "280 60% 60%",
  Friday: "217 72% 60%",
  Saturday: "152 60% 48%",
  Sunday: "0 0% 60%",
};

const normalizeWeeklySchedule = (schedule: unknown): WeeklyScheduleDay[] => {
  if (!Array.isArray(schedule)) return [];

  return schedule
    .map((day) => {
      if (!day || typeof day !== "object" || !("day" in day) || typeof day.day !== "string") {
        return null;
      }

      const rawTasks = "tasks" in day && Array.isArray(day.tasks) ? day.tasks : [];
      const tasks = rawTasks
        .map((task) => {
          if (typeof task === "string") {
            return { title: task, completed: false };
          }

          if (task && typeof task === "object" && "title" in task && typeof task.title === "string") {
            return {
              title: task.title,
              completed: "completed" in task ? Boolean(task.completed) : false,
            };
          }

          return null;
        })
        .filter((task): task is WeeklyScheduleTask => task !== null);

      return {
        day: day.day,
        tasks,
      };
    })
    .filter((day): day is WeeklyScheduleDay => day !== null);
};

export const WeeklyPlanner = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("prompt");
  const [brainDump, setBrainDump] = useState("");
  const [reflectionCompletion, setReflectionCompletion] = useState<string>("");
  const [reflectionDifficulty, setReflectionDifficulty] = useState("");
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const isSaturday = new Date().getDay() === 6;
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  // Load existing plan for this week
  useEffect(() => {
    if (!user) return;
    const loadPlan = async () => {
      setLoading(true);
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      if (dayOfWeek === 0) monday.setDate(now.getDate() + 1);
      else if (dayOfWeek === 6) monday.setDate(now.getDate() + 2);
      else monday.setDate(now.getDate() - (dayOfWeek - 1));

      // Use local date to avoid UTC timezone mismatch
      const pad = (n: number) => String(n).padStart(2, "0");
      const weekStartStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;

      // Try current week first, then also check if there's an active plan nearby
      const { data } = await supabase
        .from("weekly_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        // Check if this plan is for the current or upcoming week
        const planStart = new Date(data.week_start + "T00:00:00");
        const planEnd = new Date(planStart);
        planEnd.setDate(planEnd.getDate() + 6); // Saturday

        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (todayMidnight <= planEnd) {
          setSavedPlan({
            id: data.id,
            week_start: data.week_start,
            schedule: normalizeWeeklySchedule(data.schedule),
            task_priorities: (data.task_priorities as any) || [],
            commitment_score: data.commitment_score || 5,
            feedback_message: data.feedback_message || "",
            status: data.status || "active",
          });
          setStep("plan");
        } else if (isSaturday) {
          setStep("prompt");
        }
      } else if (isSaturday) {
        setStep("prompt");
      }
      setLoading(false);
    };
    loadPlan();
  }, [user]);

  const handleGenerate = async () => {
    if (!user || !brainDump.trim()) return;
    setStep("generating");
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-weekly-plan", {
        body: {
          brain_dump: brainDump.trim(),
          reflection_completion: reflectionCompletion || null,
          reflection_difficulty: reflectionDifficulty.trim() || null,
        },
      });

      if (error) throw error;

      const weeklyPlan: WeeklyPlan = data;
      const normalizedSchedule = normalizeWeeklySchedule(weeklyPlan.weekly_schedule);
      setPlan(weeklyPlan);
      setSavedPlan({
        id: "",
        week_start: weeklyPlan.week_start,
        schedule: normalizedSchedule,
        task_priorities: weeklyPlan.task_priorities,
        commitment_score: weeklyPlan.commitment_score,
        feedback_message: weeklyPlan.feedback_message,
        status: "active",
      });
      setStep("plan");

      toast({ title: t("weeklyPlanGenerated"), description: weeklyPlan.feedback_message });
    } catch (error: any) {
      console.error("Weekly plan error:", error);
      toast({
        title: t("error"),
        description: error?.message || "Failed to generate weekly plan",
        variant: "destructive",
      });
      setStep("brain_dump");
    } finally {
      setGenerating(false);
    }
  };

  const toggleScheduledTask = async (dayName: string, taskIndex: number) => {
    if (!user || !savedPlan) return;

    const currentPlan = savedPlan;
    const updatedSchedule = currentPlan.schedule.map((day) =>
      day.day === dayName
        ? {
            ...day,
            tasks: day.tasks.map((task, index) =>
              index === taskIndex ? { ...task, completed: !task.completed } : task
            ),
          }
        : day
    );

    setSavedPlan({ ...currentPlan, schedule: updatedSchedule });

    const { error } = await supabase
      .from("weekly_plans")
      .update({ schedule: updatedSchedule as any })
      .eq("user_id", user.id)
      .eq("week_start", currentPlan.week_start)
      .eq("status", currentPlan.status);

    if (error) {
      setSavedPlan(currentPlan);
      toast({
        title: t("error"),
        description: "Failed to update weekly task",
        variant: "destructive",
      });
    }
  };

  if (loading) return null;

  // If no plan and not Saturday, show a compact "Plan My Week" button
  if (!savedPlan && step === "prompt" && !isSaturday && !expanded) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-accent/5 transition-all shadow-soft text-left"
      >
        <div className="p-2 rounded-xl bg-accent/10">
          <CalendarDays className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{t("planMyWeek")}</p>
          <p className="text-xs text-muted-foreground">{t("planMyWeekDesc")}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.button>
    );
  }

  // Saturday auto-prompt or expanded manual trigger
  if (step === "prompt" && !savedPlan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-accent/20 bg-card p-6 shadow-soft space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">{t("weeklyPlanningTime")}</h3>
            <p className="text-sm text-muted-foreground">{t("weeklyPlanningDesc")}</p>
          </div>
        </div>
        <Button
          onClick={() => setStep("brain_dump")}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {t("startPlanning")}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    );
  }

  // Brain dump step
  if (step === "brain_dump") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <MessageSquareText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">{t("weeklyBrainDump")}</h3>
            <p className="text-sm text-muted-foreground">{t("weeklyBrainDumpDesc")}</p>
          </div>
        </div>

        <Textarea
          value={brainDump}
          onChange={(e) => setBrainDump(e.target.value)}
          placeholder={t("weeklyBrainDumpPlaceholder")}
          className="min-h-[150px] resize-none"
          maxLength={3000}
        />

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setStep("prompt"); setExpanded(false); }} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("back")}
          </Button>
          <Button
            onClick={() => setStep("reflection")}
            disabled={!brainDump.trim()}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {t("next")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Reflection step
  if (step === "reflection") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">{t("weeklyReflection")}</h3>
            <p className="text-sm text-muted-foreground">{t("weeklyReflectionDesc")}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t("didYouCompleteTasks")}</p>
          <div className="flex gap-2">
            {[
              { value: "yes", label: t("reflectionYes") },
              { value: "some", label: t("reflectionSome") },
              { value: "not really", label: t("reflectionNotReally") },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setReflectionCompletion(option.value)}
                className={cn(
                  "flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                  reflectionCompletion === option.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-background text-muted-foreground hover:border-accent/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{t("whatMadeDifficult")}</p>
          <Textarea
            value={reflectionDifficulty}
            onChange={(e) => setReflectionDifficulty(e.target.value)}
            placeholder={t("reflectionDifficultyPlaceholder")}
            className="min-h-[80px] resize-none"
            maxLength={1000}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("brain_dump")} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("back")}
          </Button>
          <Button
            onClick={handleGenerate}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {t("generatePlan")}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Generating step
  if (step === "generating") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-border bg-card p-8 shadow-soft flex flex-col items-center justify-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-accent" />
        </motion.div>
        <p className="text-sm font-medium text-foreground">{t("generatingWeeklyPlan")}</p>
        <p className="text-xs text-muted-foreground text-center">{t("generatingWeeklyPlanDesc")}</p>
      </motion.div>
    );
  }

  // Plan view
  if (step === "plan" && savedPlan) {
    const scheduleData = savedPlan.schedule;
    const totalTasks = scheduleData.reduce((sum, day) => sum + day.tasks.length, 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10">
                <CalendarDays className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-foreground">{t("weeklyPlan")}</h3>
                <p className="text-xs text-muted-foreground">
                  {totalTasks} {t("tasksPlanned")} · {t("commitmentLabel")} {savedPlan.commitment_score}/10
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSavedPlan(null);
                setPlan(null);
                setStep("prompt");
                setExpanded(true);
                setBrainDump("");
                setReflectionCompletion("");
                setReflectionDifficulty("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("replan")}
            </Button>
          </div>

          {/* Feedback message */}
          {savedPlan.feedback_message && (
            <p className="mt-3 text-sm text-muted-foreground italic font-serif">
              "{savedPlan.feedback_message}"
            </p>
          )}
        </div>

        {/* Schedule */}
        <div className="p-4 space-y-3">
          {scheduleData.map((day) => {
            const color = DAY_COLORS[day.day] || "0 0% 50%";
            const isToday = day.day === todayName;

            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-xl border p-3",
                  isToday ? "border-accent/30 bg-accent/5" : "border-border/50 bg-background/50"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: `hsl(${color})` }}
                  >
                    {day.day}
                  </span>
                  {isToday && (
                    <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-md font-medium">
                      {t("today")}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {day.tasks.length} {day.tasks.length === 1 ? "task" : "tasks"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {day.tasks.map((task, idx) => (
                    <button
                      key={`${day.day}-${idx}-${task.title}`}
                      type="button"
                      onClick={() => toggleScheduledTask(day.day, idx)}
                      aria-pressed={task.completed}
                      className={cn(
                        "w-full flex items-start gap-2 text-sm text-left rounded-lg px-1.5 py-1 transition-colors",
                        task.completed ? "bg-accent/5" : "hover:bg-accent/5"
                      )}
                    >
                      {task.completed ? (
                        <CheckCircle2
                          className="w-3.5 h-3.5 shrink-0 mt-0.5"
                          style={{ color: `hsl(${color})` }}
                        />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={cn(
                          "transition-colors",
                          task.completed ? "text-muted-foreground line-through" : "text-foreground/80"
                        )}
                      >
                        {task.title}
                      </span>
                    </button>
                  ))}
                  {day.tasks.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">{t("restDay")}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Priorities */}
        {savedPlan.task_priorities.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("weeklyTopPriorities")}
            </p>
            <div className="space-y-1.5">
              {savedPlan.task_priorities.map((priority, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-foreground/80">{priority}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return null;
};
