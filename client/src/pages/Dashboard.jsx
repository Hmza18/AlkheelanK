import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { STARTER_SUMMARIES } from "../data/starterSummaries.js";
import { useAuth } from "../lib/auth.jsx";
import {
  createQuiz,
  listQuizzes,
  deleteQuiz,
  duplicateQuiz,
  listHistory,
  createQuizShare,
  isSetupError,
} from "../lib/db.js";
import Logo from "../components/Logo.jsx";
import SettingsPanel from "../components/SettingsPanel.jsx";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const CATEGORY_COLORS = {
  Mixed: "#3b82f6",
  Movies: "#f43f5e",
  General: "#60a5fa",
  Kids: "#2563eb",
  Geography: "#10b981",
  Family: "#1d4ed8",
};

export default function Dashboard({ guest, onNew, onEdit, onLaunchSaved, onLaunchBuiltin }) {
  const navigate = useNavigate();
  const { user, displayName, signOut, configured } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [shareTarget, setShareTarget] = useState(null); // quiz object being shared
  const [copyingId, setCopyingId] = useState(null);     // starter id currently being copied

  const refresh = useCallback(async () => {
    if (user) {
      const [{ data: qs, error }, { data: hist }] = await Promise.all([
        listQuizzes(user.id),
        listHistory(user.id),
      ]);
      setNeedsSetup(isSetupError(error));
      setQuizzes(qs || []);
      setHistory(hist || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id) => {
    if (!user) return;
    setQuizzes((qs) => qs.filter((q) => q.id !== id));
    await deleteQuiz(user.id, id);
  };
  const handleDuplicate = async (quiz) => {
    const { data } = await duplicateQuiz(user.id, quiz);
    if (data) setQuizzes((qs) => [data, ...qs]);
  };

  // Copy a starter template into the logged-in user's saved quizzes.
  const handleCopyStarter = async (starter) => {
    if (!user) { navigate("/login"); return; }
    setCopyingId(starter.id);
    try {
      const res = await fetch(`${SERVER_URL}/quizzes/${starter.id}`);
      const data = await res.json();
      const { data: saved } = await createQuiz(user.id, {
        title: data.title,
        questions: data.questions,
      });
      if (saved) setQuizzes((qs) => [saved, ...qs]);
    } catch {
      // non-fatal — the user can try again
    } finally {
      setCopyingId(null);
    }
  };

  const logout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-5xl px-1 pb-20">
      <SettingsPanel corner="bottom-left" />

      {shareTarget && (
        <ShareModal
          quiz={shareTarget}
          userId={user?.id}
          onClose={() => setShareTarget(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="rounded-xl transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-mid"
          aria-label="Go to homepage"
        >
          <Logo />
        </button>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-right text-sm text-muted sm:block">
                Signed in as <b className="text-ink-900">{displayName}</b>
              </span>
              <button
                onClick={logout}
                className="rounded-xl bg-surface-muted px-4 py-2 text-sm font-semibold text-muted ring-1 ring-blue-200 hover:text-ink-900"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl bg-surface-muted px-4 py-2 text-sm font-semibold text-brand-end ring-1 ring-blue-200 hover:text-ink-900"
            >
              Guest · Log in to save
            </button>
          )}
        </div>
      </div>

      {needsSetup && (
        <div className="mt-6 rounded-2xl border border-tile-circle/40 bg-tile-circle/10 px-5 py-4">
          <p className="font-bold text-tile-circle">⚠️ Database not set up yet</p>
          <p className="mt-1 text-sm text-muted">
            Saving won't persist until you run <b className="text-ink-900">supabase/schema.sql</b> in
            the Supabase SQL editor. See the README for the 2-minute setup.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            {user ? `Hey, ${displayName} 👋` : "Host a game"}
          </h1>
          <p className="mt-1 text-muted">Build a quiz, then players join with a PIN.</p>
        </div>
        <button onClick={onNew} className="alkheelank-btn-primary shrink-0 px-8">
          ✏️ New quiz
        </button>
      </div>

      {/* My Quizzes */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">My Quizzes</h2>

        {guest || !configured ? (
          <div className="alkheelank-card mt-4 flex items-center justify-between p-6">
            <p className="text-muted">
              {configured
                ? "Sign in to save quizzes to your account and reuse them any time."
                : "Login isn't configured yet — running in guest mode."}
            </p>
            {configured && (
              <button onClick={() => navigate("/login")} className="alkheelank-btn-ghost shrink-0">
                Log in
              </button>
            )}
          </div>
        ) : loading ? (
          <p className="mt-4 text-muted">Loading…</p>
        ) : quizzes.length === 0 ? (
          <div className="alkheelank-card mt-4 p-6 text-center text-muted">
            No saved quizzes yet.{" "}
            <b className="text-ink-900">New quiz</b> to build one, or{" "}
            <b className="text-ink-900">copy a starter</b> below.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <MyQuizCard
                key={q.id}
                quiz={q}
                onLaunch={() => onLaunchSaved(q)}
                onEdit={() => onEdit(q)}
                onDuplicate={() => handleDuplicate(q)}
                onDelete={() => handleDelete(q.id)}
                onShare={() => setShareTarget(q)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Import a shared quiz */}
      <section className="mt-6">
        <button
          onClick={() => navigate("/share")}
          className="text-sm font-semibold text-muted underline-offset-4 hover:text-brand-end hover:underline"
        >
          📥 Import a shared quiz by code →
        </button>
      </section>

      {/* Starter Templates */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Starter Templates</h2>
        <p className="mt-1 text-muted text-sm">
          Ready to play out of the box. Launch directly or copy one into your library to edit.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STARTER_SUMMARIES.map((q) => (
            <StarterCard
              key={q.id}
              quiz={q}
              onLaunch={() => onLaunchBuiltin(q)}
              onCopy={() => handleCopyStarter(q)}
              copying={copyingId === q.id}
              canCopy={!!user}
            />
          ))}
        </div>
      </section>

      {/* Game history */}
      {user && history.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-muted">Recent game nights</h2>
          <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-blue-200">
            {history.map((h, i) => (
              <div
                key={h.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  i % 2 ? "bg-surface-muted/80" : "bg-surface-elevated"
                }`}
              >
                <div>
                  <p className="font-bold text-ink-900">{h.quiz_title}</p>
                  <p className="text-xs text-muted">
                    {new Date(h.played_at).toLocaleDateString()} · {h.player_count} players
                  </p>
                </div>
                <p className="text-sm text-muted">
                  🏆 <span className="font-bold text-ink-900">{h.winner || "—"}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// My quiz card
// ---------------------------------------------------------------------------
function MyQuizCard({ quiz, onLaunch, onEdit, onDuplicate, onDelete, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  // Close the kebab menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="alkheelank-card flex flex-col p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="w-fit rounded-full bg-brand-mid/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-end">
            {quiz.questions?.length || 0} Qs
          </span>
          <h3 className="mt-2 line-clamp-2 font-display text-xl font-bold">{quiz.title}</h3>
        </div>
        {/* Kebab menu */}
        <div ref={ref} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-xl text-muted hover:bg-surface-muted hover:text-ink-900"
          >
            ⋯
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-2xl bg-surface-elevated shadow-xl ring-1 ring-blue-200"
              >
                {[
                  { label: "✏️ Edit", fn: onEdit },
                  { label: "📋 Duplicate", fn: onDuplicate },
                  { label: "🔗 Share", fn: onShare },
                  { label: "🗑 Delete", fn: onDelete, danger: true },
                ].map(({ label, fn, danger }) => (
                  <button
                    key={label}
                    onClick={() => { setMenuOpen(false); fn(); }}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-surface-muted ${
                      danger ? "text-tile-triangle" : "text-ink-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 rounded-xl bg-surface-muted py-2 text-sm font-bold text-ink-900 ring-1 ring-blue-200 hover:bg-surface-elevated"
        >
          ✏️ Edit
        </button>
        <button
          onClick={onLaunch}
          className="flex-1 rounded-xl bg-gradient-to-r from-brand-start to-brand-mid py-2 text-sm font-bold text-white hover:brightness-110"
        >
          ▶ Host
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Starter template card
// ---------------------------------------------------------------------------
function StarterCard({ quiz, onLaunch, onCopy, copying, canCopy }) {
  const accent = CATEGORY_COLORS[quiz.category] || "#3b82f6";
  return (
    <div
      className="alkheelank-card flex flex-col overflow-hidden p-0"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      {quiz.coverImage && (
        <div className="relative h-36 w-full shrink-0 overflow-hidden">
          <img
            src={quiz.coverImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-surface-elevated via-surface-elevated/40 to-transparent"
            aria-hidden
          />
          <span className="absolute bottom-3 left-4 text-3xl drop-shadow-md">
            {quiz.emoji || "🎯"}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div>
          <h3 className="font-display text-lg font-bold leading-tight">{quiz.title}</h3>
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: accent }}
          >
            {quiz.category} · {quiz.questionCount} questions
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm text-muted">{quiz.description}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onLaunch}
            className="flex-1 rounded-xl bg-surface-muted py-2 text-sm font-bold text-ink-900 ring-1 ring-blue-200 hover:bg-surface-elevated"
          >
            ▶ Launch
          </button>
          <button
            onClick={onCopy}
            disabled={copying || !canCopy}
            title={!canCopy ? "Log in to copy to your library" : "Copy to My Quizzes"}
            className="flex-1 rounded-xl py-2 text-sm font-bold transition disabled:opacity-40"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            {copying ? "Copying…" : "📋 Copy"}
          </button>
        </div>
        {!canCopy && (
          <p className="mt-1.5 text-center text-xs text-muted">Log in to copy</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share modal
// ---------------------------------------------------------------------------
function ShareModal({ quiz, userId, onClose }) {
  const [step, setStep] = useState("idle"); // idle | creating | done | error
  const [code, setCode] = useState(null);
  const [errMsg, setErrMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const generate = async () => {
    setStep("creating");
    const { data, error } = await createQuizShare(userId, quiz);
    if (error || !data) {
      setErrMsg(error?.message || "Couldn't create share link.");
      setStep("error");
      return;
    }
    setCode(data.code);
    setStep("done");
  };

  const shareUrl = code ? `${origin}/share/${code}` : "";

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-surface-elevated p-7 shadow-2xl ring-1 ring-blue-200"
      >
        <h2 className="font-display text-2xl font-bold">Share quiz</h2>
        <p className="mt-1 text-sm text-muted">
          Anyone with the link gets a copy — your original stays untouched.
        </p>
        <div className="mt-3 rounded-xl bg-surface-muted px-4 py-3 ring-1 ring-blue-200">
          <p className="font-display text-lg font-bold">{quiz.title}</p>
          <p className="text-sm text-muted">{quiz.questions?.length || 0} questions</p>
        </div>

        {step === "idle" && (
          <button onClick={generate} className="alkheelank-btn-primary mt-5 w-full">
            Generate share link
          </button>
        )}
        {step === "creating" && (
          <p className="mt-5 text-center text-muted animate-pulse">Creating…</p>
        )}
        {step === "error" && (
          <p className="mt-5 text-center font-semibold text-tile-triangle">{errMsg}</p>
        )}
        {step === "done" && code && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-surface-muted p-3 ring-1 ring-blue-200">
              <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-ink-900">
                {shareUrl}
              </code>
              <button
                onClick={copyLink}
                className="shrink-0 rounded-xl bg-brand-mid/20 px-3 py-1.5 text-xs font-bold text-brand-end hover:bg-brand-mid/40"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-center text-xs text-muted">
              Share code: <b className="font-mono text-ink-900">{code}</b>
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-surface-muted py-2.5 text-sm font-semibold text-muted ring-1 ring-blue-200 hover:text-ink-900"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
