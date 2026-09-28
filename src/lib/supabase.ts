import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://aplsaypiqyrewwvwczsr.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbHNheXBpcXlyZXd3dndjenNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzU3MDksImV4cCI6MjEwNjE1MTcwOX0.KNaeFRVUJNTW5ojIzrYrJWhBj0H-nNjLrkGUe8_4F5s';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export const isUsingFallbackSupabaseConfig =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function getSupabaseConfigStatus() {
  return {
    url: supabaseUrl,
    usingFallback: isUsingFallbackSupabaseConfig,
  };
}
