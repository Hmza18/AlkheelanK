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
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
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
      async signInWithGoogle() {
        if (!supabase) return { error: { message: "Login is not configured." } };
        // Supabase redirects to Google, then back to redirectTo with a session
        // that supabase-js picks up automatically (detectSessionInUrl).
        return supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: oauthRedirectUrl() },
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
