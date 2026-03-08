import { useState, useEffect, useMemo } from "react";
import { Briefcase, Heart, Coffee, Plus, GripVertical, Circle, CheckCircle2, Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AddTaskModal } from "./AddTaskModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { taskSchema } from "@/lib/validation";
import { startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateAdaptiveLimits, type AdaptiveLimits } from "@/lib/commitmentAlgorithm";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

type TaskCategory = "work" | "personal" | "leisure";
type Priority = "high" | "medium" | "low" | null;

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: TaskCategory;
  priority: Priority;
  estimated_time: number;
  sort_order: number;
  created_at: string;
}

const SECTIONS: {
  id: TaskCategory;
  title: string;
  icon: typeof Briefcase;
  bgClass: string;
  borderClass: string;
  accentClass: string;
  progressClass: string;
  iconBgClass: string;
}[] = [
  {
    id: "work",
    title: "Work",
    icon: Briefcase,
    bgClass: "bg-[hsl(var(--section-work-soft))] dark:bg-[hsl(var(--section-work-soft))]",
    borderClass: "border-[hsl(var(--section-work)/0.25)]",
    accentClass: "text-[hsl(var(--section-work))]",
    progressClass: "[&>div]:bg-[hsl(var(--section-work))]",
    iconBgClass: "bg-[hsl(var(--section-work)/0.12)]",
  },
  {
    id: "personal",
    title: "Life",
    icon: Heart,
    bgClass: "bg-[hsl(var(--section-personal-soft))] dark:bg-[hsl(var(--section-personal-soft))]",
    borderClass: "border-[hsl(var(--section-personal)/0.25)]",
    accentClass: "text-[hsl(var(--section-personal))]",
    progressClass: "[&>div]:bg-[hsl(var(--section-personal))]",
    iconBgClass: "bg-[hsl(var(--section-personal)/0.12)]",
  },
  {
    id: "leisure",
    title: "Balance",
    icon: Coffee,
    bgClass: "bg-[hsl(var(--section-leisure-soft))] dark:bg-[hsl(var(--section-leisure-soft))]",
    borderClass: "border-[hsl(var(--section-leisure)/0.25)]",
    accentClass: "text-[hsl(var(--section-leisure))]",
    progressClass: "[&>div]:bg-[hsl(var(--section-leisure))]",
    iconBgClass: "bg-[hsl(var(--section-leisure)/0.12)]",
  },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-accent/10 text-accent-foreground border-accent/30",
  low: "bg-muted text-muted-foreground border-border",
};

const TIME_OPTIONS = [5, 10, 15, 30, 45, 60, 90];

// Sortable Task Card
function SortableTaskCard({
  task,
  section,
  onToggle,
}: {
  task: Task;
  section: (typeof SECTIONS)[0];
  onToggle: (id: string, completed: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { category: task.category },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border/60 shadow-sm transition-all group",
        isDragging && "opacity-40 scale-95",
        task.completed && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-manipulation shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <button
        onClick={() => onToggle(task.id, task.completed)}
        className="shrink-0 touch-manipulation"
      >
        {task.completed ? (
          <CheckCircle2 className={cn("w-5 h-5", section.accentClass)} />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/50" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm sm:text-base font-medium truncate", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.estimated_time > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {task.estimated_time}m
            </span>
          )}
        </div>
      </div>

      {task.priority && (
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0 capitalize", PRIORITY_COLORS[task.priority])}>
          {task.priority}
        </Badge>
      )}
    </div>
  );
}

// Drag overlay card (shown while dragging)
function TaskDragOverlay({ task }: { task: Task }) {
  const section = SECTIONS.find((s) => s.id === task.category) || SECTIONS[0];
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border-2 border-accent shadow-medium">
      <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      <CheckCircle2 className={cn("w-5 h-5 shrink-0", section.accentClass)} />
      <p className="text-sm font-medium truncate flex-1">{task.title}</p>
    </div>
  );
}

