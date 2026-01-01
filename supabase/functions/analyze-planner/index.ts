import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an AI specialized in analyzing planner pages.

You will be given an image of a daily planner page.

Your task:
- Analyze the handwritten or printed content clearly.
- Extract the following data only, in strict JSON format (no extra text, no explanation):

Schema keys:
- "page_code": a unique string code identifying the page (e.g. "MM-20260101-001")
- "tasks_completed": boolean (true if user completed all tasks listed, false otherwise)
- "mood": short string describing the user's mood from reflections (e.g. "motivated", "tired", "productive")
- "notes": string with any additional notes or reflections written by the user (empty string if none)
- "completion_rate": number between 0 and 100 indicating % of tasks completed
- "commitment_score": number between 0 and 10 evaluating user's commitment to their planner goals (10 = highest commitment)
- "feedback_message": a short motivational message encouraging the user based on their commitment score

Strict rules:
- Only return a valid JSON object with exactly these keys and correct types.
- Do NOT return anything else, no explanations, no markdown, no extra text.
- If the page content is unreadable or insufficient, respond with:
  {
    "page_code": null,
    "tasks_completed": false,
    "mood": "",
    "notes": "",
    "completion_rate": 0,
    "commitment_score": 0,
    "feedback_message": "We couldn't read your planner page clearly. Please try again with a clearer photo."
  }`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing planner image...');

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
            content: [
              { type: 'text', text: 'Analyze this planner page and return the JSON output:' },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI response:', content);

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        page_code: null,
        tasks_completed: false,
        mood: "",
        notes: "",
        completion_rate: 0,
        commitment_score: 0,
        feedback_message: "We couldn't analyze your planner page. Please try again."
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-planner function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
