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

    const { biggest_problem, main_goal } = await req.json();
    if (!biggest_problem || !main_goal) throw new Error("Both answers are required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    // Call AI to analyze and generate plan
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are Mindmate's lightweight behavioral analysis engine. Your job is to read two short user answers and produce a realistic first daily plan.

STEP 1 — Infer behavioral signals from the text:
• Goal type: identify the life domain (e.g. Study, Fitness, Work, Learning, Content Creation, Business, Personal Organization).
• Problem type: classify the core difficulty (e.g. Procrastination, Lack of focus, Overwhelm, Inconsistency, Time management).
• Commitment estimation: assess the user's language.
  - Low commitment cues: "I struggle", "I keep delaying", "I can't stay consistent".
  - Higher commitment cues: "I want to improve", "I want to achieve", "I'm ready to change".
  Use these cues to set motivation_level (low/moderate/high) and commitment_estimate (1-10).

STEP 2 — Generate the plan:
• Total tasks: 3 (increase to 4-5 only if commitment is high).
• Categories: "work" (professional/academic), "personal" (health, growth, relationships), "leisure" (rest, hobbies, recovery).
• Always include at least one task from each category to maintain life balance.
• MICRO WINS RULE — Every task MUST be a small, concrete, measurable action completable in 5–20 minutes. Never use vague tasks.
  - BAD: "Study mathematics", "Exercise for 1 hour", "Work on project"
  - GOOD: "Read 3 pages of chapter 5", "Do 15 push-ups", "Write 1 paragraph of project intro", "Walk for 10 minutes", "Review 5 flashcards"
• Each task title must include a specific number or concrete deliverable so the user knows exactly when it's done.
• Priority: "high" for goal-aligned, "medium" for supporting, "low" for balance/rest.
• If commitment is low, keep all tasks ≤ 15 minutes and prefer 3 total.

You MUST use the generate_plan tool to return your response.`
          },
          {
            role: "user",
            content: `My biggest problem: ${biggest_problem}\nMy main goal: ${main_goal}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_plan",
              description: "Generate the user's first daily plan with 3-5 tasks across life domains",
              parameters: {
                type: "object",
                properties: {
                  analysis: {
                    type: "object",
                    properties: {
                      goal_type: { type: "string", description: "Detected life domain, e.g. Study, Fitness, Work" },
                      problem_type: { type: "string", description: "Core difficulty, e.g. Procrastination, Overwhelm, Lack of focus" },
                      motivation_level: { type: "string", enum: ["high", "moderate", "low"] },
                      commitment_estimate: { type: "number", description: "1-10 scale based on language cues" },
                      recommended_daily_tasks: { type: "number", description: "3-5" }
                    },
                    required: ["goal_type", "problem_type", "motivation_level", "commitment_estimate", "recommended_daily_tasks"]
                  },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short, actionable task title" },
                        category: { type: "string", enum: ["work", "personal", "leisure"] },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        estimated_time: { type: "number", description: "Minutes (15-60)" }
                      },
                      required: ["title", "category", "priority", "estimated_time"]
                    },
                    minItems: 3,
                    maxItems: 5
                  },
                  motivational_message: { type: "string", description: "A brief encouraging message for the user" }
                },
                required: ["analysis", "tasks", "motivational_message"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_plan" } }
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();

    // Robust parsing: handle both tool-call and direct JSON responses
    let plan: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args = toolCall.function.arguments;
      plan = typeof args === "string" ? JSON.parse(args) : args;
    } else {
      // Fallback: try parsing from content directly
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI did not return a valid plan");
      }
    }

    // Validate minimum structure
    if (!plan.tasks || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
      throw new Error("AI returned an empty plan");
    }
    if (!plan.analysis) {
      plan.analysis = { goal_type: "General", problem_type: "Unknown", motivation_level: "moderate", commitment_estimate: 5, recommended_daily_tasks: 3 };
    }

    // Save goals
    await supabase.from("user_goals").upsert([{
      user_id: user.id,
      main_goal: main_goal,
      biggest_problem: biggest_problem,
      ai_analysis: plan.analysis,
      motivational_feedback: plan.motivational_message,
      commitment_score: plan.analysis.commitment_estimate,
    }], { onConflict: "user_id" });

    // Create tasks
    const taskInserts = plan.tasks.map((t: any, i: number) => ({
      user_id: user.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      estimated_time: t.estimated_time,
      sort_order: i,
      completed: false,
    }));

    await supabase.from("tasks").insert(taskInserts);

    // Mark onboarded
    await supabase.from("profiles").update({ onboarded: true, goals_completed: true }).eq("id", user.id);

    return new Response(JSON.stringify({
      tasks: plan.tasks,
      message: plan.motivational_message,
      analysis: plan.analysis,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("generate-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
