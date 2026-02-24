import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, Heart, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Priority = 'high' | 'medium' | 'low';

interface GoalSelection {
  label: string;
  priority: Priority;
}

const GOAL_CATEGORIES = [
  {
    id: 'professional',
    title: 'Professional Goals',
    icon: Briefcase,
    goals: [
      'Improve focus',
      'Complete pending tasks',
      'Build consistency',
      'Study effectively',
      'Launch a project',
    ],
  },
  {
    id: 'personal',
    title: 'Personal Life Goals',
    icon: Heart,
    goals: [
      'Improve sleep',
      'Exercise regularly',
      'Reduce stress',
      'Spend time with family',
      'Build better habits',
    ],
  },
  {
    id: 'leisure',
    title: 'Leisure & Free Time',
    icon: Sparkles,
    goals: [
      'Read regularly',
      'Learn a new skill',
      'Practice a hobby',
      'Digital detox',
      'Relax intentionally',
    ],
  },
] as const;

const PRIORITY_OPTIONS: { value: Priority; label: string; className: string }[] = [
  { value: 'high', label: 'High', className: 'border-destructive/40 bg-destructive/5 text-destructive data-[active=true]:bg-destructive data-[active=true]:text-destructive-foreground' },
  { value: 'medium', label: 'Medium', className: 'border-accent/40 bg-accent/5 text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground' },
  { value: 'low', label: 'Low', className: 'border-muted-foreground/30 bg-muted/30 text-muted-foreground data-[active=true]:bg-muted-foreground data-[active=true]:text-primary-foreground' },
];

const Onboarding = () => {
  const [selectedGoals, setSelectedGoals] = useState<Record<string, GoalSelection>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) => {
      const next = { ...prev };
      if (next[goal]) {
        delete next[goal];
      } else {
        next[goal] = { label: goal, priority: 'medium' };
      }
      return next;
    });
  };

  const setPriority = (goal: string, priority: Priority) => {
    setSelectedGoals((prev) => ({
      ...prev,
      [goal]: { ...prev[goal], priority },
    }));
  };

  const addCustomGoal = (categoryId: string) => {
    const value = customInputs[categoryId]?.trim();
    if (!value || value.length > 80) return;
    const key = `custom_${categoryId}_${value}`;
    if (selectedGoals[key]) return;
    setSelectedGoals((prev) => ({
      ...prev,
      [key]: { label: value, priority: 'medium' },
    }));
    setCustomInputs((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const totalSelected = Object.keys(selectedGoals).length;

  const handleSubmit = async () => {
    if (!user || totalSelected === 0) return;
    setLoading(true);

    try {
      const goals = Object.values(selectedGoals);
      const mainGoals = goals.filter((g) => g.priority === 'high').map((g) => g.label);
      const allGoalLabels = goals.map((g) => g.label);

      // Save to user_goals
      const { error: goalsError } = await supabase.from('user_goals').insert([{
        user_id: user.id,
        main_goal: mainGoals.length > 0 ? mainGoals.join(', ') : allGoalLabels[0],
        biggest_problem: 'Selected via structured onboarding',
        ai_analysis: { structured_goals: goals } as any,
      }]);

      if (goalsError) throw goalsError;

      // Mark onboarded
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarded: true, goals_completed: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({ title: 'Welcome to MindMate!', description: 'Your plan is being prepared.' });
      navigate('/');
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/3 px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
            What matters to you?
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Select the goals you'd like to work on. We'll build your daily plan around them.
          </p>
        </motion.div>

        {/* Goal Categories */}
        <div className="space-y-6 sm:space-y-8">
          {GOAL_CATEGORIES.map((category, catIdx) => {
            const Icon = category.icon;
            return (
              <motion.section
                key={category.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.1 }}
                className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 sm:p-6"
              >
                {/* Category Header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  </div>
                  <h2 className="text-base sm:text-lg font-serif font-semibold text-foreground">
                    {category.title}
                  </h2>
                </div>

                {/* Goal Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {category.goals.map((goal) => {
                    const isSelected = !!selectedGoals[goal];
                    return (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border touch-manipulation',
                          isSelected
                            ? 'bg-accent text-accent-foreground border-accent shadow-sm scale-[1.02]'
                            : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                        {goal}
                      </button>
                    );
                  })}
                </div>

                {/* Priority for selected goals in this category */}
                <AnimatePresence>
                  {category.goals
                    .filter((g) => selectedGoals[g])
                    .map((goal) => (
                      <motion.div
                        key={`priority-${goal}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between py-1.5 px-1">
                          <span className="text-sm text-foreground truncate mr-3">{goal}</span>
                          <div className="flex gap-1.5 shrink-0">
                            {PRIORITY_OPTIONS.map((p) => (
                              <button
                                key={p.value}
                                data-active={selectedGoals[goal]?.priority === p.value}
                                onClick={() => setPriority(goal, p.value)}
                                className={cn(
                                  'px-2.5 py-0.5 text-xs rounded-md border font-medium transition-all touch-manipulation',
                                  p.className
                                )}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>

                {/* Custom goals in this category */}
                {Object.entries(selectedGoals)
                  .filter(([key]) => key.startsWith(`custom_${category.id}_`))
                  .map(([key, goal]) => (
                    <div key={key} className="flex items-center justify-between py-1.5 px-1">
                      <span className="text-sm text-foreground truncate mr-3">{goal.label}</span>
                      <div className="flex gap-1.5 shrink-0">
                        {PRIORITY_OPTIONS.map((p) => (
                          <button
                            key={p.value}
                            data-active={selectedGoals[key]?.priority === p.value}
                            onClick={() => setPriority(key, p.value)}
                            className={cn(
                              'px-2.5 py-0.5 text-xs rounded-md border font-medium transition-all touch-manipulation',
                              p.className
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                {/* Custom Input */}
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Add a custom goal (optional)"
                    value={customInputs[category.id] || ''}
                    onChange={(e) =>
                      setCustomInputs((prev) => ({ ...prev, [category.id]: e.target.value }))
                    }
                    maxLength={80}
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomGoal(category.id);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => addCustomGoal(category.id)}
                    disabled={!customInputs[category.id]?.trim()}
                  >
                    Add
                  </Button>
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 sm:mt-10"
        >
          <Button
            onClick={handleSubmit}
            disabled={loading || totalSelected === 0}
            className="w-full h-12 text-base font-medium bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-soft"
          >
            {loading ? 'Preparing your plan...' : `Generate My Daily Plan${totalSelected > 0 ? ` (${totalSelected} goals)` : ''}`}
          </Button>
          {totalSelected === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Select at least one goal to continue
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
