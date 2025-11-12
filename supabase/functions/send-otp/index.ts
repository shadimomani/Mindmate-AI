import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  purpose: "login" | "signup";
}

// Rate limiting map: email -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (email: string): boolean => {
  const now = Date.now();
  const rateLimit = rateLimitMap.get(email);

  if (!rateLimit || now > rateLimit.resetTime) {
    // Reset rate limit window (10 minutes)
    rateLimitMap.set(email, { count: 1, resetTime: now + 10 * 60 * 1000 });
    return true;
  }

  if (rateLimit.count >= 3) {
    return false; // Too many requests
  }

  rateLimit.count++;
  return true;
};

const generateOtpCode = (): string => {
  // Generate a random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, purpose }: SendOtpRequest = await req.json();

    // Validate input
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!["login", "signup"].includes(purpose)) {
      return new Response(
        JSON.stringify({ error: "Purpose must be 'login' or 'signup'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check rate limit
    if (!checkRateLimit(email)) {
      console.log(`Rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({
          error: "Too many OTP requests. Please wait 10 minutes and try again.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate 6-digit code
    const code = generateOtpCode();
    const codeHash = await hashCode(code);

    console.log(`Generated OTP for ${email}, purpose: ${purpose}`);

    // Initialize Supabase client with service role key (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete any existing active OTP for this user_id and purpose
    // Since we use a placeholder user_id for all unauthenticated users,
    // we need to delete by user_id + purpose to match the unique constraint
    const placeholderUserId = "00000000-0000-0000-0000-000000000000";
    await supabase
      .from("user_otp_codes")
      .delete()
      .match({ user_id: placeholderUserId, purpose })
      .is("consumed_at", null);

    // Store hashed code in database (we'll use a temporary user_id for unauthenticated users)
    const { error: dbError } = await supabase.from("user_otp_codes").insert({
      user_id: placeholderUserId, // Temporary placeholder for unauthenticated users
      email,
      purpose,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to store OTP code" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "MindMate <noreply@mindmate.ai>",
      to: [email],
      subject: `Your MindMate verification code: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your MindMate Verification Code</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">MindMate</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 20px 40px;">
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                          Hi there! Here's your verification code to ${purpose === "signup" ? "complete your signup" : "sign in to your account"}:
                        </p>
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; text-align: center; margin: 20px 0;">
                          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Code</p>
                          <p style="margin: 0; color: #1a1a1a; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${code}
                          </p>
                        </div>
                        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                          ⏱️ This code will expire in <strong>10 minutes</strong>.
                        </p>
                      </td>
                    </tr>
                    <!-- Security Notice -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #fef3c7; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 18px;">
                          🔒 <strong>Security tip:</strong> Never share this code with anyone. MindMate staff will never ask for your verification code.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; text-align: center;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          If you didn't request this code, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`OTP email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP code sent to your email",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
