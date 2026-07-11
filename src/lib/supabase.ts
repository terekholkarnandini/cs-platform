import { createClient } from "@supabase/supabase-js";

// Retrieve environment variables. Fallback to placeholder values so the app doesn't crash on initial load.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isPlaceholder = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project-id");

if (isPlaceholder && typeof window !== "undefined") {
  console.warn(
    "SupportAI Warning: Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or set to placeholders. Please configure them in your .env file for authentication to work.",
  );
}

// Initialize Supabase Client
export const supabase = createClient(
  isPlaceholder ? "https://placeholder-project.supabase.co" : supabaseUrl,
  isPlaceholder ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder" : supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
