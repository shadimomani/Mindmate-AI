
-- Weekly plans table
CREATE TABLE public.weekly_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  brain_dump TEXT NOT NULL,
  reflection_completion TEXT,
  reflection_difficulty TEXT,
  commitment_score INTEGER DEFAULT 5,
  feedback_message TEXT,
  schedule JSONB DEFAULT '[]'::jsonb,
  task_priorities JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly plans" ON public.weekly_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weekly plans" ON public.weekly_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly plans" ON public.weekly_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own weekly plans" ON public.weekly_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
