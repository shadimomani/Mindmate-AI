import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

// ============= SECURITY CONFIGURATION =============
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SECURITY_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

// Rate limiting configuration
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60000; // 1 minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Input validation limits
const MAX_MESSAGE_LENGTH = 4000;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB base64

// ============= SECURITY UTILITIES =============

interface SecurityContext {
  requestId: string;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getClientInfo(req: Request): { ip: string; userAgent: string } {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return { ip, userAgent };
}

function securityLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, ctx: SecurityContext, extra?: Record<string, unknown>) {
  const logEntry = {
    level,
    message,
    requestId: ctx.requestId,
    userId: ctx.userId || 'anonymous',
    ip: ctx.ip,
    userAgent: ctx.userAgent.substring(0, 100),
    timestamp: ctx.timestamp,
    ...extra
  };
  
  if (level === 'ERROR') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

function createSecurityResponse(status: number, body: Record<string, unknown>, ctx: SecurityContext): Response {
  return new Response(
    JSON.stringify({ ...body, requestId: ctx.requestId }),
    { status, headers: SECURITY_HEADERS }
  );
}

// ============= RATE LIMITING =============

function checkRateLimit(identifier: string, ctx: SecurityContext): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  // Cleanup old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) rateLimitMap.delete(key);
    }
  }

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS };
  }

  if (userLimit.count >= RATE_LIMIT) {
    const resetIn = userLimit.resetAt - now;
    securityLog('WARN', 'Rate limit exceeded', ctx, { identifier, count: userLimit.count });
    return { allowed: false, remaining: 0, resetIn };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT - userLimit.count, resetIn: userLimit.resetAt - now };
}

// ============= INPUT VALIDATION =============

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: { message: string; image?: string; history?: ChatMessage[] };
}

