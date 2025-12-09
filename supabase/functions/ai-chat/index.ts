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
const RATE_LIMIT = 10; // requests per window (stricter for n8n integration)
const RATE_WINDOW_MS = 60000; // 1 minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Input validation limits
const MAX_MESSAGE_LENGTH = 1000;

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
  sanitized?: string;
}

function validateAndSanitizeMessage(body: unknown, ctx: SecurityContext): ValidationResult {
  // Type check
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { message } = body as { message?: unknown };

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

  return { valid: true, sanitized: trimmedMessage };
}

// ============= AUTHENTICATION =============

async function authenticateRequest(req: Request, ctx: SecurityContext): Promise<{ 
  success: boolean; 
  userId?: string; 
  email?: string;
  error?: string;
}> {
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

    return { success: true, userId: user.id, email: user.email };
  } catch (error) {
    securityLog('ERROR', 'Authentication error', ctx, { error: String(error) });
    return { success: false, error: 'Authentication service error' };
  }
}

// ============= MAIN HANDLER =============

Deno.serve(async (req) => {
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

    const validation = validateAndSanitizeMessage(body, ctx);
    if (!validation.valid) {
      return createSecurityResponse(400, { error: validation.error }, ctx);
    }

    const message = validation.sanitized!;
    
    securityLog('INFO', 'Processing chat request', ctx, { messageLength: message.length });

    // Verify webhook URL is configured
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!webhookUrl) {
      securityLog('ERROR', 'N8N_WEBHOOK_URL not configured', ctx);
      return createSecurityResponse(500, { error: 'AI service configuration error' }, ctx);
    }

    // Forward to n8n webhook with user context
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message,
        userId: auth.userId,
        userEmail: auth.email,
        timestamp: ctx.timestamp,
        requestId: ctx.requestId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      securityLog('ERROR', 'Webhook request failed', ctx, { status: response.status, error: errorText.substring(0, 200) });
      return createSecurityResponse(500, { error: 'Failed to get response from AI service' }, ctx);
    }

    const data = await response.json();
    
    securityLog('INFO', 'Request completed successfully', ctx);

    return new Response(
      JSON.stringify({ ...data, requestId: ctx.requestId }),
      { status: 200, headers: SECURITY_HEADERS }
    );

  } catch (error) {
    securityLog('ERROR', 'Unexpected error', ctx, { error: String(error) });
    return createSecurityResponse(500, { error: 'An unexpected error occurred' }, ctx);
  }
});
