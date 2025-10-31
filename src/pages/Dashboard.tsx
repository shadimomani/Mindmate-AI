import { DashboardLayout } from "@/components/DashboardLayout";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TaskList } from "@/components/dashboard/TaskList";
import { HabitTracker } from "@/components/dashboard/HabitTracker";
import { MoodTracker } from "@/components/dashboard/MoodTracker";
import { ReflectionCard } from "@/components/dashboard/ReflectionCard";
import { CheckCircle2, Flame, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [stats, setStats] = useState({
    tasksCompletedToday: 0,
    currentStreak: 0,
    habitsThisWeek: { completed: 0, total: 0 },
    productivity: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Tasks completed today
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", today.toISOString());

      // Current streak from habits
      const { data: habits } = await supabase
        .from("habits")
        .select("streak")
        .eq("user_id", user.id)
        .order("streak", { ascending: false })
        .limit(1);

      // Habits this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: allHabits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      const completedThisWeek = allHabits?.filter(h => h.completed_today).length || 0;
      const totalHabits = allHabits?.length || 0;

      // Calculate productivity
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      const completedTasks = allTasks?.filter(t => t.completed).length || 0;
      const totalTasks = allTasks?.length || 1;
      const productivity = Math.round((completedTasks / totalTasks) * 100);

      setStats({
        tasksCompletedToday: tasks?.length || 0,
        currentStreak: habits?.[0]?.streak || 0,
        habitsThisWeek: { completed: completedThisWeek, total: totalHabits },
        productivity,
      });
    };

    fetchStats();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
        <WelcomeCard displayName={displayName} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatsCard
            title="Tasks Completed"
            value={stats.tasksCompletedToday}
            subtitle="Today"
            icon={CheckCircle2}
            trend="up"
          />
          <StatsCard
            title="Current Streak"
            value={stats.currentStreak}
            subtitle="Days"
            icon={Flame}
            trend={stats.currentStreak > 0 ? "up" : "neutral"}
          />
          <StatsCard
            title="Goals This Week"
            value={`${stats.habitsThisWeek.completed}/${stats.habitsThisWeek.total}`}
            subtitle="On track"
            icon={Target}
            trend="neutral"
          />
          <StatsCard
            title="Productivity"
            value={`${stats.productivity}%`}
            subtitle="This week"
            icon={TrendingUp}
            trend={stats.productivity >= 70 ? "up" : "neutral"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <TaskList />
          <HabitTracker />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <MoodTracker />
          <ReflectionCard />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
