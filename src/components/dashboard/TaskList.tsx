import { useState } from "react";
import { Circle, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Review morning emails", completed: true },
    { id: 2, text: "Complete project proposal", completed: false },
    { id: 3, text: "30-minute meditation", completed: false },
  ]);
  const [newTask, setNewTask] = useState("");

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask("");
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
      <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Today's Focus</h3>
      
      <div className="space-y-3 mb-4">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-base cursor-pointer"
            onClick={() => toggleTask(task.id)}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
            <span className={`font-sans ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a new task..."
          className="flex-1"
        />
        <Button onClick={addTask} size="icon" className="bg-accent hover:bg-accent/90">
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
