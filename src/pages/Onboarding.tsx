import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Heart, Coffee, Clock, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/SEO';

interface GeneratedTask {
  title: string;
  category: 'work' | 'personal' | 'leisure';
  priority: 'high' | 'medium' | 'low';
  estimated_time: number;
}

type Step = 'welcome' | 'question1' | 'question2' | 'generating' | 'plan';

const CATEGORY_META_KEYS = {
  work: { labelKey: 'work' as const, icon: Briefcase, colorClass: 'text-[hsl(var(--section-work))]', bgClass: 'bg-[hsl(var(--section-work)/0.1)]' },
  personal: { labelKey: 'life' as const, icon: Heart, colorClass: 'text-[hsl(var(--section-personal))]', bgClass: 'bg-[hsl(var(--section-personal)/0.1)]' },
  leisure: { labelKey: 'balance' as const, icon: Coffee, colorClass: 'text-[hsl(var(--section-leisure))]', bgClass: 'bg-[hsl(var(--section-leisure)/0.1)]' },
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
};

const Onboarding = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('welcome');
  const [direction, setDirection] = useState(1);
  const [biggestProblem, setBiggestProblem] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const goTo = (next: Step) => {
    const order: Step[] = ['welcome', 'question1', 'question2', 'generating', 'plan'];
    setDirection(order.indexOf(next) > order.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const handleGenerate = async () => {
    if (!user || biggestProblem.trim().length < 3 || mainGoal.trim().length < 3) return;
    setLoading(true);
    goTo('generating');

    try {
      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: { biggest_problem: biggestProblem.trim(), main_goal: mainGoal.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedTasks(data.tasks || []);
      setMotivationalMessage(data.message || '');
      goTo('plan');
    } catch (error: any) {
      toast({ title: t('somethingWentWrong'), description: error?.message || t('pleaseTryAgain'), variant: 'destructive' });
      goTo('question2');
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
    (window as any).__recheckOnboarding?.();
    await new Promise(r => setTimeout(r, 300));
    navigate('/dashboard', { replace: true });
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/3 px-4 flex items-center justify-center">
      <SEO
        title="Get started with MindMate — 60-second onboarding"
        description="Set up MindMate in under a minute. Tell us your biggest challenge and goal so we can plan a focused, supportive first day for you."
        path="/onboarding"
      />
      <AnimatePresence mode="wait" custom={direction}>
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full max-w-md text-center space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.15 }}
                className="mx-auto w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center"
              >
                <Sparkles className="w-7 h-7 text-accent" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                {t('onboardingWelcomeTitle')}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line max-w-sm mx-auto">
                {t('onboardingWelcomeDesc')}
              </p>
            </div>
            <Button
              onClick={() => goTo('question1')}
              className="h-12 px-8 text-base font-medium bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-sm"
            >
              {t('onboardingStart')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 'question1' && (
          <motion.div
            key="q1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                1 {t('onboardingStepOf')} 2
              </p>
            </div>
            <div className="space-y-3">
              <label className="text-lg sm:text-xl font-serif font-semibold text-foreground block text-center">
                {t('biggestProblem')}
              </label>
              <Textarea
                value={biggestProblem}
                onChange={(e) => setBiggestProblem(e.target.value)}
                placeholder={t('biggestProblemPlaceholder')}
                className="min-h-[100px] resize-none text-sm rounded-xl"
                maxLength={300}
                autoFocus
              />
            </div>
            <Button
              onClick={() => goTo('question2')}
              disabled={biggestProblem.trim().length < 3}
              className="w-full h-12 text-base font-medium bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-sm"
            >
              {t('onboardingNext')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 'question2' && (
          <motion.div
            key="q2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                2 {t('onboardingStepOf')} 2
              </p>
            </div>
            <div className="space-y-3">
              <label className="text-lg sm:text-xl font-serif font-semibold text-foreground block text-center">
                {t('mainGoalQuestion')}
              </label>
              <Textarea
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                placeholder={t('mainGoalPlaceholder')}
                className="min-h-[100px] resize-none text-sm rounded-xl"
                maxLength={300}
                autoFocus
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={mainGoal.trim().length < 3 || loading}
              className="w-full h-12 text-base font-medium bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-sm"
            >
              {t('buildMyPlan')}
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
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
        )}

        {step === 'plan' && (
          <motion.div
            key="plan"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full max-w-md space-y-6"
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
                const meta = CATEGORY_META_KEYS[task.category] || CATEGORY_META_KEYS.work;
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
                        <span className={cn('text-xs', meta.colorClass)}>{t(meta.labelKey)}</span>
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
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
