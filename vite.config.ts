import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const fallbackSupabaseUrl = "https://papxwejgalaywhypsdwf.supabase.co";
const fallbackSupabasePublishableKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcHh3ZWpnYWxheXdoeXBzZHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjM0MDQsImV4cCI6MjA3NTY5OTQwNH0.BJ4_jDgFjbwv3ad3XxFjNiWnY8ch4VJJy0ZNJpMLIcw";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || fallbackSupabaseUrl
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || fallbackSupabasePublishableKey
    ),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
