import { useState, useEffect } from "react";
import { Circle, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { taskSchema } from "@/lib/validation";
import { startOfDay } from "date-fns";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    const todayStart = startOfDay(new Date()).toISOString();

    // Delete only INCOMPLETE old tasks — keep completed ones for weekly insights
    await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user.id)
      .eq('completed', false)
      .lt('created_at', todayStart);

    // Load only today's tasks
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', id);

    if (!error) {
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, completed: !completed } : task
      ));
    }
  };

  const addTask = async () => {
    if (!user || !newTask.trim()) return;

    try {
      const validation = taskSchema.safeParse({ title: newTask });

      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: user.id, title: newTask, completed: false })
        .select()
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
      setNewTask("");
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add task',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-soft border border-border">
      <h3 className="text-lg sm:text-xl font-serif font-semibold text-foreground mb-4">Today's Focus</h3>
      
      <div className="space-y-3 mb-4">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-base cursor-pointer"
            onClick={() => toggleTask(task.id, task.completed)}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
            <span className={`font-sans text-sm sm:text-base break-words ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </span>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            No tasks yet. Add your first task below!
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a new task..."
          maxLength={200}
          className="flex-1"
        />
        <Button 
          onClick={addTask} 
          size="icon" 
          disabled={loading || !newTask.trim()}
          className="bg-accent hover:bg-accent/90"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
