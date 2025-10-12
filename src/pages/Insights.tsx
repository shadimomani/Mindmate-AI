import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { MoodTracker } from "@/components/dashboard/MoodTracker";
import { BarChart3, TrendingUp, Calendar, Star } from "lucide-react";

const Insights = () => {
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
            value="24"
            subtitle="+12% from last week"
            icon={TrendingUp}
            trend="up"
          />
          <StatsCard
            title="Active Streak"
            value="7 days"
            subtitle="Keep it up!"
            icon={Calendar}
            trend="up"
          />
          <StatsCard
            title="Habits Tracked"
            value="4"
            subtitle="85% completion rate"
            icon={Star}
            trend="neutral"
          />
          <StatsCard
            title="Reflections"
            value="12"
            subtitle="This month"
            icon={BarChart3}
            trend="neutral"
          />
        </div>

        <MoodTracker />

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Weekly Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground">Most productive day</span>
              <span className="font-semibold text-accent">Wednesday</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground">Average mood</span>
              <span className="font-semibold text-accent">Good 😊</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground">Habits completed</span>
              <span className="font-semibold text-accent">23/28</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Insights;
