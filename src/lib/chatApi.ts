import { supabase } from "@/integrations/supabase/client";

export async function sendMessage(text: string, imageBase64?: string | null) {
  const { data, error } = await supabase.functions.invoke('openai-chat', {
    body: {
      message: text,
      image: imageBase64 || null
    }
  });

  if (error) {
    throw error;
  }

  return data.reply;
}
