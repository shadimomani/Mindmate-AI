import { supabase } from "@/integrations/supabase/client";

type TaskCategory = "work" | "personal" | "leisure";

export interface AdaptiveLimits {
  work: number;
  personal: number;
  leisure: number;
  total: number;
  completionRate: number;
  consistencyLevel: "high" | "moderate" | "low";
}

const BASE_LIMITS: Record<TaskCategory, number> = {
  work: 4,
  personal: 3,
  leisure: 2,
};

const MIN_LIMITS: Record<TaskCategory, number> = {
  work: 2,
  personal: 1,
  leisure: 1,
};

const MAX_LIMITS: Record<TaskCategory, number> = {
  work: 6,
  personal: 4,
  leisure: 3,
};

/**
 * Calculate adaptive task limits based on user's recent performance.
 * Adjustments are gradual (max ±1 per section) to avoid abrupt changes.
 */
export async function calculateAdaptiveLimits(userId: string): Promise<AdaptiveLimits> {
  const defaults: AdaptiveLimits = {
    work: BASE_LIMITS.work,
    personal: BASE_LIMITS.personal,
    leisure: BASE_LIMITS.leisure,
    total: BASE_LIMITS.work + BASE_LIMITS.personal + BASE_LIMITS.leisure,
    completionRate: 0,
    consistencyLevel: "moderate",
  };

  try {
    // Get last 7 days of tasks
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentTasks } = await supabase
      .from("tasks")
      .select("completed, category, estimated_time, created_at")
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString());

    if (!recentTasks || recentTasks.length < 3) {
      return defaults; // Not enough data, use defaults
    }

    // Calculate per-section completion rates
    const sectionStats: Record<TaskCategory, { completed: number; total: number; totalTime: number }> = {
      work: { completed: 0, total: 0, totalTime: 0 },
      personal: { completed: 0, total: 0, totalTime: 0 },
      leisure: { completed: 0, total: 0, totalTime: 0 },
    };

    for (const task of recentTasks) {
      const cat = (task.category || "work") as TaskCategory;
      if (sectionStats[cat]) {
        sectionStats[cat].total++;
        sectionStats[cat].totalTime += task.estimated_time || 15;
        if (task.completed) sectionStats[cat].completed++;
      }
    }

    const totalCompleted = recentTasks.filter(t => t.completed).length;
    const overallRate = totalCompleted / recentTasks.length;

    // Determine consistency level
    let consistencyLevel: "high" | "moderate" | "low";
    if (overallRate >= 0.8) consistencyLevel = "high";
    else if (overallRate >= 0.5) consistencyLevel = "moderate";
    else consistencyLevel = "low";

    // Calculate adaptive limits per section
    const limits: Record<TaskCategory, number> = { ...BASE_LIMITS };

    for (const cat of ["work", "personal", "leisure"] as TaskCategory[]) {
      const stats = sectionStats[cat];
      if (stats.total < 2) continue; // Not enough section data

      const sectionRate = stats.completed / stats.total;

      // Gradual adjustment: max ±1 from base
      if (sectionRate >= 0.85 && consistencyLevel === "high") {
        limits[cat] = Math.min(BASE_LIMITS[cat] + 1, MAX_LIMITS[cat]);
      } else if (sectionRate < 0.4) {
        limits[cat] = Math.max(BASE_LIMITS[cat] - 1, MIN_LIMITS[cat]);
      } else if (consistencyLevel === "low") {
        limits[cat] = Math.max(BASE_LIMITS[cat] - 1, MIN_LIMITS[cat]);
      }
    }

    // Time-aware: if average daily time exceeds ~3 hours, reduce slightly
    const daysActive = new Set(
      recentTasks.map(t => new Date(t.created_at).toDateString())
    ).size || 1;
    const avgDailyMinutes = recentTasks.reduce((sum, t) => sum + (t.estimated_time || 15), 0) / daysActive;

    if (avgDailyMinutes > 180) {
      // User is overloading, trim the highest section
      const highest = (Object.entries(limits) as [TaskCategory, number][])
        .sort((a, b) => b[1] - a[1])[0][0];
      limits[highest] = Math.max(limits[highest] - 1, MIN_LIMITS[highest]);
    }

    return {
      ...limits,
      total: limits.work + limits.personal + limits.leisure,
      completionRate: Math.round(overallRate * 100),
      consistencyLevel,
    };
  } catch (error) {
    console.error("[Commitment Algorithm] Error:", error);
    return defaults;
  }
}

/**
 * Smart task selection: pick the most relevant tasks for today from a larger pool.
 * Prioritizes by: priority level > recency > time balance.
 */
export function selectSmartTasks<T extends { priority: string | null; created_at: string; estimated_time: number }>(
  tasks: T[],
  limit: number
): T[] {
  if (tasks.length <= limit) return tasks;

  const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

  const scored = tasks.map(t => ({
    task: t,
    score:
      (priorityWeight[t.priority || "medium"] || 2) * 10 +
      // Newer tasks get slight boost
      Math.min(5, Math.floor((Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24))),
  }));

  // Sort by score descending, then pick top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.task);
}
