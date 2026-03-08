ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS last_reminder_phrase integer DEFAULT 0;