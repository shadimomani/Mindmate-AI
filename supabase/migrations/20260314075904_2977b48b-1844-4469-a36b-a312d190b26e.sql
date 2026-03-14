-- user_behavior_logs: missing UPDATE and DELETE policies
CREATE POLICY "Users can update own behavior logs"
ON public.user_behavior_logs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own behavior logs"
ON public.user_behavior_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- planner_analyses: missing UPDATE policy
CREATE POLICY "Users can update own analyses"
ON public.planner_analyses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- photos: missing UPDATE policy
CREATE POLICY "Users can update own photos"
ON public.photos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- chat_messages: missing UPDATE policy
CREATE POLICY "Users can update own messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- monthly_achievements: missing DELETE policy
CREATE POLICY "Users can delete own achievements"
ON public.monthly_achievements FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- user_goals: missing DELETE policy
CREATE POLICY "Users can delete own goals"
ON public.user_goals FOR DELETE
TO authenticated
USING (auth.uid() = user_id);