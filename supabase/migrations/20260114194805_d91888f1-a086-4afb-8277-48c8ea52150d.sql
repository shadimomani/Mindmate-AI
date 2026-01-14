-- User Learning Profiles - stores learning signals and patterns
CREATE TABLE public.user_learning_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Learning signals (boolean flags)
  overplanning_detected BOOLEAN NOT NULL DEFAULT false,
  undercommitment_detected BOOLEAN NOT NULL DEFAULT false,
  motivation_drop_pattern BOOLEAN NOT NULL DEFAULT false,
  consistent_time_failure BOOLEAN NOT NULL DEFAULT false,
  task_complexity_too_high BOOLEAN NOT NULL DEFAULT false,
  optimistic_bias BOOLEAN NOT NULL DEFAULT false,
  
  -- Behavioral metrics (rolling averages)
  avg_completion_rate NUMERIC(5,2) DEFAULT 0,
  avg_commitment_accuracy NUMERIC(5,2) DEFAULT 0,
  preferred_task_volume INTEGER DEFAULT 5,
  optimal_task_complexity TEXT DEFAULT 'medium',
  
  -- Time patterns
  peak_productivity_hours JSONB DEFAULT '[]'::jsonb,
  low_productivity_hours JSONB DEFAULT '[]'::jsonb,
  
  -- Mood correlation
  mood_performance_correlation JSONB DEFAULT '{}'::jsonb,
  
  -- Adaptation settings (derived from learning)
  recommended_daily_tasks INTEGER DEFAULT 5,
  recommended_tone TEXT DEFAULT 'balanced',
  recommended_structure TEXT DEFAULT 'flexible',
  
  -- Metadata
  total_interactions INTEGER DEFAULT 0,
  last_analysis_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Behavior Logs - individual interaction records
CREATE TABLE public.user_behavior_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Plan data
  planned_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- AI predictions vs reality
  predicted_commitment_score INTEGER,
  actual_follow_through NUMERIC(5,2),
  prediction_accuracy NUMERIC(5,2),
  
  -- Context
  mood_at_planning TEXT,
  mood_at_completion TEXT,
  
  -- Time analysis
  planned_date DATE NOT NULL,
  tasks_completed_times JSONB DEFAULT '[]'::jsonb,
  tasks_skipped_times JSONB DEFAULT '[]'::jsonb,
  
  -- Derived signals for this session
  session_signals JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning profiles (read-only for users, system manages writes)
CREATE POLICY "Users can view own learning profile"
ON public.user_learning_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- System needs to insert/update, but users shouldn't directly modify
CREATE POLICY "System can manage learning profiles"
ON public.user_learning_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for behavior logs
CREATE POLICY "Users can view own behavior logs"
ON public.user_behavior_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert behavior logs"
ON public.user_behavior_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_behavior_logs_user_date ON public.user_behavior_logs(user_id, planned_date DESC);
CREATE INDEX idx_behavior_logs_created ON public.user_behavior_logs(created_at DESC);
CREATE INDEX idx_learning_profiles_user ON public.user_learning_profiles(user_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_learning_profiles_updated_at
BEFORE UPDATE ON public.user_learning_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();