import { createClient } from "@supabase/supabase-js";

// Supabase handles auth + session + storage. Keys come from env — never hardcode
// them. The anon key is safe to ship to the browser (it's a public key gated by
// Row Level Security on the database).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// When env vars are missing we run in guest-only mode (no crash). Login/saved
// quizzes simply stay disabled until keys are added.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