export const SectionTaskBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<TaskCategory, string>>({ work: "", personal: "", leisure: "" });
  const [newTaskTimes, setNewTaskTimes] = useState<Record<TaskCategory, number>>({ work: 15, personal: 15, leisure: 15 });
  const [newTaskPriorities, setNewTaskPriorities] = useState<Record<TaskCategory, Priority>>({ work: "medium", personal: "medium", leisure: "medium" });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<TaskCategory>("work");
  const [adaptiveLimits, setAdaptiveLimits] = useState<AdaptiveLimits | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (user) {
      loadTasks();
      calculateAdaptiveLimits(user.id).then(setAdaptiveLimits);
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    const todayStart = startOfDay(new Date()).toISOString();

    await supabase.from("tasks").delete().eq("user_id", user.id).lt("created_at", todayStart);

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .order("sort_order", { ascending: true });

    if (data) {
      setTasks(
        data.map((t: any) => ({
          ...t,
          category: t.category || "work",
          priority: t.priority || null,
          estimated_time: t.estimated_time || 15,
          sort_order: t.sort_order || 0,
        }))
      );
    }
  };

  // Check if user has reached the total daily task limit
  const isDailyLimitReached = (): boolean => {
    if (!adaptiveLimits) return tasks.length >= 5;
    return tasks.length >= adaptiveLimits.total;
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from("tasks").update({ completed: !completed }).eq("id", id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
  };

  const addTask = async (taskData: { title: string; category: TaskCategory; estimated_time: number; priority: "high" | "medium" | "low"; repeat?: string | null }) => {
    if (!user || !taskData.title) return;

    const validation = taskSchema.safeParse({ title: taskData.title });
    if (!validation.success) {
      toast({ title: "Validation Error", description: validation.error.errors[0].message, variant: "destructive" });
      return;
    }

    const categoryTasks = tasks.filter((t) => t.category === taskData.category);
    const sortOrder = categoryTasks.length;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: taskData.title,
        completed: false,
        category: taskData.category,
        priority: taskData.priority,
        estimated_time: taskData.estimated_time,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
      return;
    }

    setTasks((prev) => [...prev, { ...data, category: taskData.category, priority: taskData.priority, estimated_time: taskData.estimated_time, sort_order: sortOrder }]);
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    if (activeTask.category !== overTask.category) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeTask.id ? { ...t, category: overTask.category } : t))
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    const category = overTask.category;
    const categoryTasks = tasks.filter((t) => t.category === category);
    const oldIndex = categoryTasks.findIndex((t) => t.id === active.id);
    const newIndex = categoryTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categoryTasks, oldIndex, newIndex);
    const otherTasks = tasks.filter((t) => t.category !== category);

    const updatedReordered = reordered.map((t, i) => ({ ...t, sort_order: i, category }));
    setTasks([...otherTasks, ...updatedReordered]);

    // Persist category + order
    await supabase.from("tasks").update({ category, sort_order: updatedReordered.find((r) => r.id === active.id)?.sort_order ?? 0 }).eq("id", String(active.id));
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* No visible algorithm details — the system manages the plan invisibly */}

        {SECTIONS.map((section) => {
          const sectionTasks = tasks
            .filter((t) => t.category === section.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const completed = sectionTasks.filter((t) => t.completed).length;
          const total = sectionTasks.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const Icon = section.icon;
          const atLimit = isDailyLimitReached();

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("rounded-2xl border p-4 sm:p-5", section.bgClass, section.borderClass)}
            >
              {/* Section Header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className={cn("p-2 rounded-lg", section.iconBgClass)}>
                  <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", section.accentClass)} />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-foreground flex-1">{section.title}</h2>
              </div>

              {/* Progress */}
              {total > 0 && (
                <div className="mb-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{completed} of {total} completed</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <Progress value={pct} className={cn("h-1.5", section.progressClass)} />
                </div>
              )}

              {/* Tasks */}
              <SortableContext items={sectionTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[60px]">
                  <AnimatePresence>
                    {sectionTasks.map((task) => (
                      <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <SortableTaskCard task={task} section={section} onToggle={toggleTask} />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {sectionTasks.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground/60 py-6">No tasks yet</p>
                  )}
                </div>
              </SortableContext>

              {/* Add Task Button */}
              {atLimit ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed text-xs font-medium opacity-30 cursor-default", section.borderClass, section.accentClass)}>
                      <Info className="w-3.5 h-3.5" />
                      Section balanced
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Your plan is optimized based on your recent pace. Complete existing tasks to add more.</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => { setModalCategory(section.id); setModalOpen(true); }}
                  className={cn("mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed text-xs font-medium transition-all hover:border-solid touch-manipulation", section.borderClass, section.accentClass, "opacity-60 hover:opacity-100")}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add task
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <DragOverlay>{activeTask && <TaskDragOverlay task={activeTask} />}</DragOverlay>

      <AddTaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultCategory={modalCategory}
        onAdd={addTask}
      />
    </DndContext>
  );
};
