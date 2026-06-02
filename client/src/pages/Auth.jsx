import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth.jsx";
import { consumeOAuthHashError, isOAuthCallback } from "../lib/authRedirect.js";
import Logo from "../components/Logo.jsx";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, configured, user, loading } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const finishingOAuth = isOAuthCallback();

  useEffect(() => {
    const oauthErr = consumeOAuthHashError();
    if (oauthErr) setError(oauthErr);
  }, []);

  useEffect(() => {
    if (!loading && user) navigate("/host", { replace: true });
  }, [loading, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || password.length < 6) {
      setError("Enter an email and a password (6+ characters).");
      return;
    }
    setBusy(true);
    const fn = mode === "login" ? signIn : signUp;
    const { data, error: err } = await fn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (mode === "signup" && !data?.session) {
      // Email confirmation is on — no session yet.
      setNotice("Account created! Check your email to confirm, then log in.");
      setMode("login");
      return;
    }
    navigate("/host");
  };

  const google = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setBusy(false);
      setError(err.message);
    }
    // On success the browser redirects to Google, so no further work here.
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-xl transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-mid"
          aria-label="Go to homepage"
          title="Go to homepage"
        >
          <Logo size="md" />
        </button>
        <p className="mt-3 text-center text-muted">
          Sign in to host games and save your quizzes.
        </p>
      </motion.div>

      {!configured && (
        <div className="alkheelank-card mt-6 w-full p-4 text-center text-sm text-muted">
          Login isn't configured yet (no Supabase keys). You can still{" "}
          <span className="text-paper">continue as guest</span> below.
          {!import.meta.env.DEV && (
            <p className="mt-2 text-xs text-tile-triangle">
              On the live site: add <code className="text-paper">VITE_SUPABASE_URL</code> and{" "}
              <code className="text-paper">VITE_SUPABASE_ANON_KEY</code> in Vercel, then redeploy.
            </p>
          )}
        </div>
      )}

      {finishingOAuth && configured && (
        <p className="mt-6 text-center text-sm text-muted">Finishing Google sign-in…</p>
      )}

      <form onSubmit={submit} className="alkheelank-card mt-6 w-full p-6">
        <div className="mb-5 flex rounded-2xl bg-ink-800 p-1">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition ${
                mode === m ? "bg-gradient-to-r from-brand-start to-brand-mid text-paper" : "text-muted"
              }`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={google}
          disabled={busy || !configured}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-paper px-4 py-3 font-bold text-ink-900 transition hover:brightness-95 disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <label className="mb-1 block text-sm font-semibold text-muted">Email</label>
        <input
          type="email"
          autoComplete="email"
          className="alkheelank-input !text-left !text-lg"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!configured}
        />

        <label className="mb-1 mt-4 block text-sm font-semibold text-muted">Password</label>
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="alkheelank-input !text-left !text-lg"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!configured}
        />

        {error && (
          <p className="mt-4 rounded-xl bg-tile-triangle/20 px-4 py-2 text-center text-sm font-semibold text-tile-triangle">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-xl bg-tile-square/20 px-4 py-2 text-center text-sm font-semibold text-tile-square">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !configured}
          className="alkheelank-btn-primary mt-5 w-full text-lg"
        >
          {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => navigate("/host?guest=1")}
        className="mt-5 text-muted underline-offset-4 hover:text-paper hover:underline"
      >
        Continue as guest →
      </button>
      <p className="mt-2 text-center text-xs text-muted/70">
        Guests can run a one-off game, but saving quizzes needs an account.
      </p>

      <button onClick={() => navigate("/")} className="mt-6 text-sm text-muted hover:text-paper">
        ← Home
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
