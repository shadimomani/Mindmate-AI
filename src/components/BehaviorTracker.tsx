import { useEffect } from "react";
import { useBehaviorTracking } from "@/hooks/useLearningSystem";

/**
 * Silent background component that tracks user behavior for AI learning
 * This component renders nothing but handles behavior logging automatically
 */
export function BehaviorTracker() {
  const { logDailyBehavior } = useBehaviorTracking();

  // Also log when app unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable logging on page close
      logDailyBehavior();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [logDailyBehavior]);

  return null; // Renders nothing
}
