import { supabase } from "@/integrations/supabase/client";

/**
 * Mindmate Commitment Adaptation Algorithm
 *
 * Dynamically adjusts daily task volume based on the user's
 * recent completion rate. The system prioritises gradual adaptation,
 * psychological safety and long-term consistency over raw productivity.
 *
 * Constraints
 *   MAX  = 5 tasks / day
 *   REC  = 3 tasks / day (starting point)
 *   MIN  = 1 task  / day
 *
 * Adaptation rules (applied to yesterday's completion rate):
 *   rate > 0.80  → +1 task (capped at MAX)
 *   0.40 ≤ rate ≤ 0.80 → no change
 *   rate < 0.40  → −1 task (floored at MIN)
 */

const MAX_TASKS = 5;
const DEFAULT_TASKS = 3;
const MIN_TASKS = 1;

export interface AdaptiveLimits {
  /** Total tasks allowed today */
  total: number;
  /** Yesterday's completion rate (0-100) */
  completionRate: number;
  /** Qualitative consistency level */
  consistencyLevel: "high" | "moderate" | "low";
}

/**
 * Calculate today's adaptive task limit for a user.
 *
 * 1. Looks at the most recent full day with tasks.
 * 2. Computes completion_rate = completed / assigned.
 * 3. Adjusts from yesterday's assigned count by ±1 or 0.
 * 4. Falls back to DEFAULT_TASKS for brand-new users.
 */
export async function calculateAdaptiveLimits(
  userId: string
): Promise<AdaptiveLimits> {
  const defaults: AdaptiveLimits = {
    total: DEFAULT_TASKS,
    completionRate: 0,
    consistencyLevel: "moderate",
  };

  try {
    // Fetch the last 7 days of tasks (excluding today) to find the most
    // recent day with activity.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentTasks } = await supabase
      .from("tasks")
      .select("completed, created_at")
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString())
      .lt("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false });

    if (!recentTasks || recentTasks.length === 0) {
      return defaults;
    }

    // Group tasks by date and pick the most recent day
    const byDate: Record<string, { assigned: number; completed: number }> = {};
    for (const t of recentTasks) {
      const day = new Date(t.created_at).toDateString();
      if (!byDate[day]) byDate[day] = { assigned: 0, completed: 0 };
      byDate[day].assigned++;
      if (t.completed) byDate[day].completed++;
    }

    // Most recent day first
    const sortedDays = Object.entries(byDate).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );

    const [, lastDay] = sortedDays[0];
    const completionRate =
      lastDay.assigned > 0 ? lastDay.completed / lastDay.assigned : 0;

    // Determine consistency level from the full week
    const allRates = sortedDays.map(
      ([, d]) => (d.assigned > 0 ? d.completed / d.assigned : 0)
    );
    const avgRate =
      allRates.reduce((s, r) => s + r, 0) / allRates.length;

    let consistencyLevel: AdaptiveLimits["consistencyLevel"];
    if (avgRate >= 0.8) consistencyLevel = "high";
    else if (avgRate >= 0.4) consistencyLevel = "moderate";
    else consistencyLevel = "low";

    // Adaptation: start from yesterday's assigned count
    let nextTotal = lastDay.assigned;

    if (completionRate > 0.8) {
      nextTotal = Math.min(nextTotal + 1, MAX_TASKS);
    } else if (completionRate < 0.4) {
      nextTotal = Math.max(nextTotal - 1, MIN_TASKS);
    }
    // 0.40–0.80 → keep the same

    // Safety clamp
    nextTotal = Math.max(MIN_TASKS, Math.min(MAX_TASKS, nextTotal));

    return {
      total: nextTotal,
      completionRate: Math.round(completionRate * 100),
      consistencyLevel,
    };
  } catch (error) {
    console.error("[Commitment Algorithm] Error:", error);
    return defaults;
  }
}
