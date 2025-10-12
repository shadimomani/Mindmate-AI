import { DashboardLayout } from "@/components/DashboardLayout";
import { HabitTracker } from "@/components/dashboard/HabitTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";

const Habits = () => {
  const [newHabit, setNewHabit] = useState("");

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
            />
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <HabitTracker />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border text-center">
            <p className="text-4xl font-bold text-accent mb-2">7</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border text-center">
            <p className="text-4xl font-bold text-accent mb-2">85%</p>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border text-center">
            <p className="text-4xl font-bold text-accent mb-2">4</p>
            <p className="text-sm text-muted-foreground">Active Habits</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Habits;
