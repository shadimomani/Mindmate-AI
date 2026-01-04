import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  triggerStep: (step: number) => void;
  restartOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const ONBOARDING_STEPS = {
  UPLOAD_BUTTON: 1,
  IMAGE_UPLOAD_AREA: 2,
  PAGE_CODE_SAMPLE: 3,
  AI_RESULTS: 4,
  DASHBOARD_PROGRESS: 5,
  COMPLETE: 6,
} as const;

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    if (!user || hasCheckedOnboarding) return;

    const checkOnboardingStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return;
      }

      if (data && !data.onboarded) {
        setIsOnboarding(true);
        setCurrentStep(1);
      }
      setHasCheckedOnboarding(true);
    };

    checkOnboardingStatus();
  }, [user, hasCheckedOnboarding]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const triggerStep = useCallback((step: number) => {
    if (isOnboarding && currentStep < step) {
      setCurrentStep(step);
    }
  }, [isOnboarding, currentStep]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ onboarded: true })
        .eq('id', user.id);

      setIsOnboarding(false);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, [user]);

  const skipOnboarding = useCallback(async () => {
    await completeOnboarding();
  }, [completeOnboarding]);

  const restartOnboarding = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ onboarded: false })
        .eq('id', user.id);

      setIsOnboarding(true);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  }, [user]);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        totalSteps: 5,
        nextStep,
        completeOnboarding,
        skipOnboarding,
        triggerStep,
        restartOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
