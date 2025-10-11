import { DashboardLayout } from "@/components/DashboardLayout";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TaskList } from "@/components/dashboard/TaskList";
import { HabitTracker } from "@/components/dashboard/HabitTracker";
import { MoodTracker } from "@/components/dashboard/MoodTracker";
import { ReflectionCard } from "@/components/dashboard/ReflectionCard";
import { CheckCircle2, Flame, Target, TrendingUp } from "lucide-react";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <WelcomeCard />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tasks Completed"
            value="12"
            subtitle="Today"
            icon={CheckCircle2}
            trend="up"
          />
          <StatsCard
            title="Current Streak"
            value="7"
            subtitle="Days"
            icon={Flame}
            trend="up"
          />
          <StatsCard
            title="Goals This Week"
            value="5/8"
            subtitle="On track"
            icon={Target}
            trend="neutral"
          />
          <StatsCard
            title="Productivity"
            value="94%"
            subtitle="+12% from last week"
            icon={TrendingUp}
            trend="up"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskList />
          <HabitTracker />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoodTracker />
          <ReflectionCard />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
