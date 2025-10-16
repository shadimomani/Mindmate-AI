import { DashboardLayout } from "@/components/DashboardLayout";
import { ReflectionCard } from "@/components/dashboard/ReflectionCard";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Reflections = () => {
  const { user } = useAuth();
  const [pastReflections, setPastReflections] = useState<Array<{
    date: string;
    content: string;
    question: string;
  }>>([]);

  useEffect(() => {
    if (!user) return;

    const fetchReflections = async () => {
      const { data } = await supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setPastReflections(
          data.map(r => ({
            date: new Date(r.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            content: r.content,
            question: r.question,
          }))
        );
      }
    };

    fetchReflections();
  }, [user]);

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
          {pastReflections.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reflections yet. Start by adding your first reflection above!</p>
          ) : (
            <div className="space-y-4">
              {pastReflections.map((reflection, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{reflection.date}</p>
                  <p className="text-sm text-accent font-serif mb-2">{reflection.question}</p>
                  <p className="text-foreground font-serif italic">{reflection.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reflections;
