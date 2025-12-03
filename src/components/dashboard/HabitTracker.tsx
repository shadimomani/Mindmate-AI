import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed_today: boolean;
  last_completed_at: string | null;
}

const isToday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isYesterday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

export const HabitTracker = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchAndResetHabits = async () => {
      const { data } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        const processedHabits = await Promise.all(
          data.map(async (habit) => {
            const lastCompletedToday = isToday(habit.last_completed_at);
            const lastCompletedYesterday = isYesterday(habit.last_completed_at);
            
            if (habit.completed_today && !lastCompletedToday) {
              const newStreak = lastCompletedYesterday ? habit.streak : 0;
              
              await supabase
                .from("habits")
                .update({ 
                  completed_today: false,
                  streak: newStreak
                })
                .eq("id", habit.id);

              return { ...habit, completed_today: false, streak: newStreak };
            }
            
            if (!lastCompletedToday && !lastCompletedYesterday && habit.streak > 0) {
              await supabase
                .from("habits")
                .update({ streak: 0 })
                .eq("id", habit.id);
              
              return { ...habit, streak: 0 };
            }

            return habit;
          })
        );

        setHabits(processedHabits);
      }
    };

    fetchAndResetHabits();
  }, [user]);

  const toggleHabit = async (habitId: string, currentStatus: boolean) => {
    if (!user) return;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newCompleted = !currentStatus;
    const newStreak = newCompleted 
      ? habit.streak + 1 
      : Math.max(0, habit.streak - 1);

    const { error } = await supabase
      .from("habits")
      .update({ 
        completed_today: newCompleted,
        last_completed_at: newCompleted ? new Date().toISOString() : habit.last_completed_at,
        streak: newStreak
      })
      .eq("id", habitId);

    if (!error) {
      setHabits(habits.map(h => 
        h.id === habitId 
          ? { ...h, completed_today: newCompleted, streak: newStreak }
          : h
      ));
    }
  };

  if (habits.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Habit Tracker</h3>
        <p className="text-muted-foreground text-center py-8">No habits yet. Add your first habit to start tracking!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
      <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Habit Tracker</h3>
      
      <div className="space-y-4">
        {habits.map((habit) => (
          <div key={habit.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-foreground">{habit.name}</span>
              <span className="text-sm text-muted-foreground">{habit.streak} day streak</span>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => i === 6 && toggleHabit(habit.id, habit.completed_today)}
                  className={`h-8 flex-1 rounded transition-base ${
                    i < (habit.completed_today ? 7 : 6)
                      ? "bg-accent"
                      : "bg-muted"
                  } flex items-center justify-center ${i === 6 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  {i < (habit.completed_today ? 7 : 6) && <Check className="w-4 h-4 text-accent-foreground" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
