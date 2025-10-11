import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const reflectionQuestions = [
  "What made you smile today?",
  "What's one thing you're grateful for right now?",
  "What challenged you today, and how did you handle it?",
  "What's one thing you learned today?",
  "How did you take care of yourself today?",
];

export const ReflectionCard = () => {
  const [reflection, setReflection] = useState("");
  const todayQuestion = reflectionQuestions[new Date().getDay() % reflectionQuestions.length];

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
      />

      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        Save Reflection
      </Button>
    </div>
  );
};
