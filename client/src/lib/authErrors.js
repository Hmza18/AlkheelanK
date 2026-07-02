/** Turn Supabase/network failures into something actionable on the login page. */
export function formatAuthError(err) {
  const msg = err?.message || String(err || "Something went wrong.");
  const lower = msg.toLowerCase();

  if (lower.includes("provider is not enabled") || lower.includes("unsupported provider")) {
    return (
      "Google sign-in is not enabled in Supabase yet. Open Authentication → Providers → Google, " +
      "turn it on, paste your Client ID and Secret, and save."
    );
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    err?.name === "TypeError"
  ) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return (
      "Can't reach Supabase. Check client/.env — VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
      "must match your live project (Settings → API Keys in the Supabase dashboard). " +
      (url ? `Current URL: ${url}` : "VITE_SUPABASE_URL is missing.")
    );
  }

  if (lower.includes("invalid api key") || lower.includes("invalid jwt")) {
    return "Supabase rejected the API key. Copy the Publishable key (sb_publishable_…) from Supabase → Settings → API Keys into client/.env, then restart Vite.";
  }

  if (lower.includes("email rate limit") || lower.includes("rate limit exceeded")) {
    return (
      "Supabase’s built-in email limit was hit (about 2 emails/hour on new projects). " +
      "Use Continue with Google instead, or in the Supabase dashboard turn off " +
      "Authentication → Providers → Email → Confirm email. Wait an hour and try again, " +
      "or add custom SMTP under Authentication → SMTP for production."
    );
  }

  return msg;
}

export async function probeSupabaseReachable() {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { ok: false, message: "Supabase env vars are missing in client/.env." };
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true };
    return { ok: false, message: `Supabase returned ${res.status}. Check your project URL and API key.` };
  } catch {
    return {
      ok: false,
      message:
        `Can't connect to ${url}. The project may be paused, deleted, or the URL is wrong — ` +
        "open Supabase → Project Settings → API and copy the Project URL again.",
    };
  }
}
