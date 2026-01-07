import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { GoalsPlanData } from '@/components/goals/GoalsOnboarding';

interface GoalsContextType {
  needsGoalsOnboarding: boolean;
  goalsCompleted: boolean;
  currentPlan: GoalsPlanData | null;
  isLoading: boolean;
  completeGoalsOnboarding: (plan: GoalsPlanData) => void;
  restartGoalsOnboarding: () => Promise<void>;
  refreshPlan: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [needsGoalsOnboarding, setNeedsGoalsOnboarding] = useState(false);
  const [goalsCompleted, setGoalsCompleted] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<GoalsPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoalsStatus = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if user has completed goals onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('goals_completed')
        .eq('id', user.id)
        .single();

      const completed = profile?.goals_completed ?? false;
      setGoalsCompleted(completed);
      setNeedsGoalsOnboarding(!completed);

      // If completed, fetch the plan
      if (completed) {
        const { data: goals } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (goals) {
          setCurrentPlan({
            analysis: goals.ai_analysis as GoalsPlanData['analysis'],
            daily_schedule: goals.daily_schedule as GoalsPlanData['daily_schedule'],
            task_priorities: [],
            commitment_score: goals.commitment_score ?? 5,
            motivational_feedback: goals.motivational_feedback ?? '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching goals status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoalsStatus();
  }, [fetchGoalsStatus]);

  const completeGoalsOnboarding = useCallback((plan: GoalsPlanData) => {
    setCurrentPlan(plan);
    setGoalsCompleted(true);
    setNeedsGoalsOnboarding(false);
  }, []);

  const restartGoalsOnboarding = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ goals_completed: false })
        .eq('id', user.id);

      await supabase
        .from('user_goals')
        .delete()
        .eq('user_id', user.id);

      setGoalsCompleted(false);
      setNeedsGoalsOnboarding(true);
      setCurrentPlan(null);
    } catch (error) {
      console.error('Error restarting goals onboarding:', error);
    }
  }, [user]);

  const refreshPlan = useCallback(async () => {
    await fetchGoalsStatus();
  }, [fetchGoalsStatus]);

  return (
    <GoalsContext.Provider
      value={{
        needsGoalsOnboarding,
        goalsCompleted,
        currentPlan,
        isLoading,
        completeGoalsOnboarding,
        restartGoalsOnboarding,
        refreshPlan,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within GoalsProvider');
  }
  return context;
};
