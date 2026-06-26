import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Briefcase, Heart, Sparkles, Clock, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskCategory = "work" | "personal" | "leisure";
type Priority = "high" | "medium" | "low";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: TaskCategory;
  onAdd: (task: {
    title: string;
    category: TaskCategory;
    estimated_time: number;
    priority: Priority;
    repeat?: string | null;
  }) => void;
}

const SECTIONS = [
  { id: "work" as const, label: "Work", icon: Briefcase, activeClass: "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300", dotClass: "bg-blue-500" },
  { id: "personal" as const, label: "Personal", icon: Heart, activeClass: "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300", dotClass: "bg-emerald-500" },
  { id: "leisure" as const, label: "Leisure", icon: Sparkles, activeClass: "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300", dotClass: "bg-amber-500" },
];

const TIME_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2+ hours" },
];

const PRIORITIES: { id: Priority; label: string; activeClass: string }[] = [
  { id: "high", label: "High", activeClass: "bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300" },
  { id: "medium", label: "Medium", activeClass: "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300" },
  { id: "low", label: "Low", activeClass: "bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300" },
];

export const AddTaskModal = ({ open, onOpenChange, defaultCategory = "work", onAdd }: AddTaskModalProps) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>(defaultCategory);
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [priority, setPriority] = useState<Priority>("medium");
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [repeatWeekdays, setRepeatWeekdays] = useState(false);

  const reset = () => {
    setTitle("");
    setCategory(defaultCategory);
    setEstimatedTime(15);
    setPriority("medium");
    setRepeatDaily(false);
    setRepeatWeekdays(false);
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    const repeat = repeatDaily ? "daily" : repeatWeekdays ? "weekdays" : null;
    onAdd({ title: title.trim(), category, estimated_time: estimatedTime, priority, repeat });
    reset();
    onOpenChange(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  // When defaultCategory changes and modal opens, sync it
  const handleOpen = () => {
    setCategory(defaultCategory);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl" onOpenAutoFocus={() => handleOpen()}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold">New Task</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Title */}
          <Input
            placeholder="What do you want to accomplish?"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            onKeyDown={(e) => e.key === "Enter" && title.trim() && handleAdd()}
            maxLength={60}
            className="h-11 text-sm rounded-xl"
            autoFocus
          />
          <p className="text-[10px] text-muted-foreground text-right -mt-3">{title.length}/60</p>

          {/* Section Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Section</Label>
            <div className="grid grid-cols-3 gap-2">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = category === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCategory(s.id)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all touch-manipulation",
                      isActive ? s.activeClass : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Estimated Time */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </Label>
              <select
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs rounded-xl border border-input bg-background"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Priority</Label>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] rounded-lg border font-medium capitalize transition-all touch-manipulation",
                      priority === p.id ? p.activeClass : "border-border bg-muted/30 text-muted-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Repeat Shortcuts */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Repeat className="w-3 h-3" /> Repeat
            </Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={repeatDaily}
                  onCheckedChange={(v) => { setRepeatDaily(v); if (v) setRepeatWeekdays(false); }}
                  className="scale-75 origin-left"
                />
                <span className="text-xs text-foreground">Daily</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={repeatWeekdays}
                  onCheckedChange={(v) => { setRepeatWeekdays(v); if (v) setRepeatDaily(false); }}
                  className="scale-75 origin-left"
                />
                <span className="text-xs text-foreground">Weekdays</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="sm" className="flex-1 h-10 text-sm rounded-xl" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 h-10 text-sm rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleAdd}
              disabled={!title.trim()}
            >
              Add Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