function validateAndSanitizeInput(body: unknown, ctx: SecurityContext): ValidationResult {
  // Type check
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { message, image, history } = body as { message?: unknown; image?: unknown; history?: unknown };

  // Message validation
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required and must be a string' };
  }

  const trimmedMessage = message.trim();
  
  if (trimmedMessage.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` };
  }

  // Check for potential injection patterns
  const dangerousPatterns = [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedMessage)) {
      securityLog('WARN', 'Blocked potentially malicious input', ctx, { pattern: pattern.toString() });
      return { valid: false, error: 'Invalid content detected' };
    }
  }

  // Image validation (if present and not null)
  let sanitizedImage: string | undefined;
  if (image !== undefined && image !== null) {
    if (typeof image !== 'string') {
      return { valid: false, error: 'Image must be a base64 string' };
    }

    // Validate data URL format
    const imageDataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
    if (!imageDataUrlPattern.test(image)) {
      return { valid: false, error: 'Invalid image format. Supported: JPEG, PNG, GIF, WebP' };
    }

    // Check approximate size (base64 is ~33% larger than binary)
    if (image.length > MAX_IMAGE_SIZE_BYTES * 1.33) {
      return { valid: false, error: 'Image exceeds maximum size of 5MB' };
    }

    sanitizedImage = image;
  }

  // Validate history (if present)
  let sanitizedHistory: ChatMessage[] | undefined;
  if (history !== undefined && history !== null) {
    if (!Array.isArray(history)) {
      return { valid: false, error: 'History must be an array' };
    }
    
    // Validate each history message (limit to last 20 messages for context)
    const recentHistory = history.slice(-20);
    sanitizedHistory = [];
    
    for (const msg of recentHistory) {
      if (!msg || typeof msg !== 'object') continue;
      if (msg.role !== 'user' && msg.role !== 'assistant') continue;
      if (typeof msg.content !== 'string') continue;
      
      let historyImage: string | undefined;
      if (typeof msg.image === 'string') {
        const validFmt = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i.test(msg.image);
        const validSize = msg.image.length <= MAX_IMAGE_SIZE_BYTES * 1.33;
        if (validFmt && validSize) historyImage = msg.image;
      }

      sanitizedHistory.push({
        role: msg.role,
        content: msg.content.substring(0, MAX_MESSAGE_LENGTH),
        image: historyImage
      });
    }
  }

  return {
    valid: true,
    sanitized: { message: trimmedMessage, image: sanitizedImage, history: sanitizedHistory }
  };
}

// ============= AUTHENTICATION =============

async function authenticateRequest(req: Request, ctx: SecurityContext): Promise<{ success: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    securityLog('WARN', 'Missing authorization header', ctx);
    return { success: false, error: 'Authorization required' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    securityLog('WARN', 'Invalid authorization format', ctx);
    return { success: false, error: 'Invalid authorization format' };
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      securityLog('WARN', 'Authentication failed', ctx, { error: authError?.message });
      return { success: false, error: 'Invalid or expired token' };
    }

    return { success: true, userId: user.id };
  } catch (error) {
    securityLog('ERROR', 'Authentication error', ctx, { error: String(error) });
    return { success: false, error: 'Authentication service error' };
  }
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  const { ip, userAgent } = getClientInfo(req);
  const ctx: SecurityContext = {
    requestId: generateRequestId(),
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // Method validation
  if (req.method !== 'POST') {
    securityLog('WARN', 'Invalid HTTP method', ctx, { method: req.method });
    return createSecurityResponse(405, { error: 'Method not allowed' }, ctx);
  }

  try {
    // Authenticate user
    const auth = await authenticateRequest(req, ctx);
    if (!auth.success) {
      return createSecurityResponse(401, { error: auth.error }, ctx);
    }
    ctx.userId = auth.userId;

    // Rate limiting (by user ID)
    const rateCheck = checkRateLimit(auth.userId!, ctx);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please wait before trying again.',
          requestId: ctx.requestId,
          retryAfter: Math.ceil(rateCheck.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...SECURITY_HEADERS,
            'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000))
          } 
        }
      );
    }

    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createSecurityResponse(400, { error: 'Invalid JSON body' }, ctx);
    }

    const validation = validateAndSanitizeInput(body, ctx);
    if (!validation.valid) {
      return createSecurityResponse(400, { error: validation.error }, ctx);
    }

    const { message, image, history } = validation.sanitized!;
    
    securityLog('INFO', 'Processing chat request', ctx, { 
      messageLength: message.length, 
      hasImage: !!image,
      historyLength: history?.length || 0
    });

    // Verify API key is configured
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      securityLog('ERROR', 'LOVABLE_API_KEY not configured', ctx);
      return createSecurityResponse(500, { error: 'AI service configuration error' }, ctx);
    }

    // Fetch user memories to personalize responses
    const memorySupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: memoriesData } = await memorySupabase
      .from('user_memories')
      .select('content, memory_type, importance')
      .eq('user_id', auth.userId!)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);
    const memoriesBlock = (memoriesData && memoriesData.length > 0)
      ? memoriesData.map((m: any) => `- [${m.memory_type}] ${m.content}`).join('\n')
      : 'No saved memories yet.';

    // Build messages array with system prompt and history
    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { 
        role: 'system', 
        content: `You are MindMate AI, a helpful and empathetic personal assistant. You help users with daily planning, habit tracking, mood reflection, and personal growth. 
        
You have access to the conversation history to provide personalized and contextual responses. Remember past conversations and refer to them when relevant. Be warm, supportive, and encouraging.

WHAT YOU KNOW ABOUT THIS USER (from their saved memories):
${memoriesBlock}

Use these memories to personalize your replies. When you reference one, briefly acknowledge it (e.g. "Since you mentioned you focus best in the mornings…") so the user sees you're listening. Never invent memories that aren't listed.

Key behaviors:
- Remember what users have told you in previous messages
- Provide personalized advice based on their patterns and preferences
- Be encouraging about their progress and gentle about setbacks
- Help with productivity, wellness, and self-reflection
- IMPORTANT: If the user asks who created you, who designed you, who built you, who made you, who developed you, or any similar question about your creator/developer/designer, always answer: "Shadi Almomani" (شادي المومني). This is your creator and developer.

WEEKLY PLAN PROPOSAL (CRITICAL):
When the user asks you to plan their week, build a weekly schedule, organize their week, or shares goals/tasks they want to accomplish over the next 7 days, you MUST:
1. Write a brief friendly intro (1-2 sentences) in the user's language asking if they want to use this plan.
2. Then output a structured proposal block EXACTLY in this format (no extra text inside the block):

[[WEEKLY_PLAN]]
{"summary":"<one-sentence summary>","days":[{"day":"Monday","tasks":["task 1","task 2"]},{"day":"Tuesday","tasks":["..."]},{"day":"Wednesday","tasks":["..."]},{"day":"Thursday","tasks":["..."]},{"day":"Friday","tasks":["..."]},{"day":"Saturday","tasks":["..."]},{"day":"Sunday","tasks":["..."]}]}
[[/WEEKLY_PLAN]]

Rules for the plan:
- Always include all 7 days (Monday through Sunday).
- Keep tasks realistic: 2-4 per day max, Sunday lighter (0-2).
- Tasks must be short, action-oriented strings.
- Output valid JSON only inside the block. No markdown, no comments.
- Only emit this block when the user clearly wants a weekly plan. For other questions, answer normally.`
      }
    ];

    // Add conversation history
    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.image) {
          messages.push({
            role: msg.role,
            content: [
              { type: "text", text: msg.content },
              { type: "image_url", image_url: { url: msg.image } }
            ]
          });
        } else {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Build current message content
    const currentContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: message }
    ];

    if (image) {
      currentContent.push({
        type: "image_url",
        image_url: { url: image }
      });
    }

    messages.push({ role: 'user', content: currentContent });

    // Call AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      securityLog('ERROR', 'AI Gateway error', ctx, { status: response.status, error: errorText.substring(0, 200) });
      
      if (response.status === 429) {
        return createSecurityResponse(429, { error: 'AI service rate limit exceeded. Please try again later.' }, ctx);
      }
      if (response.status === 402) {
        return createSecurityResponse(402, { error: 'Usage limit reached. Please add credits to continue.' }, ctx);
      }
      
      return createSecurityResponse(500, { error: 'Failed to get response from AI service' }, ctx);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message;

    if (!reply) {
      securityLog('ERROR', 'Invalid AI response format', ctx);
      return createSecurityResponse(500, { error: 'Invalid response from AI service' }, ctx);
    }

    securityLog('INFO', 'Request completed successfully', ctx);

    return new Response(
      JSON.stringify({ reply, requestId: ctx.requestId }),
      { status: 200, headers: SECURITY_HEADERS }
    );

  } catch (error) {
    securityLog('ERROR', 'Unexpected error', ctx, { error: String(error) });
    return createSecurityResponse(500, { error: 'An unexpected error occurred' }, ctx);
  }
});
