
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'work',
  ADD COLUMN IF NOT EXISTS estimated_time integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
