import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight, Target, Brain, Sparkles, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoalsOnboardingProps {
  onComplete: (data: GoalsPlanData) => void;
}

export interface GoalsPlanData {
  analysis: {
    time_management_issues: string[];
    motivation_level: 'low' | 'medium' | 'high';
    commitment_gaps: string[];
  };
  daily_schedule: {
    time: string;
    activity: string;
    duration: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  task_priorities: {
    task: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  commitment_score: number;
  motivational_feedback: string;
}

export const GoalsOnboarding: React.FC<GoalsOnboardingProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState(1);
  const [biggestProblem, setBiggestProblem] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step === 2 && !biggestProblem.trim()) {
      toast({ title: language === 'ar' ? 'يرجى وصف مشكلتك الكبرى' : 'Please describe your biggest problem', variant: 'destructive' });
      return;
    }
    if (step === 3 && !mainGoal.trim()) {
      toast({ title: language === 'ar' ? 'يرجى وصف هدفك الرئيسي' : 'Please describe your main goal', variant: 'destructive' });
      return;
    }
    setStep(step + 1);
  };

  const handleAnalyze = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    try {
      // Call AI analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-goals', {
        body: { biggest_problem: biggestProblem, main_goal: mainGoal }
      });

      if (analysisError) throw analysisError;

      // Store in database
      const { error: insertError } = await supabase
        .from('user_goals')
        .upsert({
          user_id: user.id,
          biggest_problem: biggestProblem,
          main_goal: mainGoal,
          ai_analysis: analysisData.analysis,
          daily_schedule: analysisData.daily_schedule,
          commitment_score: Math.round(analysisData.commitment_score),
          motivational_feedback: analysisData.motivational_feedback,
        });

      if (insertError) throw insertError;

      // Mark goals as completed
      await supabase
        .from('profiles')
        .update({ goals_completed: true })
        .eq('id', user.id);

      onComplete(analysisData);
    } catch (error: any) {
      console.error('Error analyzing goals:', error);
      const message = error?.message || 'Please try again later.';
      toast({
        title: language === 'ar' ? 'فشل التحليل' : 'Analysis failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border overflow-hidden"
      >
        {/* Progress Header */}
        <div className="p-6 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Set Your Goals</h2>
            <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-primary">
                  <Globe className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-semibold">Choose Your Language</h3>
                    <p className="text-sm text-muted-foreground">اختر لغتك المفضلة</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setLanguage('en')}
                  >
                    <span className="text-2xl">🇺🇸</span>
                    <span>English</span>
                  </Button>
                  <Button
                    variant={language === 'ar' ? 'default' : 'outline'}
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setLanguage('ar')}
                  >
                    <span className="text-2xl">🇸🇦</span>
                    <span>العربية</span>
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-primary">
                  <Target className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {language === 'ar' ? 'ما الذي يعيقك؟' : "What's holding you back?"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'صف أكبر تحدٍ تواجهه الآن' : 'Describe your biggest challenge right now'}
                    </p>
                  </div>
                </div>
                <Textarea
                  placeholder={language === 'ar' 
                    ? 'مثال: أعاني من التسويف ولا أستطيع التركيز على المهام المهمة...'
                    : 'e.g., I struggle with procrastination and can\'t seem to focus on important tasks...'}
                  value={biggestProblem}
                  onChange={(e) => setBiggestProblem(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <p className="text-xs text-muted-foreground text-right">{biggestProblem.length}/500</p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-primary">
                  <Sparkles className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {language === 'ar' ? 'ما الذي تريد تحقيقه؟' : 'What do you want to achieve?'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'صف هدفك الرئيسي' : 'Describe your main goal'}
                    </p>
                  </div>
                </div>
                <Textarea
                  placeholder={language === 'ar'
                    ? 'مثال: أريد أن أصبح أكثر إنتاجية، وأنهي مشاريعي في الوقت المحدد...'
                    : 'e.g., I want to become more productive, finish my projects on time, and have a better work-life balance...'}
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <p className="text-xs text-muted-foreground text-right">{mainGoal.length}/500</p>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-primary">
                  <Brain className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {language === 'ar' ? 'هل أنت جاهز لخطتك المخصصة؟' : 'Ready for your personalized plan?'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'سيحلل الذكاء الاصطناعي مدخلاتك ويُنشئ جدولاً يومياً' : 'AI will analyze your inputs and create a daily schedule'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? 'تحديك:' : 'Your Challenge:'}
                    </p>
                    <p className="text-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>{biggestProblem}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? 'هدفك:' : 'Your Goal:'}
                    </p>
                    <p className="text-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>{mainGoal}</p>
                  </div>
                </div>

                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 py-8"
                  >
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'جاري إنشاء خطتك المخصصة...' : 'Creating your personalized plan...'}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/30 flex justify-between">
          {step > 1 && !isAnalyzing && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              {language === 'ar' ? 'رجوع' : 'Back'}
            </Button>
          )}
          {step === 1 && <div />}
          
          {step < 4 ? (
            <Button onClick={handleNext} className="gap-2">
              {language === 'ar' ? 'التالي' : 'Next'} <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  {language === 'ar' ? 'إنشاء خطتي' : 'Generate My Plan'} <Sparkles className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
