-- Remove RLS policies from user_otp_codes table
-- This table is only accessed by edge functions using service role key
-- and is never directly accessible from client code

-- Drop existing RLS policies
DROP POLICY IF EXISTS "otp_delete_own" ON public.user_otp_codes;
DROP POLICY IF EXISTS "otp_insert_own" ON public.user_otp_codes;
DROP POLICY IF EXISTS "otp_select_own" ON public.user_otp_codes;
DROP POLICY IF EXISTS "otp_update_own" ON public.user_otp_codes;

-- Disable RLS on the table
ALTER TABLE public.user_otp_codes DISABLE ROW LEVEL SECURITY;