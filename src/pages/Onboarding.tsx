import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Heart, Coffee, Clock, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GeneratedTask {
  title: string;
  category: 'work' | 'personal' | 'leisure';
  priority: 'high' | 'medium' | 'low';
  estimated_time: number;
}

type Step = 'questions' | 'generating' | 'plan';

const Onboarding = () => {
  const { t } = useLanguage();

  const CATEGORY_META: Record<string, { label: string; icon: typeof Briefcase; colorClass: string; bgClass: string }> = {
    work: { label: t('work'), icon: Briefcase, colorClass: 'text-[hsl(var(--section-work))]', bgClass: 'bg-[hsl(var(--section-work)/0.1)]' },
    personal: { label: t('life'), icon: Heart, colorClass: 'text-[hsl(var(--section-personal))]', bgClass: 'bg-[hsl(var(--section-personal)/0.1)]' },
    leisure: { label: t('balance'), icon: Coffee, colorClass: 'text-[hsl(var(--section-leisure))]', bgClass: 'bg-[hsl(var(--section-leisure)/0.1)]' },
  };

  const [biggestProblem, setBiggestProblem] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [step, setStep] = useState<Step>('questions');
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const canSubmit = biggestProblem.trim().length >= 3 && mainGoal.trim().length >= 3;

  const handleGenerate = async () => {
    if (!user || !canSubmit) return;
    setLoading(true);
    setStep('generating');

    try {
      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: {
          biggest_problem: biggestProblem.trim(),
          main_goal: mainGoal.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedTasks(data.tasks || []);
      setMotivationalMessage(data.message || '');
      setStep('plan');
    } catch (error: any) {
      toast({
        title: t('somethingWentWrong'),
        description: error?.message || t('pleaseTryAgain'),
        variant: 'destructive',
      });
      setStep('questions');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (user) {
      const { error } = await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id);
      if (error) {
        toast({ title: t('somethingWentWrong'), description: t('pleaseTryAgain'), variant: 'destructive' });
        return;
      }
    }
    // Force ProtectedRoute to re-read onboarded status from DB
    (window as any).__recheckOnboarding?.();
    // Small delay to let ProtectedRoute refetch before navigating
    await new Promise(r => setTimeout(r, 300));
    navigate('/dashboard', { replace: true });
  };

  if (step === 'questions') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/3 px-4 py-12 sm:py-20 flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {t('letsUnderstandYou')}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {t('twoQuickQuestions')}
            </p>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-foreground">
                {t('biggestProblem')}
              </label>
              <Textarea
                value={biggestProblem}
                onChange={(e) => setBiggestProblem(e.target.value)}
                placeholder={t('biggestProblemPlaceholder')}
                className="min-h-[80px] resize-none text-sm"
                maxLength={300}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-foreground">
                {t('mainGoalQuestion')}
              </label>
              <Textarea
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                placeholder={t('mainGoalPlaceholder')}
                className="min-h-[80px] resize-none text-sm"
                maxLength={300}
              />
            </motion.div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canSubmit || loading}
            className="w-full h-12 text-base font-medium bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-sm"
          >
            {t('buildMyPlan')}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/3 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative mx-auto w-16 h-16">
            <Loader2 className="w-16 h-16 text-accent animate-spin" />
            <Sparkles className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              {t('buildingYourPlan')}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {t('analyzingGoals')}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/3 px-4 py-12 sm:py-16 flex items-start justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6 text-accent" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {t('planReady')}
          </h1>
          {motivationalMessage && (
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              {motivationalMessage}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {generatedTasks.map((task, i) => {
            const meta = CATEGORY_META[task.category] || CATEGORY_META.work;
            const Icon = meta.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/60"
              >
                <div className={cn('p-2 rounded-lg shrink-0', meta.bgClass)}>
                  <Icon className={cn('w-4 h-4', meta.colorClass)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-xs', meta.colorClass)}>{meta.label}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {task.estimated_time}m
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Button
          onClick={handleStart}
          className="w-full h-12 text-base font-medium bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-sm"
        >
          {t('startMyDay')}
        </Button>
      </motion.div>
    </div>
  );
};

export default Onboarding;
