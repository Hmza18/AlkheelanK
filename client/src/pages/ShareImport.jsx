import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth.jsx";
import { getQuizShare, createQuiz } from "../lib/db.js";
import Logo from "../components/Logo.jsx";
import BuiltByHamza from "../components/BuiltByHamza.jsx";

// Handles two entry points:
//   /share/:code  — arrived via a share link (code from URL)
//   /share        — manual code entry (e.g. typed from a group-chat message)
export default function ShareImport() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const { user, configured } = useAuth();

  const [input, setInput] = useState(urlCode || "");
  const [share, setShare] = useState(null);     // fetched share record
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  // Auto-fetch when arriving with a code in the URL.
  useEffect(() => {
    if (urlCode) fetchShare(urlCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShare = async (code) => {
    setErr(null);
    setShare(null);
    setDone(false);
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await getQuizShare(code.trim());
    setLoading(false);
    if (error || !data) {
      setErr("No quiz found with that code. Double-check it and try again.");
      return;
    }
    setShare(data);
  };

  const handleLookup = (e) => {
    e.preventDefault();
    fetchShare(input);
  };

  const handleImport = async () => {
    if (!user) { navigate(`/login?next=/share/${share.code}`); return; }
    setImporting(true);
    setErr(null);
    const { error } = await createQuiz(user.id, {
      title: `${share.quiz_title} (imported)`.slice(0, 80),
      questions: share.questions,
    });
    setImporting(false);
    if (error) { setErr(error.message || "Import failed."); return; }
    setDone(true);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/")} className="rounded-xl transition hover:scale-[1.01]">
          <Logo size="sm" />
        </button>
      </div>

      <h1 className="mt-8 font-display text-3xl font-bold">Import a shared quiz</h1>
      <p className="mt-2 text-muted">
        Enter the 8-character share code (or open the share link directly). You'll get your own
        copy — independent of the original.
      </p>

      {/* Code input */}
      {!share && (
        <form onSubmit={handleLookup} className="mt-8">
          <input
            className="alkheelank-input pin-display !text-2xl uppercase"
            placeholder="Share code"
            maxLength={8}
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ""))}
            autoFocus={!urlCode}
          />
          <button
            type="submit"
            disabled={loading || input.length < 6}
            className="alkheelank-btn-primary mt-4 w-full text-lg"
          >
            {loading ? "Looking up…" : "Find quiz →"}
          </button>
          {err && (
            <p className="mt-4 text-center font-semibold text-tile-triangle">{err}</p>
          )}
        </form>
      )}

      {/* Preview + import */}
      {share && !done && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="alkheelank-card p-6">
            <span className="rounded-full bg-brand-mid/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-end">
              {share.questions?.length || 0} questions
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold">{share.quiz_title}</h2>
            <p className="mt-1 text-sm text-muted">
              Share code:{" "}
              <span className="font-mono font-bold text-paper">{share.code}</span>
            </p>
            <div className="mt-4 max-h-40 overflow-y-auto space-y-1">
              {(share.questions || []).slice(0, 8).map((q, i) => (
                <p key={i} className="truncate text-sm text-muted">
                  {i + 1}. {q.question}
                </p>
              ))}
              {(share.questions?.length || 0) > 8 && (
                <p className="text-xs text-muted">
                  + {share.questions.length - 8} more…
                </p>
              )}
            </div>
          </div>

          {err && (
            <p className="mt-4 text-center font-semibold text-tile-triangle">{err}</p>
          )}

          {!configured ? (
            <p className="mt-4 text-center text-muted">
              Login isn't configured — you can't import to an account yet.
            </p>
          ) : !user ? (
            <div className="mt-4 rounded-2xl bg-ink-700/60 p-5 text-center ring-1 ring-white/10">
              <p className="text-muted">Log in to save this quiz to your account.</p>
              <button
                onClick={() => navigate(`/login?next=/share/${share.code}`)}
                className="alkheelank-btn-primary mt-4"
              >
                Log in to import
              </button>
            </div>
          ) : (
            <button
              onClick={handleImport}
              disabled={importing}
              className="alkheelank-btn-primary mt-5 w-full text-lg"
            >
              {importing ? "Importing…" : "📥 Copy to my quizzes"}
            </button>
          )}

          <button
            onClick={() => { setShare(null); setInput(""); setErr(null); }}
            className="mt-3 w-full text-center text-sm text-muted hover:text-paper"
          >
            Try a different code
          </button>
        </motion.div>
      )}

      {/* Success */}
      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-10 flex flex-col items-center text-center"
        >
          <div className="text-6xl">🎉</div>
          <h2 className="mt-4 font-display text-2xl font-bold">Quiz imported!</h2>
          <p className="mt-2 text-muted">
            It's now in your library, ready to launch or edit whenever you like.
          </p>
          <button onClick={() => navigate("/host")} className="alkheelank-btn-primary mt-8 px-12">
            Go to my dashboard →
          </button>
        </motion.div>
      )}

      <BuiltByHamza className="mt-auto pt-10" />

      <button
        onClick={() => navigate(-1)}
        className="mt-4 text-sm text-muted hover:text-paper"
      >
        ← Back
      </button>
    </div>
  );
}
