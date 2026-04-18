import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { brain_dump, reflection_completion, reflection_difficulty } = await req.json();
    if (!brain_dump) throw new Error("Brain dump is required");
    if (typeof brain_dump !== "string") throw new Error("Invalid brain_dump type");
    if (brain_dump.length > 3000) throw new Error("brain_dump must be 1-3000 characters");
    if (reflection_completion && (typeof reflection_completion !== "string" || reflection_completion.length > 100)) {
      throw new Error("reflection_completion must be a string up to 100 characters");
    }
    if (reflection_difficulty && (typeof reflection_difficulty !== "string" || reflection_difficulty.length > 1000)) {
      throw new Error("reflection_difficulty must be a string up to 1000 characters");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    // Fetch user goals for context
    const { data: goals } = await supabase
      .from("user_goals")
      .select("main_goal, biggest_problem, ai_analysis")
      .eq("user_id", user.id)
      .single();

    // Fetch last week's plan for continuity
    const { data: lastPlan } = await supabase
      .from("weekly_plans")
      .select("commitment_score, schedule")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch AI memories about the user (top 20 by importance + recency)
    const { data: memoriesData } = await supabase
      .from("user_memories")
      .select("content, memory_type, importance")
      .eq("user_id", user.id)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    const memories = memoriesData || [];
    const memoriesBlock = memories.length > 0
      ? memories.map((m: any) => `- [${m.memory_type}] ${m.content}`).join("\n")
      : "No personal memories saved yet.";
    const usedMemoryContents = memories.map((m: any) => m.content);

    const systemPrompt = `You are Mindmate's weekly planning engine. Your role is to analyze a user's weekly brain dump, evaluate their past execution behavior, estimate realistic commitment capacity, and generate a structured but achievable weekly plan.

CORE PRINCIPLES:
- Never overload the user with tasks
- Never generate unrealistic schedules
- Always prefer sustainability over intensity
- Clarity over complexity, consistency over intensity, progress over perfection

USER CONTEXT:
${goals ? `Main goal: ${goals.main_goal}\nBiggest problem: ${goals.biggest_problem}` : "No goals set yet."}
${lastPlan ? `Last week's commitment score: ${lastPlan.commitment_score}/10` : "First weekly plan."}

WHAT YOU KNOW ABOUT THE USER (from their saved memories — USE these to personalize the plan):
${memoriesBlock}

When you generate the plan, your feedback_message MUST briefly mention 1-2 specific memories you used (e.g. "Since you focus best in the mornings, I scheduled deep-work tasks before noon."). This builds trust through transparency.

COMMITMENT ALGORITHM:
${reflection_completion ? `
The user reflected on last week:
- Completed most tasks: "${reflection_completion}" (yes/some/not really)
- What made it difficult: "${reflection_difficulty || 'not specified'}"

Base score calculation:
- "yes" → base 7
- "some" → base 5  
- "not really" → base 3

Adjust down if: burnout, stress, too many tasks, lack of time, exhaustion
Adjust up slightly if: distractions, poor planning, procrastination awareness
Final score: 1-10
` : "No reflection data — use moderate commitment (score 5)."}

TASK DENSITY RULES (based on commitment score):
- Score 1-3: Max 1-2 tasks/day, focus on momentum
- Score 4-6: 2-3 tasks/day, balanced and flexible
- Score 7-8: 3-4 tasks/day, structured focus blocks
- Score 9-10: Up to 5 tasks/day, optimized productivity

TASK DISTRIBUTION:
- Distribute across Monday-Saturday
- Sunday must remain light or reflective
- Alternate demanding and lighter tasks
- Avoid clustering difficult tasks on one day
- Each task must be a concrete, specific micro-win (5-20 min)

PRIORITY DETECTION:
- Identify top priorities based on goal alignment, urgency, and complexity
- Return ordered from most to least important

You MUST use the generate_weekly_plan tool to return your response.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here's what I want to get done this week:\n\n${brain_dump}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_weekly_plan",
              description: "Generate a structured weekly plan with daily task distribution",
              parameters: {
                type: "object",
                properties: {
                  weekly_schedule: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
                        tasks: {
                          type: "array",
                          items: { type: "string" },
                          description: "Concrete, specific micro-win tasks for this day"
                        },
                      },
                      required: ["day", "tasks"],
                    },
                  },
                  task_priorities: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top priorities ordered from most to least important",
                  },
                  commitment_score: {
                    type: "number",
                    description: "1-10 estimated commitment capacity",
                  },
                  feedback_message: {
                    type: "string",
                    description: "A calm, supportive, professional, short message. Never judgmental.",
                  },
                },
                required: ["weekly_schedule", "task_priorities", "commitment_score", "feedback_message"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_weekly_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();

    // Parse response
    let plan: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args = toolCall.function.arguments;
      plan = typeof args === "string" ? JSON.parse(args) : args;
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI did not return a valid plan");
      }
    }

    if (!plan.weekly_schedule || !Array.isArray(plan.weekly_schedule)) {
      throw new Error("AI returned an invalid schedule");
    }

    // Calculate week start (next Monday or current Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 2 : (8 - dayOfWeek) % 7 || 7;
    // If it's Saturday (planning day), the week starts on Monday
    const weekStart = new Date(now);
    if (dayOfWeek === 6) {
      weekStart.setDate(now.getDate() + 2); // Saturday → Monday
    } else if (dayOfWeek === 0) {
      weekStart.setDate(now.getDate() + 1); // Sunday → Monday
    } else {
      // If planning mid-week, use current week's Monday
      weekStart.setDate(now.getDate() - (dayOfWeek - 1));
    }
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Save weekly plan
    const { error: saveError } = await supabase.from("weekly_plans").upsert([{
      user_id: user.id,
      week_start: weekStartStr,
      brain_dump,
      reflection_completion: reflection_completion || null,
      reflection_difficulty: reflection_difficulty || null,
      commitment_score: Math.max(1, Math.min(10, plan.commitment_score || 5)),
      feedback_message: plan.feedback_message,
      schedule: plan.weekly_schedule,
      task_priorities: plan.task_priorities,
      status: "active",
    }], { onConflict: "user_id,week_start" });

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save weekly plan");
    }

    return new Response(JSON.stringify({
      weekly_schedule: plan.weekly_schedule,
      task_priorities: plan.task_priorities,
      commitment_score: plan.commitment_score,
      feedback_message: plan.feedback_message,
      week_start: weekStartStr,
      memories_used: usedMemoryContents,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-weekly-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
