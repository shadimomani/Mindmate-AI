// Daily cron job: runs end-of-day behavior analysis for every user.
// Triggered by pg_cron — secured via SEND_REMINDERS_SECRET header.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface BehaviorLog {
  user_id: string;
  planned_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  planned_date: string;
  mood_at_planning?: string | null;
  mood_at_completion?: string | null;
  tasks_completed_times: string[];
  tasks_skipped_times: string[];
}

// ── Signal detection (mirrors analyze-behavior logic, simplified) ──
function detectSignals(recentLogs: any[], current: BehaviorLog) {
  const signals = {
    overplanning_detected: false,
    undercommitment_detected: false,
    motivation_drop_pattern: false,
    consistent_time_failure: false,
    task_complexity_too_high: false,
    optimistic_bias: false,
  };

  if (recentLogs.length < 3) return signals;

  const last7 = recentLogs.slice(0, 7);
  const avgCompletion =
    last7.reduce((s, l) => s + (l.completion_rate || 0), 0) / last7.length;

  // Overplanning: many tasks, low completion
  const avgPlanned = last7.reduce((s, l) => s + l.planned_tasks, 0) / last7.length;
  if (avgPlanned >= 4 && avgCompletion < 50) signals.overplanning_detected = true;

  // Undercommitment: few tasks, very high completion
  if (avgPlanned <= 2 && avgCompletion > 90) signals.undercommitment_detected = true;

  // Motivation drop: declining completion
  if (last7.length >= 5) {
    const firstHalf = last7.slice(0, Math.floor(last7.length / 2));
    const secondHalf = last7.slice(Math.floor(last7.length / 2));
    const fAvg = firstHalf.reduce((s, l) => s + l.completion_rate, 0) / firstHalf.length;
    const sAvg = secondHalf.reduce((s, l) => s + l.completion_rate, 0) / secondHalf.length;
    if (fAvg - sAvg > 25) signals.motivation_drop_pattern = true;
  }

  // Optimistic bias: predicted >> actual
  const withPredictions = recentLogs.filter((l) => l.predicted_commitment_score);
  if (withPredictions.length >= 3) {
    const avgGap =
      withPredictions.reduce(
        (s, l) => s + (l.predicted_commitment_score - l.completion_rate),
        0
      ) / withPredictions.length;
    if (avgGap > 25) signals.optimistic_bias = true;
  }

  if (avgCompletion < 30) signals.task_complexity_too_high = true;

  // Consistent time failure: same low-productivity hours repeatedly
  const skipHours: Record<number, number> = {};
  recentLogs.forEach((l) => {
    (l.tasks_skipped_times || []).forEach((t: string) => {
      const h = new Date(t).getHours();
      skipHours[h] = (skipHours[h] || 0) + 1;
    });
  });
  if (Object.values(skipHours).some((c) => c >= 5)) signals.consistent_time_failure = true;

  return signals;
}

function calculateAdaptations(recentLogs: any[], signals: any) {
  const last7 = recentLogs.slice(0, 7);
  const avgCompletion =
    last7.length > 0
      ? last7.reduce((s, l) => s + (l.completion_rate || 0), 0) / last7.length
      : 0;
  const avgPlanned =
    last7.length > 0 ? last7.reduce((s, l) => s + l.planned_tasks, 0) / last7.length : 3;

  let recommended_daily_tasks = Math.round(avgPlanned);
  if (signals.overplanning_detected) recommended_daily_tasks = Math.max(2, Math.round(avgPlanned * 0.6));
  if (signals.undercommitment_detected) recommended_daily_tasks = Math.min(5, Math.round(avgPlanned + 1));

  let recommended_tone: "balanced" | "encouraging" | "challenging" = "balanced";
  if (signals.motivation_drop_pattern) recommended_tone = "encouraging";
  else if (signals.undercommitment_detected) recommended_tone = "challenging";

  let recommended_structure: "standard" | "conservative" | "flexible" = "standard";
  if (signals.optimistic_bias || signals.overplanning_detected) recommended_structure = "conservative";
  else if (signals.consistent_time_failure) recommended_structure = "flexible";

  const optimal_task_complexity = signals.task_complexity_too_high
    ? "low"
    : avgCompletion > 75
    ? "high"
    : "medium";

  // Productivity hours from completed task timestamps
  const completedHours: Record<number, number> = {};
  const skippedHours: Record<number, number> = {};
  recentLogs.forEach((l) => {
    (l.tasks_completed_times || []).forEach((t: string) => {
      const h = new Date(t).getHours();
      completedHours[h] = (completedHours[h] || 0) + 1;
    });
    (l.tasks_skipped_times || []).forEach((t: string) => {
      const h = new Date(t).getHours();
      skippedHours[h] = (skippedHours[h] || 0) + 1;
    });
  });
  const peak_productivity_hours = Object.entries(completedHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => parseInt(h));
  const low_productivity_hours = Object.entries(skippedHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => parseInt(h));

  return {
    recommended_daily_tasks,
    recommended_tone,
    recommended_structure,
    optimal_task_complexity,
    peak_productivity_hours,
    low_productivity_hours,
    avg_completion_rate: Number(avgCompletion.toFixed(2)),
  };
}

