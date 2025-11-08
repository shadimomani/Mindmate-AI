-- Create table to store 6-digit OTP codes per user and purpose
CREATE TABLE IF NOT EXISTS public.user_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login','signup')),
  code_hash TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  consumed_at TIMESTAMPTZ NULL
);

-- Enable RLS
ALTER TABLE public.user_otp_codes ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own OTP records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_otp_codes' AND policyname = 'otp_select_own'
  ) THEN
    CREATE POLICY otp_select_own ON public.user_otp_codes FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_otp_codes' AND policyname = 'otp_insert_own'
  ) THEN
    CREATE POLICY otp_insert_own ON public.user_otp_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_otp_codes' AND policyname = 'otp_update_own'
  ) THEN
    CREATE POLICY otp_update_own ON public.user_otp_codes FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_otp_codes' AND policyname = 'otp_delete_own'
  ) THEN
    CREATE POLICY otp_delete_own ON public.user_otp_codes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Ensure only one active OTP per (user_id, purpose)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_otp ON public.user_otp_codes (user_id, purpose) WHERE consumed_at IS NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_otp_lookup ON public.user_otp_codes (user_id, purpose, expires_at) WHERE consumed_at IS NULL;