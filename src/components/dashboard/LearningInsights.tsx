import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useBehaviorInsights, useLearningProfile } from "@/hooks/useLearningSystem";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

const translations = {
  en: {
    title: "AI Learning Insights",
    subtitle: "How the AI adapts to your patterns",
    loading: "Analyzing your patterns...",
    noData: "Complete more tasks to see AI insights",
    signals: {
      overplanning_detected: "Overplanning Detected",
      undercommitment_detected: "Undercommitment Detected",
      motivation_drop_pattern: "Motivation Drop Pattern",
      consistent_time_failure: "Time Pattern Issues",
      task_complexity_too_high: "Tasks Too Complex",
      optimistic_bias: "Optimistic Bias",
    },
    signalDescriptions: {
      overplanning_detected: "You tend to plan more tasks than you can complete. AI will suggest fewer tasks.",
      undercommitment_detected: "You're completing all tasks easily. Consider more challenging goals.",
      motivation_drop_pattern: "Your completion rate has been declining. AI will use more encouraging tone.",
      consistent_time_failure: "Certain hours show lower productivity. AI will avoid those times.",
      task_complexity_too_high: "Tasks are often too complex. AI will suggest breaking them down.",
      optimistic_bias: "Predictions have been too optimistic. AI will calibrate more conservatively.",
    },
    metrics: {
      avgCompletion: "Average Completion Rate",
      avgAccuracy: "Prediction Accuracy",
      totalInteractions: "Total Interactions Analyzed",
      recommendedTasks: "Recommended Daily Tasks",
    },
    productivity: {
      peakHours: "Peak Productivity Hours",
      lowHours: "Low Productivity Hours",
      noPattern: "Not enough data",
    },
    adaptations: {
      title: "AI Adaptations",
      tone: "Communication Tone",
      structure: "Plan Structure",
      complexity: "Task Complexity",
    },
  },
  ar: {
    title: "رؤى تعلم الذكاء الاصطناعي",
    subtitle: "كيف يتكيف الذكاء الاصطناعي مع أنماطك",
    loading: "جاري تحليل أنماطك...",
    noData: "أكمل المزيد من المهام لرؤية رؤى الذكاء الاصطناعي",
    signals: {
      overplanning_detected: "تم اكتشاف الإفراط في التخطيط",
      undercommitment_detected: "تم اكتشاف قلة الالتزام",
      motivation_drop_pattern: "نمط انخفاض الدافع",
      consistent_time_failure: "مشاكل في نمط الوقت",
      task_complexity_too_high: "المهام معقدة جداً",
      optimistic_bias: "تحيز متفائل",
    },
    signalDescriptions: {
      overplanning_detected: "تميل إلى تخطيط مهام أكثر مما يمكنك إكماله. سيقترح الذكاء الاصطناعي مهام أقل.",
      undercommitment_detected: "أنت تكمل جميع المهام بسهولة. فكر في أهداف أكثر تحدياً.",
      motivation_drop_pattern: "معدل إكمالك في انخفاض. سيستخدم الذكاء الاصطناعي نبرة أكثر تشجيعاً.",
      consistent_time_failure: "بعض الساعات تظهر إنتاجية أقل. سيتجنب الذكاء الاصطناعي تلك الأوقات.",
      task_complexity_too_high: "المهام معقدة جداً. سيقترح الذكاء الاصطناعي تقسيمها.",
      optimistic_bias: "التوقعات كانت متفائلة جداً. سيعايرها الذكاء الاصطناعي بشكل أكثر تحفظاً.",
    },
    metrics: {
      avgCompletion: "متوسط معدل الإكمال",
      avgAccuracy: "دقة التوقعات",
      totalInteractions: "إجمالي التفاعلات المحللة",
      recommendedTasks: "المهام اليومية الموصى بها",
    },
    productivity: {
      peakHours: "ساعات الذروة الإنتاجية",
      lowHours: "ساعات الإنتاجية المنخفضة",
      noPattern: "لا توجد بيانات كافية",
    },
    adaptations: {
      title: "تكيفات الذكاء الاصطناعي",
      tone: "نبرة التواصل",
      structure: "هيكل الخطة",
      complexity: "تعقيد المهام",
    },
  },
};

