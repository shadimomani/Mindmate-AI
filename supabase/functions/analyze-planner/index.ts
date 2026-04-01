import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate adaptive system prompt based on learning profile
function generateSystemPrompt(learningProfile: any): string {
  const basePrompt = `You are an AI specialized in analyzing planner pages.

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
- "feedback_message": a short motivational message encouraging the user based on their commitment score`;

  // Add learning-based context if available
  let adaptiveContext = "";
  
  if (learningProfile) {
    adaptiveContext = `\n\nUSER LEARNING CONTEXT (use this to calibrate your assessment):`;
    
    if (learningProfile.avg_completion_rate > 0) {
      adaptiveContext += `\n- User's historical average completion rate: ${learningProfile.avg_completion_rate.toFixed(1)}%`;
    }
    
    if (learningProfile.overplanning_detected) {
      adaptiveContext += `\n- This user tends to overplan. Be encouraging even for partial completion.`;
    }
    
    if (learningProfile.optimistic_bias) {
      adaptiveContext += `\n- Your past predictions have been optimistic. Calibrate commitment scores more conservatively.`;
    }
    
    if (learningProfile.motivation_drop_pattern) {
      adaptiveContext += `\n- User shows declining motivation. Use extra encouraging and supportive language in feedback.`;
    }
    
    if (learningProfile.task_complexity_too_high) {
      adaptiveContext += `\n- Tasks have historically been too complex. Acknowledge difficulty and suggest breaking down tasks.`;
    }
    
    if (learningProfile.recommended_tone === "encouraging") {
      adaptiveContext += `\n- Use a warm, encouraging tone in feedback_message.`;
    } else if (learningProfile.recommended_tone === "challenging") {
      adaptiveContext += `\n- Gently challenge user to push harder in feedback_message.`;
    }
  }

  const closingPrompt = `

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

  return basePrompt + adaptiveContext + closingPrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user for planner analysis');

    const { image } = await req.json();
    
    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: 'Image is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate image format
    const imageDataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
    if (!imageDataUrlPattern.test(image)) {
      return new Response(JSON.stringify({ error: 'Invalid image format. Supported: JPEG, PNG, GIF, WebP' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enforce max size (~5MB base64)
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 * 1.33;
    if (image.length > MAX_IMAGE_SIZE) {
      return new Response(JSON.stringify({ error: 'Image exceeds maximum size of 5MB' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch user's learning profile for adaptive analysis
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: learningProfile } = await adminClient
      .from('user_learning_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('Analyzing planner image with learning profile:', !!learningProfile);

    // Generate adaptive system prompt based on learning
    const systemPrompt = generateSystemPrompt(learningProfile);

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
      console.error('AI gateway error occurred');
      
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

    // Add learning system metadata to response
    if (learningProfile) {
      analysis._learning_adapted = true;
      analysis._learning_signals = {
        overplanning_detected: learningProfile.overplanning_detected,
        optimistic_bias: learningProfile.optimistic_bias,
        motivation_drop_pattern: learningProfile.motivation_drop_pattern,
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
