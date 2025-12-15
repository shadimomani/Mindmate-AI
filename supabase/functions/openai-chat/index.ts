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

interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: { message: string; image?: string };
}

function validateAndSanitizeInput(body: unknown, ctx: SecurityContext): ValidationResult {
  // Type check
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { message, image } = body as { message?: unknown; image?: unknown };

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

  return {
    valid: true,
    sanitized: { message: trimmedMessage, image: sanitizedImage }
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

    const { message, image } = validation.sanitized!;
    
    securityLog('INFO', 'Processing chat request', ctx, { 
      messageLength: message.length, 
      hasImage: !!image 
    });

    // Verify API key is configured
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      securityLog('ERROR', 'LOVABLE_API_KEY not configured', ctx);
      return createSecurityResponse(500, { error: 'AI service configuration error' }, ctx);
    }

    // Build content array for the AI
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: message }
    ];

    if (image) {
      content.push({
        type: "image_url",
        image_url: { url: image }
      });
    }

    // Call AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content }],
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
