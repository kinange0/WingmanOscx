import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration
const SUPABASE_URL = 'https://ffvibdlngxcargeqwffl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdmliZGxuZ3hjYXJnZXF3ZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTkzODQsImV4cCI6MjA4NTU5NTM4NH0.7rXs9qCW-v63EiGJqpx7APb3kkSEA856P6Fhm19VX1A';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : (null as any);