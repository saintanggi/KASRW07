import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aplsaypiqyrewwvwczsr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbHNheXBpcXlyZXd3dndjenNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzU3MDksImV4cCI6MjEwNjE1MTcwOX0.KNaeFRVUJNTW5ojIzrYrJWhBj0H-nNjLrkGUe8_4F5s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
