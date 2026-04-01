
-- Fix RLS policies: change from 'public' role to 'authenticated' role for all tables

-- habits
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
CREATE POLICY "Users can view own habits" ON habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- habit_completions
DROP POLICY IF EXISTS "Users can delete own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can insert own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can view own habit completions" ON habit_completions;
CREATE POLICY "Users can view own habit completions" ON habit_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit completions" ON habit_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit completions" ON habit_completions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- tasks
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles (uses id not user_id)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- conversations
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- chat_messages (some already authenticated, fix the public ones)
DROP POLICY IF EXISTS "Users can create own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own messages" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- reflections
DROP POLICY IF EXISTS "Users can delete own reflections" ON reflections;
DROP POLICY IF EXISTS "Users can insert own reflections" ON reflections;
DROP POLICY IF EXISTS "Users can update own reflections" ON reflections;
DROP POLICY IF EXISTS "Users can view own reflections" ON reflections;
CREATE POLICY "Users can view own reflections" ON reflections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections" ON reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reflections" ON reflections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reflections" ON reflections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- mood_entries
DROP POLICY IF EXISTS "Users can delete own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can insert own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can view own mood entries" ON mood_entries;
-- Keep the authenticated UPDATE policy that already exists
DROP POLICY IF EXISTS "Users can update own mood entries" ON mood_entries;
CREATE POLICY "Users can view own mood entries" ON mood_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mood entries" ON mood_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mood entries" ON mood_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own mood entries" ON mood_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- planner_analyses
DROP POLICY IF EXISTS "Users can delete own analyses" ON planner_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON planner_analyses;
DROP POLICY IF EXISTS "Users can view own analyses" ON planner_analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON planner_analyses;
CREATE POLICY "Users can view own analyses" ON planner_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON planner_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON planner_analyses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON planner_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- photos
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON photos;
DROP POLICY IF EXISTS "Users can view own photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
CREATE POLICY "Users can view own photos" ON photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own photos" ON photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photos" ON photos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- monthly_achievements
DROP POLICY IF EXISTS "Users can delete own achievements" ON monthly_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON monthly_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON monthly_achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON monthly_achievements;
CREATE POLICY "Users can view own achievements" ON monthly_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON monthly_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON monthly_achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own achievements" ON monthly_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_learning_profiles
DROP POLICY IF EXISTS "System can manage learning profiles" ON user_learning_profiles;
DROP POLICY IF EXISTS "Users can view own learning profile" ON user_learning_profiles;
CREATE POLICY "Users can view own learning profile" ON user_learning_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can manage learning profiles" ON user_learning_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_behavior_logs
DROP POLICY IF EXISTS "System can insert behavior logs" ON user_behavior_logs;
DROP POLICY IF EXISTS "Users can view own behavior logs" ON user_behavior_logs;
DROP POLICY IF EXISTS "Users can update own behavior logs" ON user_behavior_logs;
DROP POLICY IF EXISTS "Users can delete own behavior logs" ON user_behavior_logs;
CREATE POLICY "Users can view own behavior logs" ON user_behavior_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert behavior logs" ON user_behavior_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own behavior logs" ON user_behavior_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own behavior logs" ON user_behavior_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_goals
DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON user_goals;
CREATE POLICY "Users can view their own goals" ON user_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON user_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON user_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON user_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add missing UPDATE policy for photos storage bucket
CREATE POLICY "Users can update own photos in storage"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
