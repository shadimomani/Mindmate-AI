-- Add onboarded flag to profiles table
ALTER TABLE public.profiles
ADD COLUMN onboarded boolean NOT NULL DEFAULT false;