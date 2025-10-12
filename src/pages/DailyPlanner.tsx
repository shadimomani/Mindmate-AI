import { DashboardLayout } from "@/components/DashboardLayout";
import { TaskList } from "@/components/dashboard/TaskList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";

const DailyPlanner = () => {
  const [newTask, setNewTask] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Daily Planner</h1>
            <p className="text-muted-foreground">Plan and organize your day effectively</p>
          </div>
          <Calendar className="w-8 h-8 text-accent" />
        </div>

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Add New Task</h2>
          <div className="flex gap-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What do you want to accomplish today?"
              className="flex-1"
            />
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <TaskList />

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Today's Focus</h3>
          <p className="text-muted-foreground mb-4">What are your top 3 priorities for today?</p>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Input
                key={i}
                placeholder={`Priority ${i}`}
                className="bg-background"
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyPlanner;
