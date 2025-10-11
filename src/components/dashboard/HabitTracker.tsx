import { Check } from "lucide-react";

const habits = [
  { name: "Morning Meditation", streak: 7, completed: true },
  { name: "Exercise", streak: 5, completed: true },
  { name: "Read 30 min", streak: 12, completed: false },
  { name: "Gratitude Journal", streak: 3, completed: false },
];

export const HabitTracker = () => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
      <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Habit Tracker</h3>
      
      <div className="space-y-4">
        {habits.map((habit, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-foreground">{habit.name}</span>
              <span className="text-sm text-muted-foreground">{habit.streak} day streak</span>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`h-8 flex-1 rounded transition-base ${
                    i < (habit.completed ? 7 : 6)
                      ? "bg-accent"
                      : "bg-muted"
                  } flex items-center justify-center`}
                >
                  {i < (habit.completed ? 7 : 6) && <Check className="w-4 h-4 text-accent-foreground" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
