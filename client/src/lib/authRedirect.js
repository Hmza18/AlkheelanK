/** Where Supabase sends the browser after Google (or other OAuth) sign-in. */
export function oauthRedirectUrl(extraParams = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extraParams)) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/login${qs ? `?${qs}` : ""}`;
  }
  const base = (import.meta.env.VITE_SITE_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${base}/login${qs ? `?${qs}` : ""}`;
}

/** True while the URL still carries OAuth tokens/errors (hash or PKCE query). */
export function isOAuthCallback() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  if (hash.includes("access_token") || hash.includes("error=")) return true;
  return new URLSearchParams(window.location.search).has("code");
}

/** Read OAuth error from the hash and strip it from the address bar. */
export function consumeOAuthHashError() {
  const raw = window.location.hash?.replace(/^#/, "");
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const err = params.get("error_description") || params.get("error");
  if (!err) return null;
  const clean = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", clean);
  return decodeURIComponent(err.replace(/\+/g, " "));
}
