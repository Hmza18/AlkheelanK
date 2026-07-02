import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase.js";
import { oauthRedirectUrl } from "./authRedirect.js";

const AuthContext = createContext(null);

// Wraps the app and exposes the current Supabase session/user plus auth actions.
// Persists across refresh because supabase-js stores the session in localStorage.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;

    const boot = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && active) {
          console.error("[auth] OAuth code exchange failed:", error.message);
        } else if (exchanged.session) {
          await supabase.auth.setSession(exchanged.session);
        }
        params.delete("code");
        params.delete("state");
        const qs = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
      }

      let { data } = await supabase.auth.getSession();
      if (data.session?.expires_at) {
        const expiresMs = data.session.expires_at * 1000;
        if (expiresMs - Date.now() < 60_000) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed.session) data = refreshed;
        }
      }
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    };

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    const displayName =
      user?.user_metadata?.name || user?.email?.split("@")[0] || null;
    return {
      session,
      user,
      displayName,
      loading,
      configured: isSupabaseConfigured,
      async signUp(email, password) {
        if (!supabase) return { error: { message: "Login is not configured." } };
        return supabase.auth.signUp({ email, password });
      },
      async signIn(email, password) {
        if (!supabase) return { error: { message: "Login is not configured." } };
        return supabase.auth.signInWithPassword({ email, password });
      },
      async signInWithGoogle(redirectTo = oauthRedirectUrl()) {
        if (!supabase) return { data: null, error: { message: "Login is not configured." } };
        return supabase.auth.signInWithOAuth({
          provider: "custom:google-kheelan",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
