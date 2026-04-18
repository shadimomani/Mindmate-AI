import { useState } from "react";
import { Check, X, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { startOfWeek, format } from "date-fns";

export interface WeeklyPlanProposalData {
  summary: string;
  days: { day: string; tasks: string[] }[];
}

interface Props {
  plan: WeeklyPlanProposalData;
}

type Status = "idle" | "saving" | "accepted" | "declined";

export const WeeklyPlanProposal = ({ plan }: Props) => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("idle");

  const handleAccept = async () => {
    if (!user) return;
    setStatus("saving");
    try {
      const weekStart = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );

      const schedule = plan.days.map((d) => ({
        day: d.day,
        tasks: (d.tasks || []).map((t) => ({ title: t, completed: false })),
      }));

      const brainDump = `AI-generated plan: ${plan.summary}`;

      const { error } = await supabase.from("weekly_plans").insert({
        user_id: user.id,
        week_start: weekStart,
        brain_dump: brainDump,
        schedule,
        status: "active",
      });

      if (error) throw error;

      setStatus("accepted");
      toast({
        description: isRTL
          ? "✅ تم حفظ خطتك الأسبوعية"
          : "✅ Your weekly plan has been saved",
      });
    } catch (err) {
      console.error("Error saving weekly plan:", err);
      setStatus("idle");
      toast({
        variant: "destructive",
        description: isRTL ? "تعذر حفظ الخطة" : "Failed to save plan",
      });
    }
  };

  const handleDecline = () => {
    setStatus("declined");
  };

  return (
    <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-accent" />
        <p className="text-xs font-semibold text-foreground">
          {isRTL ? "اقتراح خطة أسبوعية" : "Weekly Plan Proposal"}
        </p>
      </div>

      {plan.summary && (
        <p className="text-xs text-muted-foreground italic">{plan.summary}</p>
      )}

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {plan.days.map((d) => (
          <div key={d.day} className="text-xs">
            <p className="font-semibold text-foreground">{d.day}</p>
            {d.tasks?.length ? (
              <ul className={`${isRTL ? "mr-3" : "ml-3"} list-disc text-muted-foreground space-y-0.5`}>
                {d.tasks.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : (
              <p className={`${isRTL ? "mr-3" : "ml-3"} text-muted-foreground/60`}>
                {isRTL ? "يوم خفيف" : "Light day"}
              </p>
            )}
          </div>
        ))}
      </div>

      {status === "accepted" ? (
        <div className="flex items-center gap-2 text-xs text-accent font-medium">
          <Check className="w-3.5 h-3.5" />
          {isRTL ? "تم اعتماد الخطة" : "Plan accepted"}
        </div>
      ) : status === "declined" ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <X className="w-3.5 h-3.5" />
          {isRTL ? "تم رفض الخطة" : "Plan declined"}
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={status === "saving"}
            className="flex-1 h-8 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {status === "saving" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                {isRTL ? "نعم، اعتمدها" : "Yes, use it"}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={status === "saving"}
            className="flex-1 h-8 text-xs"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            {isRTL ? "لا، شكراً" : "No, thanks"}
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Parses an AI message and extracts a weekly plan proposal if present.
 * Returns the cleaned text (without the marker block) and the parsed plan.
 */
export function parseWeeklyPlan(text: string): {
  cleanText: string;
  plan: WeeklyPlanProposalData | null;
} {
  const match = text.match(/\[\[WEEKLY_PLAN\]\]([\s\S]*?)\[\[\/WEEKLY_PLAN\]\]/);
  if (!match) return { cleanText: text, plan: null };

  const cleanText = text.replace(match[0], "").trim();
  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed && Array.isArray(parsed.days)) {
      return { cleanText, plan: parsed as WeeklyPlanProposalData };
    }
  } catch (e) {
    console.error("Failed to parse weekly plan JSON:", e);
  }
  return { cleanText, plan: null };
}
