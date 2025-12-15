import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

const quotes = [
  // Success
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Success usually comes to those who are too busy to be looking for it.",
  // Discipline
  "Discipline is the bridge between goals and accomplishment.",
  "With self-discipline, most anything is possible.",
  "The pain of discipline is nothing like the pain of disappointment.",
  // Goals
  "A goal without a plan is just a wish.",
  "Set your goals high, and don't stop till you get there.",
  "The future belongs to those who believe in the beauty of their dreams.",
  // God
  "Trust in the Lord with all your heart and lean not on your own understanding.",
  "I can do all things through Christ who strengthens me.",
  "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.",
  "Commit your work to the Lord, and your plans will be established.",
];

interface WelcomeCardProps {
  displayName?: string;
}

export const WelcomeCard = ({ displayName }: WelcomeCardProps) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
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
            Let's make today productive and meaningful
          </p>
        </div>
        <div className="p-2 sm:p-3 bg-accent/10 rounded-full shrink-0">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-5 bg-muted rounded-xl border-l-4 border-accent">
        <p className="text-xs sm:text-sm font-serif italic text-foreground">
          "{quotes[quoteIndex]}"
        </p>
      </div>
    </div>
  );
};
