import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { reflectionSchema } from "@/lib/validation";

const reflectionQuestions = [
  "What made you smile today?",
  "What's one thing you're grateful for right now?",
  "What challenged you today, and how did you handle it?",
  "What's one thing you learned today?",
  "How did you take care of yourself today?",
];

export const ReflectionCard = () => {
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const todayQuestion = reflectionQuestions[new Date().getDay() % reflectionQuestions.length];

  const handleSave = async () => {
    if (!user) return;

    try {
      const validation = reflectionSchema.safeParse({
        content: reflection,
        question: todayQuestion,
      });

      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      const { error } = await supabase.from('reflections').insert({
        user_id: user.id,
        question: todayQuestion,
        content: reflection,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Reflection saved successfully',
      });
      setReflection("");
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save reflection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-accent/10 rounded-lg">
          <MessageCircle className="w-5 h-5 text-accent" />
        </div>
        <h3 className="text-xl font-serif font-semibold text-foreground">Daily Reflection</h3>
      </div>

      <p className="text-foreground font-serif italic mb-4">{todayQuestion}</p>

      <Textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="Take a moment to reflect..."
        className="mb-4 min-h-[120px]"
        maxLength={2000}
      />

      <Button 
        onClick={handleSave}
        disabled={loading || !reflection.trim()}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        {loading ? 'Saving...' : 'Save Reflection'}
      </Button>
    </div>
  );
};
