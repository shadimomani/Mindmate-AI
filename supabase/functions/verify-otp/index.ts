import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  code: string;
  purpose: "login" | "signup";
  displayName?: string;
  password?: string;
}

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
    const { email, code, purpose, displayName, password }: VerifyOtpRequest =
      await req.json();

    // Validate input
    if (!email || !code || !purpose) {
      return new Response(
        JSON.stringify({
          error: "Email, code, and purpose are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Code must be a 6-digit number" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash the submitted code
    const codeHash = await hashCode(code);

    // Find the OTP record
    const { data: otpRecords, error: fetchError } = await supabase
      .from("user_otp_codes")
      .select("*")
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("code_hash", codeHash)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Database fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!otpRecords || otpRecords.length === 0) {
      // Use generic error to prevent user enumeration
      console.log(`OTP verification failed`);
      return new Response(
        JSON.stringify({ error: "Invalid code or email" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const otpRecord = otpRecords[0];

    // Check if code has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      console.log(`OTP verification failed - expired`);
      return new Response(
        JSON.stringify({ error: "Code has expired. Please request a new one." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check attempt count
    if (otpRecord.attempt_count >= 3) {
      console.log(`OTP verification failed - too many attempts`);
      return new Response(
        JSON.stringify({
          error: "Too many failed attempts. Please request a new code.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark OTP as consumed
    const { error: updateError } = await supabase
      .from("user_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRecord.id);

    if (updateError) {
      console.error("Failed to mark OTP as consumed:", updateError);
    }

    // Handle signup vs login
    let sessionData;

    if (purpose === "signup") {
      // Create new user account
      if (!password) {
        return new Response(
          JSON.stringify({ error: "Password is required for signup" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email since they verified via OTP
        user_metadata: {
          display_name: displayName || email.split("@")[0],
        },
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        return new Response(
          JSON.stringify({
            error: signUpError.message || "Failed to create account",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Create session for the new user
      const { data: sessionResponse, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (sessionError) {
        console.error("Session creation error:", sessionError);
      }

      sessionData = signUpData;
      console.log(`Successfully created account`);
    } else {
      // For login, verify user exists by querying auth.users efficiently
      const { data: users, error: userError } = await supabase
        .from('auth.users' as any)
        .select('id, email')
        .eq('email', email)
        .limit(1)
        .single();
      
      if (userError || !users) {
        // Use generic error message to prevent user enumeration
        console.log(`Login attempt for unverified email`);
        return new Response(
          JSON.stringify({ error: "Invalid code or email" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      sessionData = { user: users };
      console.log(`Successfully verified OTP for login`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully",
        user: sessionData.user,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
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
