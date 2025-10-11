import { Sparkles } from "lucide-react";

export const WelcomeCard = () => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  
  return (
    <div className="bg-card rounded-2xl p-8 shadow-soft border border-border card-hover">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
            {greeting}, Sarah
          </h2>
          <p className="text-muted-foreground font-sans">
            Let's make today productive and meaningful
          </p>
        </div>
        <div className="p-3 bg-accent/10 rounded-full">
          <Sparkles className="w-6 h-6 text-accent" />
        </div>
      </div>

      <div className="mt-6 p-5 bg-muted rounded-xl border-l-4 border-accent">
        <p className="text-sm font-serif italic text-foreground">
          "The secret of getting ahead is getting started. Your future self will thank you for the actions you take today."
        </p>
      </div>
    </div>
  );
};
