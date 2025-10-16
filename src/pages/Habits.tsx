import { DashboardLayout } from "@/components/DashboardLayout";
import { HabitTracker } from "@/components/dashboard/HabitTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Habits = () => {
  const [newHabit, setNewHabit] = useState("");
  const [stats, setStats] = useState({
    maxStreak: 0,
    completionRate: 0,
    activeHabits: 0,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      if (habits) {
        const maxStreak = Math.max(...habits.map(h => h.streak), 0);
        const completedToday = habits.filter(h => h.completed_today).length;
        const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

        setStats({
          maxStreak,
          completionRate,
          activeHabits: habits.length,
        });
      }
    };

    fetchStats();
  }, [user]);

  const handleAddHabit = async () => {
    if (!user || !newHabit.trim()) return;

    const { error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        name: newHabit,
        streak: 0,
        completed_today: false,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add habit",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Habit added successfully",
      });
      setNewHabit("");
      // Refresh stats
      const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      if (habits) {
        setStats({
          maxStreak: Math.max(...habits.map(h => h.streak), 0),
          completionRate: habits.length > 0 ? Math.round((habits.filter(h => h.completed_today).length / habits.length) * 100) : 0,
          activeHabits: habits.length,
        });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Habit Tracker</h1>
            <p className="text-muted-foreground">Build lasting positive habits</p>
          </div>
          <Heart className="w-8 h-8 text-accent" />
        </div>

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Add New Habit</h2>
          <div className="flex gap-2">
            <Input
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="What habit do you want to build?"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
            />
            <Button 
              onClick={handleAddHabit}
              disabled={!newHabit.trim()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <HabitTracker />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border text-center">
            <p className="text-4xl font-bold text-accent mb-2">{stats.maxStreak}</p>
            <p className="text-sm text-muted-foreground">Max Streak</p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border text-center">
            <p className="text-4xl font-bold text-accent mb-2">{stats.completionRate}%</p>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border text-center">
            <p className="text-4xl font-bold text-accent mb-2">{stats.activeHabits}</p>
            <p className="text-sm text-muted-foreground">Active Habits</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Habits;
