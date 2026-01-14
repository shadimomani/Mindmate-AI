import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BehaviorLog {
  planned_tasks: number;
  completed_tasks: number;
  predicted_commitment_score?: number;
  mood_at_planning?: string;
  mood_at_completion?: string;
  planned_date: string;
  tasks_completed_times?: string[];
  tasks_skipped_times?: string[];
}

interface LearningSignals {
  overplanning_detected: boolean;
  undercommitment_detected: boolean;
  motivation_drop_pattern: boolean;
  consistent_time_failure: boolean;
  task_complexity_too_high: boolean;
  optimistic_bias: boolean;
}

interface LearningProfile {
  avg_completion_rate: number;
  avg_commitment_accuracy: number;
  preferred_task_volume: number;
  optimal_task_complexity: string;
  recommended_daily_tasks: number;
  recommended_tone: string;
  recommended_structure: string;
  peak_productivity_hours: number[];
  low_productivity_hours: number[];
  total_interactions: number;
}

// Rule-based learning signal detection
function detectLearningSignals(
  recentLogs: any[],
  currentLog: BehaviorLog
): { signals: LearningSignals; sessionSignals: string[] } {
  const sessionSignals: string[] = [];
  const signals: LearningSignals = {
    overplanning_detected: false,
    undercommitment_detected: false,
    motivation_drop_pattern: false,
    consistent_time_failure: false,
    task_complexity_too_high: false,
    optimistic_bias: false,
  };

  // Calculate current completion rate
  const completionRate = currentLog.planned_tasks > 0 
    ? (currentLog.completed_tasks / currentLog.planned_tasks) * 100 
    : 0;

  // Overplanning: consistently planning more tasks than completing (< 50% completion rate over 5+ sessions)
  const lowCompletionLogs = recentLogs.filter(log => log.completion_rate < 50);
  if (lowCompletionLogs.length >= 5 && completionRate < 50) {
    signals.overplanning_detected = true;
    sessionSignals.push("overplanning_detected");
  }

  // Undercommitment: completing all tasks easily but not challenging self
  const fullCompletionLogs = recentLogs.filter(log => log.completion_rate === 100 && log.planned_tasks < 3);
  if (fullCompletionLogs.length >= 3) {
    signals.undercommitment_detected = true;
    sessionSignals.push("undercommitment_detected");
  }

  // Motivation drop pattern: declining completion rates over time
  if (recentLogs.length >= 5) {
    const recentRates = recentLogs.slice(0, 5).map(l => l.completion_rate);
    const isDecreasing = recentRates.every((rate, i, arr) => 
      i === 0 || rate <= arr[i - 1]
    );
    if (isDecreasing && recentRates[recentRates.length - 1] < recentRates[0] * 0.7) {
      signals.motivation_drop_pattern = true;
      sessionSignals.push("motivation_drop_pattern");
    }
  }

  // Consistent time failure: tasks skipped at similar times repeatedly
  const skippedTimePatterns = recentLogs
    .filter(log => log.tasks_skipped_times && log.tasks_skipped_times.length > 0)
    .flatMap(log => log.tasks_skipped_times);
  
  if (skippedTimePatterns.length >= 10) {
    // Check for pattern (simplified: if same hour appears 5+ times)
    const hourCounts: Record<string, number> = {};
    skippedTimePatterns.forEach((time: string) => {
      const hour = new Date(time).getHours().toString();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    if (Object.values(hourCounts).some(count => count >= 5)) {
      signals.consistent_time_failure = true;
      sessionSignals.push("consistent_time_failure");
    }
  }

  // Task complexity too high: consistently low completion with high predicted commitment
  const highPredictionLowCompletion = recentLogs.filter(
    log => log.predicted_commitment_score >= 80 && log.completion_rate < 40
  );
  if (highPredictionLowCompletion.length >= 3) {
    signals.task_complexity_too_high = true;
    sessionSignals.push("task_complexity_too_high");
  }

  // Optimistic bias: AI predicts high but reality is consistently low
  const predictionAccuracyLogs = recentLogs.filter(
    log => log.predicted_commitment_score && log.prediction_accuracy !== null
  );
  if (predictionAccuracyLogs.length >= 5) {
    const avgAccuracy = predictionAccuracyLogs.reduce((sum, log) => sum + (log.prediction_accuracy || 0), 0) / predictionAccuracyLogs.length;
    if (avgAccuracy < 60) {
      signals.optimistic_bias = true;
      sessionSignals.push("optimistic_bias");
    }
  }

  return { signals, sessionSignals };
}

// Calculate adaptive recommendations based on learning
function calculateAdaptations(
  recentLogs: any[],
  signals: LearningSignals,
  currentProfile: any
): Partial<LearningProfile> {
  const adaptations: Partial<LearningProfile> = {};

  // Calculate average completion rate
  if (recentLogs.length > 0) {
    adaptations.avg_completion_rate = 
      recentLogs.reduce((sum, log) => sum + log.completion_rate, 0) / recentLogs.length;
  }

  // Calculate commitment accuracy
  const logsWithPrediction = recentLogs.filter(log => log.prediction_accuracy !== null);
  if (logsWithPrediction.length > 0) {
    adaptations.avg_commitment_accuracy = 
      logsWithPrediction.reduce((sum, log) => sum + log.prediction_accuracy, 0) / logsWithPrediction.length;
  }

  // Determine optimal task volume
  const completedTasksAvg = recentLogs.length > 0
    ? recentLogs.reduce((sum, log) => sum + log.completed_tasks, 0) / recentLogs.length
    : 5;
  
  adaptations.preferred_task_volume = Math.round(completedTasksAvg);

  // Adjust recommended daily tasks based on signals
  let recommendedTasks = currentProfile?.recommended_daily_tasks || 5;
  
  if (signals.overplanning_detected) {
    recommendedTasks = Math.max(2, recommendedTasks - 2);
  }
  if (signals.undercommitment_detected) {
    recommendedTasks = Math.min(10, recommendedTasks + 2);
  }
  if (signals.task_complexity_too_high) {
    recommendedTasks = Math.max(2, recommendedTasks - 1);
  }
  
  adaptations.recommended_daily_tasks = recommendedTasks;

  // Adjust recommended tone
  if (signals.motivation_drop_pattern) {
    adaptations.recommended_tone = "encouraging";
  } else if (signals.undercommitment_detected) {
    adaptations.recommended_tone = "challenging";
  } else {
    adaptations.recommended_tone = "balanced";
  }

  // Adjust structure recommendation
  if (signals.consistent_time_failure) {
    adaptations.recommended_structure = "flexible";
  } else if (signals.optimistic_bias) {
    adaptations.recommended_structure = "conservative";
  } else {
    adaptations.recommended_structure = "standard";
  }

  // Determine task complexity
  const avgCompletionRate = adaptations.avg_completion_rate || 50;
  if (avgCompletionRate >= 80) {
    adaptations.optimal_task_complexity = "high";
  } else if (avgCompletionRate >= 50) {
    adaptations.optimal_task_complexity = "medium";
  } else {
    adaptations.optimal_task_complexity = "low";
  }

  // Analyze time patterns
  const completedTimes = recentLogs
    .filter(log => log.tasks_completed_times && log.tasks_completed_times.length > 0)
    .flatMap(log => log.tasks_completed_times);
  
  const skippedTimes = recentLogs
    .filter(log => log.tasks_skipped_times && log.tasks_skipped_times.length > 0)
    .flatMap(log => log.tasks_skipped_times);

  if (completedTimes.length > 0) {
    const hourCounts: Record<number, number> = {};
    completedTimes.forEach((time: string) => {
      const hour = new Date(time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    adaptations.peak_productivity_hours = sortedHours;
  }

  if (skippedTimes.length > 0) {
    const hourCounts: Record<number, number> = {};
    skippedTimes.forEach((time: string) => {
      const hour = new Date(time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    adaptations.low_productivity_hours = sortedHours;
  }

  adaptations.total_interactions = (currentProfile?.total_interactions || 0) + 1;

  return adaptations;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, behaviorData } = await req.json();

    if (action === "log_behavior") {
      // Log new behavior and update learning profile
      const logData: BehaviorLog = behaviorData;
      
      // Calculate completion rate and prediction accuracy
      const completionRate = logData.planned_tasks > 0 
        ? (logData.completed_tasks / logData.planned_tasks) * 100 
        : 0;
      
      let predictionAccuracy = null;
      if (logData.predicted_commitment_score) {
        predictionAccuracy = 100 - Math.abs(logData.predicted_commitment_score - completionRate);
      }

      // Fetch recent logs for pattern analysis
      const { data: recentLogs } = await supabase
        .from("user_behavior_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch current learning profile
      const { data: currentProfile } = await supabase
        .from("user_learning_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Detect learning signals
      const { signals, sessionSignals } = detectLearningSignals(recentLogs || [], logData);

      // Insert behavior log
      const { error: logError } = await supabase
        .from("user_behavior_logs")
        .insert({
          user_id: user.id,
          planned_tasks: logData.planned_tasks,
          completed_tasks: logData.completed_tasks,
          completion_rate: completionRate,
          predicted_commitment_score: logData.predicted_commitment_score,
          actual_follow_through: completionRate,
          prediction_accuracy: predictionAccuracy,
          mood_at_planning: logData.mood_at_planning,
          mood_at_completion: logData.mood_at_completion,
          planned_date: logData.planned_date,
          tasks_completed_times: logData.tasks_completed_times || [],
          tasks_skipped_times: logData.tasks_skipped_times || [],
          session_signals: sessionSignals,
        });

      if (logError) {
        console.error("Error logging behavior:", logError);
        return new Response(JSON.stringify({ error: "Failed to log behavior" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate adaptations
      const allLogs = [
        { 
          ...logData, 
          completion_rate: completionRate, 
          prediction_accuracy: predictionAccuracy 
        }, 
        ...(recentLogs || [])
      ];
      const adaptations = calculateAdaptations(allLogs, signals, currentProfile);

      // Upsert learning profile
      const { error: profileError } = await supabase
        .from("user_learning_profiles")
        .upsert({
          user_id: user.id,
          ...signals,
          ...adaptations,
          last_analysis_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (profileError) {
        console.error("Error updating learning profile:", profileError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        signals: sessionSignals,
        adaptations 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_learning_profile") {
      // Fetch learning profile for AI plan generation
      const { data: profile, error } = await supabase
        .from("user_learning_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching learning profile:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch profile" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return default profile if none exists
      const defaultProfile = {
        recommended_daily_tasks: 5,
        recommended_tone: "balanced",
        recommended_structure: "flexible",
        optimal_task_complexity: "medium",
        overplanning_detected: false,
        undercommitment_detected: false,
        motivation_drop_pattern: false,
        consistent_time_failure: false,
        task_complexity_too_high: false,
        optimistic_bias: false,
        avg_completion_rate: 0,
        avg_commitment_accuracy: 0,
        peak_productivity_hours: [],
        low_productivity_hours: [],
        total_interactions: 0,
      };

      return new Response(JSON.stringify({ 
        profile: profile || defaultProfile 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_behavior_insights") {
      // Get insights for analytics/dashboard
      const { data: logs } = await supabase
        .from("user_behavior_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      const { data: profile } = await supabase
        .from("user_learning_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      return new Response(JSON.stringify({ 
        logs: logs || [], 
        profile: profile || null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-behavior:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
