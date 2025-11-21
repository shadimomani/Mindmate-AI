-- Create monthly achievements table
CREATE TABLE public.monthly_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  habits_tracked INTEGER NOT NULL DEFAULT 0,
  reflections_count INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  productivity_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.monthly_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own achievements"
ON public.monthly_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
ON public.monthly_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
ON public.monthly_achievements
FOR UPDATE
USING (auth.uid() = user_id);