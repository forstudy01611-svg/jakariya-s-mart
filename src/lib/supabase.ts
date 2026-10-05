import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Sanitize Supabase Project URL: guarantees ONLY the origin (e.g. https://hvnnwadosqhzhsstlpiq.supabase.co)
// and strictly prevents any frontend route like /admin/login from being appended to the API base URL.
const sanitizeSupabaseUrl = (raw?: string): string => {
  const fallback = 'https://hvnnwadosqhzhsstlpiq.supabase.co';
  const val = (raw || fallback).trim();
  try {
    const parsed = new URL(val.startsWith('http') ? val : `https://${val}`);
    return parsed.origin;
  } catch {
    return val.replace(/\/+$/, '');
  }
};

const supabaseUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NnJ7lTL3A9-KT8ODWwatWg_xZljY_C3'
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseUrl.startsWith('https://')
);

export const supabaseProjectId = 'hvnnwadosqhzhsstlpiq';
export const configuredSupabaseUrl = supabaseUrl;

// Supabase client uses strictly VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
