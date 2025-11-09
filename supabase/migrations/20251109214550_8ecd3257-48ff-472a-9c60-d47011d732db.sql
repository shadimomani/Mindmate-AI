-- Enable Row Level Security on user_otp_codes table
-- This table should ONLY be accessed by edge functions using service role key
-- No policies are added because service role bypasses RLS
ALTER TABLE public.user_otp_codes ENABLE ROW LEVEL SECURITY;

-- Add comment explaining the security model
COMMENT ON TABLE public.user_otp_codes IS 'OTP codes table. Access restricted to edge functions only via service role key. No direct client access permitted.';