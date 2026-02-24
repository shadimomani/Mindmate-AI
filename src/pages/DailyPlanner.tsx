import { DashboardLayout } from "@/components/DashboardLayout";
import { PlannerAnalyzer } from "@/components/dashboard/PlannerAnalyzer";
import { SectionTaskBoard } from "@/components/dashboard/SectionTaskBoard";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const DailyPlanner = () => {
  const { language } = useLanguage();

  const t = {
    en: { title: "Daily Planner", subtitle: "Your day, organized by life domain" },
    ar: { title: "المخطط اليومي", subtitle: "يومك، منظم حسب مجالات الحياة" },
  }[language];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mb-1 sm:mb-2">{t.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t.subtitle}</p>
          </div>
          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
        </div>

        <SectionTaskBoard />

        <PlannerAnalyzer />
      </div>
    </DashboardLayout>
  );
};

export default DailyPlanner;
