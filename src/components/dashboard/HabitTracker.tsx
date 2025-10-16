import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed_today: boolean;
}

export const HabitTracker = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchHabits = async () => {
      const { data } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setHabits(data);
      }
    };

    fetchHabits();
  }, [user]);

  const toggleHabit = async (habitId: string, currentStatus: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from("habits")
      .update({ 
        completed_today: !currentStatus,
        last_completed_at: !currentStatus ? new Date().toISOString() : null,
        streak: !currentStatus ? habits.find(h => h.id === habitId)!.streak + 1 : Math.max(0, habits.find(h => h.id === habitId)!.streak - 1)
      })
      .eq("id", habitId);

    if (!error) {
      setHabits(habits.map(h => 
        h.id === habitId 
          ? { ...h, completed_today: !currentStatus, streak: !currentStatus ? h.streak + 1 : Math.max(0, h.streak - 1) }
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
