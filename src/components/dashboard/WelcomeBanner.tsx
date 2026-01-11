import { useState, useEffect } from "react";
import { X, Lightbulb, CheckCircle2, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "mindmate_welcome_dismissed";

export const WelcomeBanner = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const tips = [
    { icon: CheckCircle2, text: t("tipTasks") },
    { icon: BookOpen, text: t("tipHabits") },
    { icon: MessageCircle, text: t("tipAI") },
  ];

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border shadow-soft animate-in fade-in slide-in-from-top-4 duration-500">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 sm:top-3 sm:right-3 h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
        aria-label="Dismiss welcome banner"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-primary/20 rounded-full shrink-0">
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
            {t("welcomeTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("welcomeSubtitle")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-card/60 rounded-lg border border-border/50"
              >
                <tip.icon className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs sm:text-sm text-foreground">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
