ALTER TABLE public.user_behavior_logs
  ADD CONSTRAINT user_behavior_logs_user_date_unique UNIQUE (user_id, planned_date);

ALTER TABLE public.user_learning_profiles
  ADD CONSTRAINT user_learning_profiles_user_id_unique UNIQUE (user_id);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;