import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Memory {
  id: string;
  content: string;
  memory_type: string;
  importance: number;
  source: string;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  preference: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  blocker: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  goal: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  task: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  fact: "bg-muted text-muted-foreground",
};

export function AIMemoryInput() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [expanded, setExpanded] = useState(false);

  const loadMemories = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_memories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setMemories(data);
  };

  useEffect(() => { loadMemories(); }, [user]);

  const handleSubmit = async () => {
    if (!text.trim() || text.length < 3) {
      toast({
        title: isRTL ? "اكتب شي" : "Write something",
        description: isRTL ? "خبر AI أكثر عن يومك أو تفضيلاتك" : "Tell the AI more about your day or preferences",
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-memory", {
        body: { text: text.trim(), source: "manual" }
      });
      if (error) throw error;
      const saved = data?.saved || 0;
      if (saved === 0) {
        toast({
          title: isRTL ? "ما لقيت معلومات قابلة للحفظ" : "No durable info found",
          description: isRTL ? "جرب كتابة تفضيل أو هدف أو عائق" : "Try writing a preference, goal or blocker",
        });
      } else {
        toast({
          title: isRTL ? `✨ تم حفظ ${saved} معلومة` : `✨ Saved ${saved} memor${saved === 1 ? "y" : "ies"}`,
          description: isRTL ? "AI رح يستخدمها بالخطط القادمة" : "AI will use these in future plans",
        });
        setText("");
        await loadMemories();
        setExpanded(true);
      }
    } catch (e: any) {
      toast({
        title: isRTL ? "خطأ" : "Error",
        description: e?.message || "Could not save",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMemory = async (id: string) => {
    const { error } = await supabase.from("user_memories").delete().eq("id", id);
    if (!error) setMemories(prev => prev.filter(m => m.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-soft space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">
            {isRTL ? "خبر الذكاء الاصطناعي عنك" : "Teach the AI about you"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRTL
              ? "اكتب تفضيلاتك، أهدافك، أو شي بعيقك — رح يتذكرها ويستعملها بالخطط"
              : "Share preferences, goals, or what blocks you — it'll remember and use this in your plans"}
          </p>
        </div>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 3000))}
        placeholder={isRTL
          ? "مثال: بحب أدرس الصبح، بصير عندي تشتت بعد الساعة 8، هدفي أتعلم بايثون..."
          : "e.g. I focus best in the mornings, I get distracted after 8pm, my goal is to learn Python..."}
        rows={3}
        className="resize-none text-sm"
        disabled={loading}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground tabular-nums">{text.length}/3000</span>
        <Button onClick={handleSubmit} disabled={loading || text.trim().length < 3} size="sm" className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading
            ? (isRTL ? "جاري الحفظ..." : "Saving...")
            : (isRTL ? "حفظ" : "Save to AI memory")}
        </Button>
      </div>

      {memories.length > 0 && (
        <div className="pt-3 border-t border-border">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <span>
              {isRTL ? `يعرف عنك ${memories.length} معلومة` : `AI knows ${memories.length} thing${memories.length === 1 ? "" : "s"} about you`}
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="group flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition"
                    >
                      <Badge variant="secondary" className={`text-[10px] shrink-0 ${TYPE_COLORS[m.memory_type] || ""}`}>
                        {m.memory_type}
                      </Badge>
                      <p className="text-xs text-foreground flex-1">{m.content}</p>
                      <button
                        onClick={() => deleteMemory(m.id)}
                        className="opacity-0 group-hover:opacity-100 transition shrink-0"
                        aria-label="Delete"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
