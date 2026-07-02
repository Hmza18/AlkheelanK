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
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // AuthProvider exchanges ?code= itself — leaving this on can race and
        // leave REST calls on the anon key while React still shows a user.
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    })
  : null;

/** DB client that always sends the user's JWT (not the anon key). */
export async function clientWithSession() {
  if (!supabase) {
    return { sb: null, userId: null, error: { message: "Login required." } };
  }

  let { data: { session }, error } = await supabase.auth.getSession();
  if (error) return { sb: null, userId: null, error };

  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) return { sb: null, userId: null, error: refreshed.error };
    session = refreshed.data.session;
  }

  if (!session?.access_token || !session.user?.id) {
    return { sb: null, userId: null, error: { message: "Login required." } };
  }

  const sb = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { sb, userId: session.user.id, error: null };
}
