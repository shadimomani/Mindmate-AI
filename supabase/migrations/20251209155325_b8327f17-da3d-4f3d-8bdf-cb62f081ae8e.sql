-- Add UPDATE policy for mood_entries
CREATE POLICY "Users can update own mood entries"
ON public.mood_entries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for mood_entries
CREATE POLICY "Users can delete own mood entries"
ON public.mood_entries
FOR DELETE
USING (auth.uid() = user_id);