import { DashboardLayout } from "@/components/DashboardLayout";
import { TaskList } from "@/components/dashboard/TaskList";
import { PlannerAnalyzer } from "@/components/dashboard/PlannerAnalyzer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const DailyPlanner = () => {
  const [newTask, setNewTask] = useState("");
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Daily Planner",
      subtitle: "Plan and organize your day effectively",
      addNewTask: "Add New Task",
      placeholder: "What do you want to accomplish today?",
      add: "Add",
      todaysFocus: "Today's Focus",
      focusQuestion: "What are your top 3 priorities for today?",
      priority: "Priority",
    },
    ar: {
      title: "المخطط اليومي",
      subtitle: "خطط ونظم يومك بفعالية",
      addNewTask: "إضافة مهمة جديدة",
      placeholder: "ماذا تريد أن تنجز اليوم؟",
      add: "إضافة",
      todaysFocus: "تركيز اليوم",
      focusQuestion: "ما هي أهم 3 أولويات لديك اليوم؟",
      priority: "الأولوية",
    }
  };

  const t = translations[language];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <Calendar className="w-8 h-8 text-accent" />
        </div>

        <PlannerAnalyzer />

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-4">{t.addNewTask}</h2>
          <div className="flex gap-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1"
            />
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 mr-2" />
              {t.add}
            </Button>
          </div>
        </div>

        <TaskList />

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">{t.todaysFocus}</h3>
          <p className="text-muted-foreground mb-4">{t.focusQuestion}</p>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Input
                key={i}
                placeholder={`${t.priority} ${i}`}
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
