import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useLearningProfile } from "@/hooks/useLearningSystem";
import { subDays, format, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import {
  Flame,
  Sparkles,
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  Briefcase,
  Heart,
  Coffee,
  Loader2,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { ParticleNetwork } from "@/components/three/ParticleNetwork";
import { AIOrb } from "@/components/three/AIOrb";
import { cn } from "@/lib/utils";

type Domain = "work" | "personal" | "leisure";

interface TaskRow {
  completed: boolean;
  created_at: string;
  category: string | null;
}

const DOMAIN_META: Record<
  Domain,
  { label: { en: string; ar: string }; icon: typeof Briefcase; varName: string }
> = {
  work: { label: { en: "Work", ar: "العمل" }, icon: Briefcase, varName: "--section-work" },
  personal: { label: { en: "Life", ar: "الحياة" }, icon: Heart, varName: "--section-personal" },
  leisure: { label: { en: "Balance", ar: "التوازن" }, icon: Coffee, varName: "--section-leisure" },
};

const SIGNAL_COPY: Record<string, { en: { t: string; d: string }; ar: { t: string; d: string }; icon: typeof Brain }> = {
  overplanning_detected: {
    en: { t: "Overplanning", d: "You plan more than you finish. AI will suggest fewer tasks." },
    ar: { t: "إفراط في التخطيط", d: "تخطط لأكثر مما تنجز. سيقترح الذكاء مهامًا أقل." },
    icon: TrendingDown,
  },
  undercommitment_detected: {
    en: { t: "Room to grow", d: "You're finishing everything easily — try a stretch goal." },
    ar: { t: "مساحة للنمو", d: "تنجز كل شيء بسهولة — جرّب هدفًا أكبر." },
    icon: TrendingUp,
  },
  motivation_drop_pattern: {
    en: { t: "Gentle dip", d: "Completion is dipping. AI will use a softer tone." },
    ar: { t: "انخفاض لطيف", d: "الإنجاز يتراجع. سيستخدم الذكاء نبرة ألطف." },
    icon: AlertTriangle,
  },
  consistent_time_failure: {
    en: { t: "Time mismatch", d: "Some hours are tougher. AI will avoid them." },
    ar: { t: "أوقات صعبة", d: "بعض الساعات أصعب. سيتجنبها الذكاء." },
    icon: Clock,
  },
  task_complexity_too_high: {
    en: { t: "Too complex", d: "Tasks are heavy. AI will break them down." },
    ar: { t: "معقد جدًا", d: "المهام ثقيلة. سيقوم الذكاء بتقسيمها." },
    icon: Target,
  },
  optimistic_bias: {
    en: { t: "Optimistic bias", d: "Predictions are too rosy. AI will calibrate." },
    ar: { t: "تفاؤل زائد", d: "التوقعات متفائلة. سيعايرها الذكاء." },
    icon: Brain,
  },
};

function formatHour(h: number, lang: "en" | "ar") {
  if (lang === "ar") return `${h}:00`;
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

const Insights = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isRTL = language === "ar";
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: profile, isLoading: profileLoading } = useLearningProfile();

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const weekStart = subDays(startOfDay(new Date()), 6);
      const { data } = await supabase
        .from("tasks")
        .select("completed, created_at, category")
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString());
      setTasks(data || []);
      setLoading(false);
    })();
  }, [user]);

  const days = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayTasks = tasks.filter(
        (tk) => format(new Date(tk.created_at), "yyyy-MM-dd") === dateStr
      );
      const completed = dayTasks.filter((tk) => tk.completed).length;
      const total = dayTasks.length;
      return {
        label: format(d, "EEE"),
        dateStr,
        completed,
        total,
        rate: total ? completed / total : 0,
        isToday: dateStr === todayStr,
      };
    });
  }, [tasks]);

  const totalCompleted = days.reduce((s, d) => s + d.completed, 0);
  const activeDays = days.filter((d) => d.completed > 0).length;
  const streak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].completed > 0) s++;
      else break;
    }
    return s;
  })();

  const domainBreakdown = useMemo(() => {
    return (Object.keys(DOMAIN_META) as Domain[]).map((d) => {
      const list = tasks.filter((tk) => (tk.category || "work") === d);
      const completed = list.filter((tk) => tk.completed).length;
      return { domain: d, completed, total: list.length };
    });
  }, [tasks]);

  const maxDayCompleted = Math.max(1, ...days.map((d) => d.completed));

  const activeSignals = profile
    ? Object.entries({
        overplanning_detected: profile.overplanning_detected,
        undercommitment_detected: profile.undercommitment_detected,
        motivation_drop_pattern: profile.motivation_drop_pattern,
        consistent_time_failure: profile.consistent_time_failure,
        task_complexity_too_high: profile.task_complexity_too_high,
        optimistic_bias: profile.optimistic_bias,
      }).filter(([, v]) => v)
    : [];

  const headline = (() => {
    if (totalCompleted === 0) return language === "ar" ? "أسبوع جديد ينتظرك ✨" : "A fresh week awaits ✨";
    if (activeDays >= 6) return language === "ar" ? "اتساق رائع هذا الأسبوع 🔥" : "Incredible consistency 🔥";
    if (activeDays >= 4) return language === "ar" ? "أسبوع قوي" : "A strong week";
    if (activeDays >= 2) return language === "ar" ? "لقد ظهرت — هذا يهم" : "You showed up — that matters";
    return language === "ar" ? "حتى يوم واحد يحسب" : "Even one day counts";
  })();

  return (
    <DashboardLayout>
      <SEO
        path="/insights"
        title="Your Productivity Insights — MindMate"
        description="Track streaks, completion rates, and domain balance across Work, Life, and Balance with MindMate's productivity insights."
      />
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="max-w-2xl mx-auto px-1 sm:px-0 space-y-6 pb-12 animate-in fade-in duration-500"
      >
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-border"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--section-work)/0.18) 0%, hsl(var(--section-personal)/0.18) 50%, hsl(var(--section-leisure)/0.18) 100%)",
          }}
        >
          <ParticleNetwork className="opacity-60" />
          <div className="pointer-events-none absolute -top-10 -right-6 hidden sm:block opacity-80">
            <AIOrb size={180} />
          </div>
          <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {t("yourWeek")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {headline}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("consistencyOverPerfection")}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {streak > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded-full px-3 py-1.5 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5" />
                {streak} {t("dayStreak")}
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 bg-background/60 backdrop-blur rounded-full px-3 py-1.5 text-xs font-medium border border-border">
              {totalCompleted} {language === "ar" ? "مهمة منجزة" : "completed"}
            </div>
            <div className="inline-flex items-center gap-1.5 bg-background/60 backdrop-blur rounded-full px-3 py-1.5 text-xs font-medium border border-border">
              {activeDays}/7 {language === "ar" ? "أيام نشطة" : "active days"}
            </div>
          </div>
        </motion.div>

        {/* Weekly streak bars */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-soft"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
            {t("thisWeek")}
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-40">
              {days.map((day, i) => {
                const heightPct = (day.completed / maxDayCompleted) * 100;
                return (
                  <motion.div
                    key={day.dateStr}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
                    style={{ transformOrigin: "bottom" }}
                    className="flex-1 flex flex-col items-center gap-2 h-full"
                  >
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-colors",
                          day.completed > 0
                            ? day.isToday
                              ? "bg-gradient-to-t from-orange-500 to-orange-300"
                              : "bg-gradient-to-t from-primary to-primary/60"
                            : "bg-muted"
                        )}
                        style={{
                          height: `${day.completed > 0 ? Math.max(heightPct, 8) : 4}%`,
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <div
                        className={cn(
                          "text-xs font-bold",
                          day.isToday ? "text-orange-500" : "text-foreground"
                        )}
                      >
                        {day.completed}
                      </div>
                      <div
                        className={cn(
                          "text-[10px] uppercase tracking-wider",
                          day.isToday ? "text-orange-500 font-semibold" : "text-muted-foreground"
                        )}
                      >
                        {day.label}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Domain breakdown */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {language === "ar" ? "حسب المجال" : "By domain"}
            </p>
            {domainBreakdown.map(({ domain, completed, total }) => {
              const meta = DOMAIN_META[domain];
              const Icon = meta.icon;
              const pct = total ? (completed / total) * 100 : 0;
              return (
                <div key={domain} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `hsl(var(${meta.varName}) / 0.15)` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: `hsl(var(${meta.varName}))` }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">{meta.label[language]}</span>
                      <span className="text-muted-foreground">
                        {completed}/{total}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: `hsl(var(${meta.varName}))` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* AI Learning Insights */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-border overflow-hidden"
        >
          <div
            className="p-5 sm:p-6"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)/0.12), hsl(var(--accent)/0.12))",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-foreground">
                  {language === "ar" ? "ما تعلمه الذكاء عنك" : "What AI learned about you"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "يتحدث يوميًا" : "Updated daily"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card p-5 sm:p-6 space-y-5">
            {profileLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !profile || (profile.total_interactions ?? 0) < 3 ? (
              <div className="text-center py-8">
                <Brain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {language === "ar"
                    ? "أكمل المزيد من المهام لتظهر الرؤى هنا"
                    : "Complete a few more days to unlock AI insights"}
                </p>
              </div>
            ) : (
              <>
                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-3">
                  <StatTile
                    label={language === "ar" ? "معدل الإكمال" : "Completion rate"}
                    value={`${Math.round(profile.avg_completion_rate || 0)}%`}
                    color="primary"
                  />
                  <StatTile
                    label={language === "ar" ? "دقة التوقع" : "Prediction accuracy"}
                    value={`${Math.round(profile.avg_commitment_accuracy || 0)}%`}
                    color="accent"
                  />
                  <StatTile
                    label={language === "ar" ? "موصى يوميًا" : "Recommended daily"}
                    value={`${profile.recommended_daily_tasks ?? 5}`}
                    color="work"
                  />
                  <StatTile
                    label={language === "ar" ? "تفاعلات" : "Interactions"}
                    value={`${profile.total_interactions ?? 0}`}
                    color="leisure"
                  />
                </div>

                {/* Detected patterns */}
                {activeSignals.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {language === "ar" ? "أنماط مكتشفة" : "Detected patterns"}
                    </p>
                    <div className="space-y-2">
                      {activeSignals.map(([key]) => {
                        const copy = SIGNAL_COPY[key];
                        if (!copy) return null;
                        const Icon = copy.icon;
                        return (
                          <div
                            key={key}
                            className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {copy[language].t}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {copy[language].d}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Productivity hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <HoursTile
                    title={language === "ar" ? "أفضل ساعاتك" : "Peak hours"}
                    hours={(profile.peak_productivity_hours as number[]) || []}
                    tone="green"
                    lang={language}
                  />
                  <HoursTile
                    title={language === "ar" ? "ساعات أبطأ" : "Slower hours"}
                    hours={(profile.low_productivity_hours as number[]) || []}
                    tone="red"
                    lang={language}
                  />
                </div>

                {/* Adaptations */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {language === "ar" ? "تكيفات نشطة" : "Active adaptations"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Chip>{language === "ar" ? "النبرة" : "Tone"}: {profile.recommended_tone}</Chip>
                    <Chip>{language === "ar" ? "الهيكل" : "Structure"}: {profile.recommended_structure}</Chip>
                    <Chip>{language === "ar" ? "التعقيد" : "Complexity"}: {profile.optimal_task_complexity}</Chip>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.section>
      </div>
    </DashboardLayout>
  );
};

function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "primary" | "accent" | "work" | "leisure";
}) {
  const colorMap: Record<string, string> = {
    primary: "var(--primary)",
    accent: "var(--accent)",
    work: "var(--section-work)",
    leisure: "var(--section-leisure)",
  };
  const v = colorMap[color];
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background: `hsl(${v} / 0.08)`,
        borderColor: `hsl(${v} / 0.2)`,
      }}
    >
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: `hsl(${v})` }}>
        {value}
      </p>
    </div>
  );
}

function HoursTile({
  title,
  hours,
  tone,
  lang,
}: {
  title: string;
  hours: number[];
  tone: "green" | "red";
  lang: "en" | "ar";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
      : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400";
  return (
    <div className={cn("rounded-2xl p-4 border", toneClass)}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      {hours.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {hours.map((h) => (
            <span
              key={h}
              className="text-xs font-medium px-2 py-0.5 rounded-md bg-background/60"
            >
              {formatHour(h, lang)}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs opacity-70">
          {lang === "ar" ? "لا توجد بيانات كافية" : "Not enough data yet"}
        </p>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-foreground border border-border">
      {children}
    </span>
  );
}

export default Insights;
