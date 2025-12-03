-- Create habit_completions table to track daily completions
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

-- Enable Row Level Security
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own habit completions" 
ON public.habit_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit completions" 
ON public.habit_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions" 
ON public.habit_completions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_habit_completions_habit_date ON public.habit_completions(habit_id, completed_date);