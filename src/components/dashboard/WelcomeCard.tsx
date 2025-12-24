import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const quoteKeys = [
  'quote1', 'quote2', 'quote3', 'quote4', 'quote5', 'quote6',
  'quote7', 'quote8', 'quote9', 'quote10', 'quote11', 'quote12', 'quote13'
];

interface WelcomeCardProps {
  displayName?: string;
}

export const WelcomeCard = ({ displayName }: WelcomeCardProps) => {
  const { t } = useLanguage();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? t('goodMorning') : currentHour < 18 ? t('goodAfternoon') : t('goodEvening');
  
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quoteKeys.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quoteKeys.length);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-border card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-foreground mb-2">
            {greeting}{displayName ? `, ${displayName}` : ""}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-sans">
            {t('makeProductiveDay')}
          </p>
        </div>
        <div className="p-2 sm:p-3 bg-accent/10 rounded-full shrink-0">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-5 bg-muted rounded-xl border-l-4 border-accent">
        <p className="text-xs sm:text-sm font-serif italic text-foreground">
          "{t(quoteKeys[quoteIndex])}"
        </p>
      </div>
    </div>
  );
};