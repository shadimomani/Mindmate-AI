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

    const { text, source = "manual" } = await req.json();
    if (!text || typeof text !== "string") throw new Error("text is required");
    if (text.length > 3000) throw new Error("text must be 1-3000 characters");
    if (!["manual", "chat", "auto"].includes(source)) throw new Error("invalid source");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are Mindmate's memory extractor. Read the user's message and extract clear, durable facts about THEM that will help personalize their future plans.

Extract memories of these types:
- "preference" — how they like to work (e.g. "prefers mornings for deep work")
- "blocker" — recurring obstacle (e.g. "gets distracted by phone after 8pm")
- "goal" — long-term aim (e.g. "wants to learn Python in 3 months")
- "task" — recurring tasks/responsibilities they mentioned (e.g. "studies math every weekday")
- "fact" — anything else useful (e.g. "works night shifts on weekends")

Rules:
- Each memory is ONE concise sentence in third person ("user...").
- Only extract durable, actionable info. Skip greetings, vents, one-off events.
- importance: 1 (low) to 5 (very important). Goals/blockers usually 4-5.
- If nothing useful, return empty array.
- Output language: same as input.`
          },
          { role: "user", content: text }
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_memories",
            description: "Save extracted memories about the user",
            parameters: {
              type: "object",
              properties: {
                memories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      content: { type: "string" },
                      memory_type: { type: "string", enum: ["preference", "blocker", "goal", "task", "fact"] },
                      importance: { type: "number", minimum: 1, maximum: 5 },
                    },
                    required: ["content", "memory_type", "importance"]
                  }
                }
              },
              required: ["memories"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "save_memories" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      }
      throw new Error("AI extraction failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: { memories: any[] } = { memories: [] };
    if (toolCall) {
      const args = toolCall.function.arguments;
      parsed = typeof args === "string" ? JSON.parse(args) : args;
    }

    const memories = (parsed.memories || []).filter(m => m.content && m.content.length <= 500);

    if (memories.length === 0) {
      return new Response(JSON.stringify({ saved: 0, memories: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const inserts = memories.map(m => ({
      user_id: user.id,
      content: m.content,
      memory_type: m.memory_type || "fact",
      importance: Math.max(1, Math.min(5, m.importance || 3)),
      source,
    }));

    const { data: saved, error: saveError } = await supabase
      .from("user_memories")
      .insert(inserts)
      .select();

    if (saveError) {
      console.error("extract-memory save error:", saveError);
      throw new Error("Database operation failed");
    }

    return new Response(JSON.stringify({ saved: saved?.length || 0, memories: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("extract-memory error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
