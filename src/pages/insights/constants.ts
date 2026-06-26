import {
  AlertTriangle,
  Brain,
  Briefcase,
  Clock,
  Coffee,
  Heart,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export type Domain = "work" | "personal" | "leisure";

export const DOMAIN_META: Record<
  Domain,
  { label: { en: string; ar: string }; icon: typeof Briefcase; varName: string }
> = {
  work: { label: { en: "Work", ar: "العمل" }, icon: Briefcase, varName: "--section-work" },
  personal: { label: { en: "Life", ar: "الحياة" }, icon: Heart, varName: "--section-personal" },
  leisure: { label: { en: "Balance", ar: "التوازن" }, icon: Coffee, varName: "--section-leisure" },
};

export const SIGNAL_COPY: Record<
  string,
  { en: { t: string; d: string }; ar: { t: string; d: string }; icon: typeof Brain }
> = {
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

export function formatHour(h: number, lang: "en" | "ar") {
  if (lang === "ar") return `${h}:00`;
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}
