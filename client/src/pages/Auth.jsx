import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth.jsx";
import { consumeOAuthHashError, isOAuthCallback, oauthRedirectUrl } from "../lib/authRedirect.js";
import { formatAuthError, probeSupabaseReachable } from "../lib/authErrors.js";
import { redirectToCheckoutIfConfigured } from "../lib/billing.js";
import { isBillingLive } from "../lib/billingMode.js";
import {
  clearPendingCheckoutPlan,
  resolveCheckoutPlan,
  setPendingCheckoutPlan,
} from "../lib/pendingCheckout.js";
import Logo from "../components/Logo.jsx";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");
  const { signIn, signUp, signInWithGoogle, configured, user, loading } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [reachability, setReachability] = useState(null);
  const finishingOAuth = isOAuthCallback();
  const checkoutPlan = resolveCheckoutPlan(planParam);
  const checkoutStartedRef = useRef(false);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    probeSupabaseReachable().then((result) => {
      if (!cancelled) setReachability(result);
    });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  useEffect(() => {
    const oauthErr = consumeOAuthHashError();
    if (oauthErr) setError(oauthErr);
  }, []);

  useEffect(() => {
    if (loading || !user || checkoutStartedRef.current) return;

    const plan = resolveCheckoutPlan(planParam);
    if (!plan) {
      navigate("/host", { replace: true });
      return;
    }

    if (!isBillingLive) {
      navigate("/host", { replace: true });
      return;
    }

    checkoutStartedRef.current = true;
    let cancelled = false;
    setCheckoutBusy(true);
    (async () => {
      try {
        const started = await redirectToCheckoutIfConfigured(plan, user);
        if (cancelled) return;
        if (started) {
          clearPendingCheckoutPlan();
          return;
        }
        setCheckoutBusy(false);
        setError(
          "Trial checkout isn't set up on this server yet. If you're testing locally, run npm run dev:server and restart the client.",
        );
      } catch (err) {
        if (!cancelled) {
          checkoutStartedRef.current = false;
          setCheckoutBusy(false);
          setError(err?.message || "Could not start trial checkout.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, planParam, navigate]);

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
      setError(formatAuthError(err));
      return;
    }
    if (mode === "signup" && !data?.session) {
      // Email confirmation is on — no session yet.
      setNotice("Account created! Check your email to confirm, then log in.");
      setMode("login");
      return;
    }
    if (resolveCheckoutPlan(planParam)) return;
    navigate("/host");
  };

  const google = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    const planId = resolveCheckoutPlan(planParam);
    if (planId) setPendingCheckoutPlan(planId);
    const plan = planId ? { plan: planId } : {};
    const { data, error: err } = await signInWithGoogle(oauthRedirectUrl(plan));
    if (err) {
      setBusy(false);
      setError(formatAuthError(err));
      return;
    }
    const url = data?.url;
    if (url) {
      try {
        const probe = await fetch(url, {
          redirect: "manual",
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        });
        if (probe.status >= 400) {
          const body = await probe.json().catch(() => ({}));
          setBusy(false);
          setError(formatAuthError({ message: body?.msg || body?.error_description || probe.statusText }));
          return;
        }
      } catch {
        // If the probe fails, still try the redirect.
      }
      window.location.assign(url);
      return;
    }
    setBusy(false);
    setError(
      "Google sign-in could not start. Add this URL in Supabase → Authentication → URL configuration → Redirect URLs: " +
        oauthRedirectUrl(),
    );
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
          <span className="font-semibold text-ink-900">continue as guest</span> below.
          {!import.meta.env.DEV && (
            <p className="mt-2 text-xs text-tile-triangle">
              On the live site: add <code className="text-ink-900">VITE_SUPABASE_URL</code> and{" "}
              <code className="text-ink-900">VITE_SUPABASE_ANON_KEY</code> in Vercel, then redeploy.
            </p>
          )}
        </div>
      )}

      {configured && reachability && !reachability.ok && (
        <div className="alkheelank-card mt-6 w-full p-4 text-center text-sm font-semibold text-tile-triangle">
          {reachability.message}
        </div>
      )}

      {finishingOAuth && configured && (
        <div className="alkheelank-card mt-6 w-full p-4 text-center text-sm font-semibold text-muted">
          Finishing Google sign-in…
        </div>
      )}

      {checkoutBusy && user && checkoutPlan && (
        <div className="alkheelank-card mt-6 w-full p-4 text-center text-sm font-semibold text-muted">
          Redirecting to your free trial checkout…
        </div>
      )}

      {checkoutPlan && !checkoutBusy && (
        <p className="mt-4 text-center text-sm font-semibold text-brand-mid">
          Sign in to start your Pro trial.
        </p>
      )}

      <form
        onSubmit={submit}
        className={`alkheelank-card mt-6 w-full p-6 ${checkoutBusy ? "pointer-events-none opacity-40" : ""}`}
      >
        <div className="mb-5 flex rounded-2xl bg-surface-muted p-1">
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
                mode === m ? "bg-brand-mid text-white" : "text-muted"
              }`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={google}
          disabled={busy || !configured || reachability?.ok === false}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 font-bold text-ink-900 ring-1 ring-edge transition hover:bg-surface-elevated disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted">
          <span className="h-px flex-1 bg-brand-start/25" />
          or
          <span className="h-px flex-1 bg-brand-start/25" />
        </div>

        {mode === "signup" && (
          <p className="mb-4 rounded-xl bg-surface-muted px-4 py-2.5 text-center text-xs text-muted">
            New accounts work instantly with <b className="text-ink-900">Google</b>. Email sign-up needs
            confirm email turned off in Supabase (or you may hit the 2/hour email cap).
          </p>
        )}

        <label className="mb-1 block text-sm font-semibold text-muted">Email</label>
        <input
          type="email"
          autoComplete="email"
          className="alkheelank-input !text-left !text-lg"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!configured || reachability?.ok === false}
        />

        <label className="mb-1 mt-4 block text-sm font-semibold text-muted">Password</label>
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="alkheelank-input !text-left !text-lg"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!configured || reachability?.ok === false}
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
          disabled={busy || !configured || reachability?.ok === false}
          className="alkheelank-btn-primary mt-5 w-full text-lg"
        >
          {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => navigate("/host?guest=1")}
        className="mt-5 text-muted underline-offset-4 hover:text-ink-900 hover:underline"
      >
        Continue as guest →
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Guests can run a one-off game, but saving quizzes needs an account.
      </p>
      <button onClick={() => navigate("/")} className="mt-4 text-sm text-muted hover:text-ink-900">
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
