-- Create table for planner analysis results
CREATE TABLE public.planner_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_code TEXT,
  tasks_completed BOOLEAN NOT NULL DEFAULT false,
  mood TEXT,
  notes TEXT,
  completion_rate INTEGER NOT NULL DEFAULT 0,
  commitment_score INTEGER NOT NULL DEFAULT 0,
  feedback_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.planner_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own analyses"
ON public.planner_analyses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
ON public.planner_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
ON public.planner_analyses
FOR DELETE
USING (auth.uid() = user_id);