async function analyzeUser(supabase: any, userId: string, dateStr: string) {
  // Pull today's tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("completed, created_at, updated_at")
    .eq("user_id", userId)
    .gte("created_at", `${dateStr}T00:00:00`)
    .lte("created_at", `${dateStr}T23:59:59`);

  const planned = tasks?.length || 0;
  if (planned === 0) return { skipped: true, reason: "no_tasks" };

  const completed = tasks?.filter((t: any) => t.completed).length || 0;
  const completion_rate = (completed / planned) * 100;

  const { data: moods } = await supabase
    .from("mood_entries")
    .select("mood_label, created_at")
    .eq("user_id", userId)
    .gte("created_at", `${dateStr}T00:00:00`)
    .order("created_at", { ascending: true })
    .limit(2);

  const log: BehaviorLog = {
    user_id: userId,
    planned_tasks: planned,
    completed_tasks: completed,
    completion_rate,
    planned_date: dateStr,
    mood_at_planning: moods?.[0]?.mood_label ?? null,
    mood_at_completion: moods?.[moods.length - 1]?.mood_label ?? null,
    tasks_completed_times:
      tasks?.filter((t: any) => t.completed && t.updated_at).map((t: any) => t.updated_at) || [],
    tasks_skipped_times:
      tasks?.filter((t: any) => !t.completed).map((t: any) => t.created_at) || [],
  };

  // Upsert log (one per user per day)
  await supabase
    .from("user_behavior_logs")
    .upsert(
      {
        user_id: userId,
        planned_tasks: planned,
        completed_tasks: completed,
        completion_rate,
        planned_date: dateStr,
        mood_at_planning: log.mood_at_planning,
        mood_at_completion: log.mood_at_completion,
        tasks_completed_times: log.tasks_completed_times,
        tasks_skipped_times: log.tasks_skipped_times,
      },
      { onConflict: "user_id,planned_date" }
    );

  // Recent logs for signal detection
  const { data: recentLogs } = await supabase
    .from("user_behavior_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const signals = detectSignals(recentLogs || [], log);
  const adaptations = calculateAdaptations(recentLogs || [], signals);

  await supabase.from("user_learning_profiles").upsert(
    {
      user_id: userId,
      ...signals,
      ...adaptations,
      total_interactions: (recentLogs?.length || 0),
      last_analysis_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return { ok: true, signals, adaptations };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth via shared cron secret
  const provided = req.headers.get("x-cron-secret") ?? "";
  const expected = Deno.env.get("SEND_REMINDERS_SECRET") ?? "";
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Yesterday in UTC (cron runs after midnight)
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  const dateStr = d.toISOString().split("T")[0];

  // Distinct users active recently (last 14 days)
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 14);
  const { data: activeUsers } = await supabase
    .from("tasks")
    .select("user_id")
    .gte("created_at", since.toISOString());

  const userIds = Array.from(new Set((activeUsers || []).map((u: any) => u.user_id)));

  const results: any[] = [];
  for (const uid of userIds) {
    try {
      const r = await analyzeUser(supabase, uid, dateStr);
      results.push({ user_id: uid, ...r });
    } catch (e) {
      results.push({ user_id: uid, error: String(e) });
    }
  }

  return new Response(
    JSON.stringify({
      date: dateStr,
      analyzed: results.length,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
