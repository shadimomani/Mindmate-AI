-- Add UPDATE policy to allow users to modify their own reflections
CREATE POLICY "Users can update own reflections"
ON public.reflections
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);