const signalIcons: Record<string, React.ReactNode> = {
  overplanning_detected: <TrendingDown className="h-4 w-4" />,
  undercommitment_detected: <TrendingUp className="h-4 w-4" />,
  motivation_drop_pattern: <AlertTriangle className="h-4 w-4" />,
  consistent_time_failure: <Clock className="h-4 w-4" />,
  task_complexity_too_high: <Target className="h-4 w-4" />,
  optimistic_bias: <Brain className="h-4 w-4" />,
};

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function LearningInsights() {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === "ar";

  const { data: profile, isLoading: profileLoading } = useLearningProfile();
  const { isLoading: insightsLoading } = useBehaviorInsights();

  const isLoading = profileLoading || insightsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">{t.loading}</span>
        </CardContent>
      </Card>
    );
  }

  if (!profile || profile.total_interactions < 3) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">{t.noData}</p>
        </CardContent>
      </Card>
    );
  }

  const activeSignals = Object.entries({
    overplanning_detected: profile.overplanning_detected,
    undercommitment_detected: profile.undercommitment_detected,
    motivation_drop_pattern: profile.motivation_drop_pattern,
    consistent_time_failure: profile.consistent_time_failure,
    task_complexity_too_high: profile.task_complexity_too_high,
    optimistic_bias: profile.optimistic_bias,
  }).filter(([_, value]) => value);

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/50 rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground mb-1">{t.metrics.avgCompletion}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{profile.avg_completion_rate?.toFixed(0) || 0}%</span>
                <Progress value={profile.avg_completion_rate || 0} className="flex-1 h-2" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-muted/50 rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground mb-1">{t.metrics.avgAccuracy}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{profile.avg_commitment_accuracy?.toFixed(0) || 0}%</span>
                <Progress value={profile.avg_commitment_accuracy || 0} className="flex-1 h-2" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-muted/50 rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground mb-1">{t.metrics.totalInteractions}</p>
              <span className="text-2xl font-bold">{profile.total_interactions}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-muted/50 rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground mb-1">{t.metrics.recommendedTasks}</p>
              <span className="text-2xl font-bold">{profile.recommended_daily_tasks}</span>
            </motion.div>
          </div>

          {/* Detected Learning Signals */}
          {activeSignals.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {language === "en" ? "Detected Patterns" : "الأنماط المكتشفة"}
              </h3>
              <div className="space-y-2">
                {activeSignals.map(([signal]) => (
                  <motion.div
                    key={signal}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                  >
                    <div className="text-amber-500 mt-0.5">
                      {signalIcons[signal]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {t.signals[signal as keyof typeof t.signals]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.signalDescriptions[signal as keyof typeof t.signalDescriptions]}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Active Adaptations */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t.adaptations.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                {t.adaptations.tone}: {profile.recommended_tone}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                {t.adaptations.structure}: {profile.recommended_structure}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                {t.adaptations.complexity}: {profile.optimal_task_complexity}
              </Badge>
            </div>
          </div>

          {/* Productivity Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-500" />
                {t.productivity.peakHours}
              </h4>
              <div className="flex flex-wrap gap-1">
                {profile.peak_productivity_hours && profile.peak_productivity_hours.length > 0 ? (
                  profile.peak_productivity_hours.map((hour: number) => (
                    <Badge key={hour} variant="outline" className="bg-green-500/20">
                      {formatHour(hour)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">{t.productivity.noPattern}</span>
                )}
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-red-500" />
                {t.productivity.lowHours}
              </h4>
              <div className="flex flex-wrap gap-1">
                {profile.low_productivity_hours && profile.low_productivity_hours.length > 0 ? (
                  profile.low_productivity_hours.map((hour: number) => (
                    <Badge key={hour} variant="outline" className="bg-red-500/20">
                      {formatHour(hour)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">{t.productivity.noPattern}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
