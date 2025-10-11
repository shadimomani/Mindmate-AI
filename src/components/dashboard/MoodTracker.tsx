import { useState } from "react";
import { Smile, Meh, Frown } from "lucide-react";

const moods = [
  { icon: Smile, label: "Great", value: 5 },
  { icon: Smile, label: "Good", value: 4 },
  { icon: Meh, label: "Okay", value: 3 },
  { icon: Meh, label: "Not Great", value: 2 },
  { icon: Frown, label: "Difficult", value: 1 },
];

export const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
      <h3 className="text-xl font-serif font-semibold text-foreground mb-4">How are you feeling?</h3>
      
      <div className="flex justify-between gap-2">
        {moods.map((mood, index) => (
          <button
            key={index}
            onClick={() => setSelectedMood(mood.value)}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-base ${
              selectedMood === mood.value
                ? "bg-accent text-accent-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <mood.icon className="w-6 h-6" />
            <span className="text-xs font-sans">{mood.label}</span>
          </button>
        ))}
      </div>
      
      {selectedMood && (
        <p className="mt-4 text-sm text-muted-foreground font-sans text-center">
          Mood logged for today ✨
        </p>
      )}
    </div>
  );
};
