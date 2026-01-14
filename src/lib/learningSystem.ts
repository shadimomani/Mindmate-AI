import { supabase } from "@/integrations/supabase/client";

export interface LearningProfile {
  recommended_daily_tasks: number;
  recommended_tone: "balanced" | "encouraging" | "challenging";
  recommended_structure: "flexible" | "conservative" | "standard";
  optimal_task_complexity: "low" | "medium" | "high";
  overplanning_detected: boolean;
  undercommitment_detected: boolean;
  motivation_drop_pattern: boolean;
  consistent_time_failure: boolean;
  task_complexity_too_high: boolean;
  optimistic_bias: boolean;
  avg_completion_rate: number;
  avg_commitment_accuracy: number;
  peak_productivity_hours: number[];
  low_productivity_hours: number[];
  total_interactions: number;
}

export interface BehaviorLogInput {
  planned_tasks: number;
  completed_tasks: number;
  predicted_commitment_score?: number;
  mood_at_planning?: string;
  mood_at_completion?: string;
  planned_date: string;
  tasks_completed_times?: string[];
  tasks_skipped_times?: string[];
}

export interface BehaviorInsights {
  logs: any[];
  profile: LearningProfile | null;
}

/**
 * Log user behavior for AI learning analysis
 * This runs silently in the background after task completion
 */
export async function logBehavior(behaviorData: BehaviorLogInput): Promise<{
  success: boolean;
  signals?: string[];
  adaptations?: Partial<LearningProfile>;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-behavior", {
      body: {
        action: "log_behavior",
        behaviorData,
      },
    });

    if (error) {
      console.error("Error logging behavior:", error);
      return { success: false };
    }

    return data;
  } catch (error) {
    console.error("Error in logBehavior:", error);
    return { success: false };
  }
}

/**
 * Get the user's learning profile for AI plan generation
 * This is called before generating new plans to adapt recommendations
 */
export async function getLearningProfile(): Promise<LearningProfile | null> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-behavior", {
      body: {
        action: "get_learning_profile",
      },
    });

    if (error) {
      console.error("Error fetching learning profile:", error);
      return null;
    }

    return data.profile;
  } catch (error) {
    console.error("Error in getLearningProfile:", error);
    return null;
  }
}

/**
 * Get behavior insights for analytics/dashboard display
 */
export async function getBehaviorInsights(): Promise<BehaviorInsights | null> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-behavior", {
      body: {
        action: "get_behavior_insights",
      },
    });

    if (error) {
      console.error("Error fetching behavior insights:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getBehaviorInsights:", error);
    return null;
  }
}

/**
 * Generate AI prompt adjustments based on learning profile
 * This creates context for AI to adapt its recommendations
 */
export function generateAdaptiveContext(profile: LearningProfile): string {
  const context: string[] = [];

  // Task volume adjustment
  context.push(`User's optimal daily task count: ${profile.recommended_daily_tasks} tasks.`);

  // Complexity adjustment
  context.push(`Recommended task complexity: ${profile.optimal_task_complexity}.`);

  // Tone adjustment
  if (profile.recommended_tone === "encouraging") {
    context.push("User shows motivation drop patterns - use encouraging, supportive language.");
  } else if (profile.recommended_tone === "challenging") {
    context.push("User consistently undercommits - gently push for more ambitious goals.");
  }

  // Structure adjustment
  if (profile.recommended_structure === "conservative") {
    context.push("User tends to overestimate - provide conservative, achievable plans.");
  } else if (profile.recommended_structure === "flexible") {
    context.push("User has inconsistent timing - suggest flexible time blocks instead of rigid schedules.");
  }

  // Specific pattern warnings
  if (profile.overplanning_detected) {
    context.push("IMPORTANT: User overplans frequently. Reduce task count and complexity.");
  }
  if (profile.task_complexity_too_high) {
    context.push("IMPORTANT: Tasks are often too complex. Break into smaller, simpler steps.");
  }
  if (profile.consistent_time_failure) {
    context.push(`Avoid scheduling during low productivity hours: ${profile.low_productivity_hours.join(", ") || "unknown"}.`);
  }
  if (profile.peak_productivity_hours.length > 0) {
    context.push(`Prioritize important tasks during peak hours: ${profile.peak_productivity_hours.join(", ")}.`);
  }

  // Historical context
  if (profile.total_interactions > 10) {
    context.push(`Based on ${profile.total_interactions} interactions, average completion rate is ${profile.avg_completion_rate.toFixed(1)}%.`);
  }

  return context.join("\n");
}

/**
 * Calculate daily behavior summary for end-of-day logging
 */
export async function calculateDailyBehavior(userId: string): Promise<BehaviorLogInput | null> {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    // Get today's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return null;
    }

    // Get today's mood entries
    const { data: moods, error: moodsError } = await supabase
      .from("mood_entries")
      .select("mood_label, created_at")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: true })
      .limit(2);

    if (moodsError) {
      console.error("Error fetching moods:", moodsError);
    }

    const plannedTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.completed).length || 0;
    
    const completedTimes = tasks
      ?.filter(t => t.completed && t.updated_at)
      .map(t => t.updated_at) || [];
    
    const skippedTimes = tasks
      ?.filter(t => !t.completed)
      .map(t => t.created_at) || [];

    return {
      planned_tasks: plannedTasks,
      completed_tasks: completedTasks,
      planned_date: today,
      mood_at_planning: moods?.[0]?.mood_label,
      mood_at_completion: moods?.[moods.length - 1]?.mood_label,
      tasks_completed_times: completedTimes,
      tasks_skipped_times: skippedTimes,
    };
  } catch (error) {
    console.error("Error calculating daily behavior:", error);
    return null;
  }
}
