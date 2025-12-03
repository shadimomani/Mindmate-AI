import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format, subDays, startOfDay } from "date-fns";

interface Habit {
  id: string;
  name: string;
  streak: number;
}

interface HabitWithCompletions extends Habit {
  completions: string[]; // Array of completed dates as YYYY-MM-DD strings
}

export const HabitTracker = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitWithCompletions[]>([]);

  const getLast7Days = () => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }
    return days;
  };

  const last7Days = getLast7Days();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!user) return;

    const fetchHabitsWithCompletions = async () => {
      // Fetch habits
      const { data: habitsData } = await supabase
        .from("habits")
        .select("id, name, streak")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!habitsData || habitsData.length === 0) {
        setHabits([]);
        return;
      }

      // Fetch completions for last 7 days
      const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      const { data: completionsData } = await supabase
        .from("habit_completions")
        .select("habit_id, completed_date")
        .eq("user_id", user.id)
        .gte("completed_date", sevenDaysAgo);

      // Map completions to habits
      const habitsWithCompletions: HabitWithCompletions[] = habitsData.map(habit => {
        const habitCompletions = completionsData
          ?.filter(c => c.habit_id === habit.id)
          .map(c => c.completed_date) || [];
        
        return {
          ...habit,
          completions: habitCompletions
        };
      });

      // Calculate and update streaks
      for (const habit of habitsWithCompletions) {
        const newStreak = calculateStreak(habit.completions);
        if (newStreak !== habit.streak) {
          await supabase
            .from("habits")
            .update({ streak: newStreak })
            .eq("id", habit.id);
          habit.streak = newStreak;
        }
      }

      setHabits(habitsWithCompletions);
    };

    fetchHabitsWithCompletions();
  }, [user]);

  const calculateStreak = (completions: string[]): number => {
    if (completions.length === 0) return 0;
    
    const sortedDates = [...completions].sort().reverse();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Streak must include today or yesterday
    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
      return 0;
    }

    let streak = 0;
    let checkDate = sortedDates.includes(todayStr) ? new Date() : subDays(new Date(), 1);
    
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (sortedDates.includes(dateStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const toggleDay = async (habitId: string, dateStr: string) => {
    if (!user) return;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const isCompleted = habit.completions.includes(dateStr);

    if (isCompleted) {
      // Remove completion
      await supabase
        .from("habit_completions")
        .delete()
        .eq("habit_id", habitId)
        .eq("completed_date", dateStr);

      const newCompletions = habit.completions.filter(d => d !== dateStr);
      const newStreak = calculateStreak(newCompletions);

      await supabase
        .from("habits")
        .update({ streak: newStreak })
        .eq("id", habitId);

      setHabits(habits.map(h =>
        h.id === habitId
          ? { ...h, completions: newCompletions, streak: newStreak }
          : h
      ));
    } else {
      // Add completion
      await supabase
        .from("habit_completions")
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_date: dateStr
        });

      const newCompletions = [...habit.completions, dateStr];
      const newStreak = calculateStreak(newCompletions);

      await supabase
        .from("habits")
        .update({ streak: newStreak })
        .eq("id", habitId);

      setHabits(habits.map(h =>
        h.id === habitId
          ? { ...h, completions: newCompletions, streak: newStreak }
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
              {last7Days.map((dateStr, i) => {
                const isCompleted = habit.completions.includes(dateStr);
                const isToday = dateStr === today;
                return (
                  <button
                    key={dateStr}
                    onClick={() => toggleDay(habit.id, dateStr)}
                    className={`h-8 flex-1 rounded transition-base ${
                      isCompleted ? "bg-accent" : "bg-muted"
                    } flex items-center justify-center cursor-pointer hover:opacity-80 ${
                      isToday ? "ring-2 ring-primary ring-offset-1" : ""
                    }`}
                    title={format(new Date(dateStr), 'EEE, MMM d')}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-accent-foreground" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
