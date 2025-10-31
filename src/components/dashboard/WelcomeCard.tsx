import { Sparkles } from "lucide-react";

interface WelcomeCardProps {
  displayName?: string;
}

export const WelcomeCard = ({ displayName }: WelcomeCardProps) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  
  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-border card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-foreground mb-2">
            {greeting}{displayName ? `, ${displayName}` : ""}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-sans">
            Let's make today productive and meaningful
          </p>
        </div>
        <div className="p-2 sm:p-3 bg-accent/10 rounded-full shrink-0">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-5 bg-muted rounded-xl border-l-4 border-accent">
        <p className="text-xs sm:text-sm font-serif italic text-foreground">
          "The secret of getting ahead is getting started. Your future self will thank you for the actions you take today."
        </p>
      </div>
    </div>
  );
};
