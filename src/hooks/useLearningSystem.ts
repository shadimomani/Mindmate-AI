import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  logBehavior, 
  calculateDailyBehavior,
  getLearningProfile,
  getBehaviorInsights,
  type LearningProfile,
  type BehaviorInsights
} from "@/lib/learningSystem";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to automatically track and log user behavior for AI learning
 * Runs silently in the background without blocking UI
 */
export function useBehaviorTracking() {
  const { user } = useAuth();
  const lastLogDate = useRef<string | null>(null);

  const logDailyBehavior = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    
    // Only log once per day
    if (lastLogDate.current === today) return;

    const behaviorData = await calculateDailyBehavior(user.id);
    if (behaviorData && behaviorData.planned_tasks > 0) {
      const result = await logBehavior(behaviorData);
      if (result.success) {
        lastLogDate.current = today;
        console.log("[Learning System] Daily behavior logged:", result.signals);
      }
    }
  }, [user]);

  // Log behavior at end of day or when user leaves
  useEffect(() => {
    if (!user) return;

    // Check if it's late evening (after 8 PM) and log behavior
    const checkAndLog = () => {
      const hour = new Date().getHours();
      if (hour >= 20) {
        logDailyBehavior();
      }
    };

    // Check on mount
    checkAndLog();

    // Check every hour
    const interval = setInterval(checkAndLog, 60 * 60 * 1000);

    // Log when user leaves
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logDailyBehavior();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, logDailyBehavior]);

  return { logDailyBehavior };
}

/**
 * Hook to get the user's learning profile for adaptive AI recommendations
 */
export function useLearningProfile() {
  const { user } = useAuth();

  return useQuery<LearningProfile | null>({
    queryKey: ["learning-profile", user?.id],
    queryFn: getLearningProfile,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get behavior insights for analytics display
 */
export function useBehaviorInsights() {
  const { user } = useAuth();

  return useQuery<BehaviorInsights | null>({
    queryKey: ["behavior-insights", user?.id],
    queryFn: getBehaviorInsights,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to manually trigger behavior logging (e.g., after completing a plan)
 */
export function useManualBehaviorLog() {
  const { user } = useAuth();

  const logCurrentBehavior = useCallback(async (
    predictedCommitmentScore?: number
  ) => {
    if (!user) return null;

    const behaviorData = await calculateDailyBehavior(user.id);
    if (!behaviorData) return null;

    if (predictedCommitmentScore !== undefined) {
      behaviorData.predicted_commitment_score = predictedCommitmentScore;
    }

    return logBehavior(behaviorData);
  }, [user]);

  return { logCurrentBehavior };
}
