import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { biggest_problem, main_goal } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert productivity coach and time management specialist. Analyze the user's problem and goal to create a personalized daily plan. Be specific, actionable, and encouraging. Create a realistic schedule that addresses their stated problem and moves them toward their goal.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `My biggest problem right now: ${biggest_problem}\n\nMy main goal: ${main_goal}` 
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_personalized_plan",
              description: "Create a personalized productivity plan based on user's problem and goal",
              parameters: {
                type: "object",
                properties: {
                  analysis: {
                    type: "object",
                    properties: {
                      time_management_issues: { type: "array", items: { type: "string" } },
                      motivation_level: { type: "string", enum: ["low", "medium", "high"] },
                      commitment_gaps: { type: "array", items: { type: "string" } }
                    },
                    required: ["time_management_issues", "motivation_level", "commitment_gaps"]
                  },
                  daily_schedule: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time: { type: "string" },
                        activity: { type: "string" },
                        duration: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] }
                      },
                      required: ["time", "activity", "duration", "priority"]
                    }
                  },
                  task_priorities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        reason: { type: "string" }
                      },
                      required: ["task", "priority", "reason"]
                    }
                  },
                  commitment_score: { type: "number", minimum: 1, maximum: 10 },
                  motivational_feedback: { type: "string" }
                },
                required: ["analysis", "daily_schedule", "task_priorities", "commitment_score", "motivational_feedback"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_personalized_plan" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'create_personalized_plan') {
      throw new Error('No valid tool call in AI response');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments);
      throw new Error('Invalid AI response format');
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-goals function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
