import { DashboardLayout } from "@/components/DashboardLayout";
import { ReflectionCard } from "@/components/dashboard/ReflectionCard";
import { MessageCircle } from "lucide-react";

const Reflections = () => {
  const pastReflections = [
    { date: "Yesterday", content: "I felt accomplished after completing my morning routine consistently." },
    { date: "2 days ago", content: "Grateful for the supportive conversation with a friend today." },
    { date: "3 days ago", content: "Learned to be more patient with myself during challenging moments." },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Reflections</h1>
            <p className="text-muted-foreground">Your journey of self-discovery</p>
          </div>
          <MessageCircle className="w-8 h-8 text-accent" />
        </div>

        <ReflectionCard />

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Past Reflections</h3>
          <div className="space-y-4">
            {pastReflections.map((reflection, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">{reflection.date}</p>
                <p className="text-foreground font-serif italic">{reflection.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reflections;
