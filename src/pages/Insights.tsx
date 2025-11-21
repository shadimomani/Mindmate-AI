import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { MoodTracker } from "@/components/dashboard/MoodTracker";
import { BarChart3, TrendingUp, Calendar, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Insights = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    tasksCompleted: 0,
    activeStreak: 0,
    habitsTracked: 0,
    reflections: 0,
    mostProductiveDay: "N/A",
    averageMood: "N/A",
    habitsCompleted: { completed: 0, total: 0 },
    productivity: 0,
  });

  const [monthlyStats, setMonthlyStats] = useState({
    currentStreak: 0,
    habitsTracked: 0,
    reflections: 0,
    tasksCompleted: 0,
    productivity: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Tasks completed this week
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*, updated_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", weekAgo.toISOString());

      // Tasks completed this month
      const { data: monthlyTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", monthStart.toISOString());

      // Active streak
      const { data: habits } = await supabase
        .from("habits")
        .select("streak")
        .eq("user_id", user.id)
        .order("streak", { ascending: false })
        .limit(1);

      // Habits tracked
      const { data: allHabits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      // Reflections this month
      const { data: reflections } = await supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString());

      // Most productive day
      const dayTasks: Record<string, number> = {};
      tasks?.forEach(task => {
        const day = new Date(task.updated_at).toLocaleDateString('en-US', { weekday: 'long' });
        dayTasks[day] = (dayTasks[day] || 0) + 1;
      });
      const mostProductiveDay = Object.entries(dayTasks).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      // Average mood
      const { data: moodEntries } = await supabase
        .from("mood_entries")
        .select("mood_value, mood_label")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      const avgMoodValue = moodEntries?.length 
        ? moodEntries.reduce((sum, m) => sum + m.mood_value, 0) / moodEntries.length 
        : 0;
      const avgMoodLabel = avgMoodValue >= 4 ? "Great 😊" : avgMoodValue >= 3 ? "Good 🙂" : "Okay 😐";

      // Habits completed this week
      const completedHabits = allHabits?.filter(h => h.completed_today).length || 0;
      const totalHabits = (allHabits?.length || 0) * 7; // 7 days a week

      // Calculate productivity score (0-100)
      const productivity = Math.min(100, Math.round(
        ((monthlyTasks?.length || 0) * 10 + 
         (habits?.[0]?.streak || 0) * 5 + 
         (reflections?.length || 0) * 15) / 5
      ));

      setAnalytics({
        tasksCompleted: tasks?.length || 0,
        activeStreak: habits?.[0]?.streak || 0,
        habitsTracked: allHabits?.length || 0,
        reflections: reflections?.length || 0,
        mostProductiveDay,
        averageMood: avgMoodLabel,
        habitsCompleted: { completed: completedHabits, total: totalHabits },
        productivity,
      });

      setMonthlyStats({
        currentStreak: habits?.[0]?.streak || 0,
        habitsTracked: allHabits?.length || 0,
        reflections: reflections?.length || 0,
        tasksCompleted: monthlyTasks?.length || 0,
        productivity,
      });

      // Save monthly achievements
      const currentMonthYear = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      await supabase
        .from("monthly_achievements")
        .upsert({
          user_id: user.id,
          month_year: currentMonthYear,
          current_streak: habits?.[0]?.streak || 0,
          habits_tracked: allHabits?.length || 0,
          reflections_count: reflections?.length || 0,
          tasks_completed: monthlyTasks?.length || 0,
          productivity_score: productivity,
        }, {
          onConflict: 'user_id,month_year'
        });
    };

    fetchAnalytics();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Insights</h1>
            <p className="text-muted-foreground">Track your progress and patterns</p>
          </div>
          <BarChart3 className="w-8 h-8 text-accent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Tasks Completed"
            value={analytics.tasksCompleted}
            subtitle="This week"
            icon={TrendingUp}
            trend={analytics.tasksCompleted > 0 ? "up" : "neutral"}
          />
          <StatsCard
            title="Active Streak"
            value={`${analytics.activeStreak} days`}
            subtitle="Keep it up!"
            icon={Calendar}
            trend={analytics.activeStreak > 0 ? "up" : "neutral"}
          />
          <StatsCard
            title="Habits Tracked"
            value={analytics.habitsTracked}
            subtitle={`${analytics.habitsTracked > 0 ? Math.round((analytics.habitsCompleted.completed / (analytics.habitsTracked || 1)) * 100) : 0}% completion`}
            icon={Star}
            trend="neutral"
          />
          <StatsCard
            title="Reflections"
            value={analytics.reflections}
            subtitle="This month"
            icon={BarChart3}
            trend="neutral"
          />
        </div>

        <MoodTracker />

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Monthly Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground">Current Streak</span>
              <span className="font-semibold text-accent">{monthlyStats.currentStreak} days</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground">Habits Tracked</span>
              <span className="font-semibold text-accent">{monthlyStats.habitsTracked}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground">Reflections</span>
              <span className="font-semibold text-accent">{monthlyStats.reflections}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground">Tasks Completed</span>
              <span className="font-semibold text-accent">{monthlyStats.tasksCompleted}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground">Productivity Score</span>
              <span className="font-semibold text-accent">{monthlyStats.productivity}/100</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Insights;
