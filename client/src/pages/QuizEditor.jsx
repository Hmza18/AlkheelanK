import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { answerStyle, tfStyle } from "../lib/answers.js";
import { fileToDataURL } from "../lib/image.js";
import { isSetupError, addBankQuestion, listBankQuestions, bankRowToQuestion } from "../lib/db.js";
import Logo from "../components/Logo.jsx";

const SETUP_HELP =
  "Your database isn't set up yet. Run supabase/schema.sql in the Supabase SQL editor (see README), then try again.";

const blankQuestion = () => ({
  type: "mc",
  question: "",
  answers: ["", "", "", ""],
  correct: 0,
  timeLimit: 20,
  image: null,
});

// Create or edit a quiz. `initial` is null for a brand-new quiz, or a saved
// quiz row { id, title, questions } when editing. `userId` is needed for bank
// features (null for guests — bank buttons simply don't appear).
export default function QuizEditor({ initial, canSave, userId, onCancel, onSave, onLaunch }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [questions, setQuestions] = useState(
    initial?.questions?.length ? initial.questions.map((q) => ({ ...q })) : [blankQuestion()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2600);
    return () => clearTimeout(t);
  }, [saved]);

  const update = (i, patch) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const updateAnswer = (i, ai, value) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === i ? { ...q, answers: q.answers.map((a, x) => (x === ai ? value : a)) } : q
      )
    );
  const addQuestion = () => setQuestions((qs) => [...qs, blankQuestion()]);
  const removeQuestion = (i) =>
    setQuestions((qs) => (qs.length > 1 ? qs.filter((_, idx) => idx !== i) : qs));
  const addFromBank = (q) => setQuestions((qs) => [...qs, { ...q }]);

  const ready =
    title.trim() &&
    questions.length > 0 &&
    questions.every(
      (q) =>
        q.question.trim() &&
        ((q.type || "mc") === "tf" || q.answers.every((a) => a.trim()))
    );

  const payload = () => ({ title: title.trim() || "Untitled quiz", questions });

  const handleSave = async () => {
    setSaved(false);
    if (!ready) { setError("Add a title and fill in every question + answer."); return; }
    setSaving(true);
    setError(null);
    let err;
    try { err = await onSave(payload()); } catch (e) { err = e; }
    setSaving(false);
    if (err) {
      setError(isSetupError(err) ? SETUP_HELP : err.message || "Couldn't save — please try again.");
      return;
    }
    setSaved(true);
  };

  const handleLaunch = () => {
    if (!ready) { setError("Add a title and fill in every question + answer."); return; }
    onLaunch(payload());
  };

  return (
    <div className="alkheelank-safe-x mx-auto max-w-3xl pb-36 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.location.assign("/")}
          className="rounded-xl transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-mid"
          aria-label="Go to homepage"
        >
          <Logo size="sm" />
        </button>
        <button type="button" onClick={onCancel} className="min-h-touch px-2 text-muted hover:text-paper">
          ← Dashboard
        </button>
      </div>

      <h1 className="mt-8 font-display text-3xl font-bold">
        {initial?.id ? "Edit quiz" : "New quiz"}
      </h1>
      <input
        className="alkheelank-input mt-4 !text-left !text-xl"
        placeholder="Quiz title (e.g. Friday Family Trivia)"
        maxLength={80}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="mt-6 flex flex-col gap-6">
        {questions.map((q, i) => (
          <QuestionEditor
            key={i}
            index={i}
            q={q}
            canRemove={questions.length > 1}
            userId={userId}
            onChange={(patch) => update(i, patch)}
            onAnswer={(ai, v) => updateAnswer(i, ai, v)}
            onRemove={() => removeQuestion(i)}
          />
        ))}
      </div>

      <button onClick={addQuestion} className="alkheelank-btn-ghost mt-6 w-full">
        + Add question
      </button>

      {error && (
        <p className="mt-6 rounded-xl bg-tile-triangle/20 px-4 py-3 text-center font-semibold text-tile-triangle">
          {error}
        </p>
      )}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-tile-square px-6 py-3 font-bold text-ink-900 shadow-glow"
          >
            ✓ Saved to your account
          </motion.div>
        )}
      </AnimatePresence>

      {bankOpen && (
        <BankPicker
          userId={userId}
          onAdd={(q) => { addFromBank(q); setBankOpen(false); }}
          onClose={() => setBankOpen(false)}
        />
      )}

      <div className="alkheelank-safe-bottom fixed inset-x-0 bottom-0 border-t border-white/10 bg-ink-900/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="hidden text-muted sm:block">
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </span>
          <div className="flex flex-1 items-center justify-end gap-3">
            {userId && (
              <button
                onClick={() => setBankOpen(true)}
                className="min-h-touch rounded-xl bg-ink-700 px-4 py-2.5 text-sm font-bold text-muted ring-1 ring-white/10 hover:text-paper"
                title="Add questions from your bank"
              >
                📚 From bank
              </button>
            )}
            {canSave ? (
              <button onClick={handleSave} disabled={saving} className="alkheelank-btn-ghost px-6">
                {saving ? "Saving…" : initial?.id ? "Save" : "Save to account"}
              </button>
            ) : (
              <span className="self-center text-xs text-muted">Log in to save</span>
            )}
            <button onClick={handleLaunch} className="alkheelank-btn-primary px-8">
              Launch →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question editor card
// ---------------------------------------------------------------------------
function QuestionEditor({ index, q, canRemove, userId, onChange, onAnswer, onRemove }) {
  const [bankSaved, setBankSaved] = useState(false);
  const type = q.type || "mc";

  const setType = (next) => {
    if (next === type) return;
    if (next === "tf") {
      onChange({ type: "tf", answers: ["True", "False"], correct: Math.min(q.correct ?? 0, 1) });
    } else {
      onChange({ type: "mc", answers: ["", "", "", ""], correct: 0 });
    }
  };

  const saveToBank = async () => {
    if (!userId || !q.question.trim()) return;
    const { error } = await addBankQuestion(userId, q);
    if (!error) {
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 2000);
    }
  };

  return (
    <div className="alkheelank-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-bold text-muted">Q{index + 1}</span>
        <div className="flex items-center gap-2">
          {userId && q.question.trim() && (
            <button
              type="button"
              onClick={saveToBank}
              title="Save this question to your bank"
              className={`min-h-touch rounded-lg px-3 py-2 text-sm font-bold transition ${
                bankSaved
                  ? "text-tile-square"
                  : "text-muted hover:text-paper"
              }`}
            >
              {bankSaved ? "🔖 Saved" : "🔖 Bank"}
            </button>
          )}
          {canRemove && (
            <button
              onClick={onRemove}
              className="min-h-touch rounded-lg px-3 py-2 text-sm font-semibold text-tile-triangle hover:bg-tile-triangle/10"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 inline-flex rounded-xl bg-ink-800 p-1 ring-1 ring-white/10">
        {[{ id: "mc", label: "Multiple choice" }, { id: "tf", label: "True / False" }].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setType(opt.id)}
            className={`min-h-touch rounded-lg px-4 py-2.5 text-sm font-bold transition ${
              type === opt.id ? "bg-brand-mid text-paper" : "text-muted hover:text-paper"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        className="mt-3 w-full resize-none rounded-2xl bg-ink-800 px-4 py-3 text-lg font-semibold text-paper ring-2 ring-white/10 focus:outline-none focus:ring-brand-mid"
        rows={2}
        placeholder={type === "tf" ? "Type a statement (true or false)…" : "Type your question…"}
        maxLength={140}
        value={q.question}
        onChange={(e) => onChange({ question: e.target.value })}
      />

      <ImagePicker image={q.image} onChange={(image) => onChange({ image })} />

      {type === "tf" ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["True", "False"].map((label, ai) => {
            const s = tfStyle(ai);
            const isCorrect = q.correct === ai;
            return (
              <button
                key={ai}
                type="button"
                onClick={() => onChange({ correct: ai })}
                className={`flex min-h-touch items-center justify-center gap-2 rounded-2xl py-5 text-2xl font-bold text-paper transition ${
                  isCorrect ? "ring-4 ring-paper" : "opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: s.color }}
              >
                <span className="text-3xl">{s.glyph}</span>
                {label}
                {isCorrect && <span className="ml-1 text-xl">✓</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {q.answers.map((a, ai) => {
            const s = answerStyle(ai);
            const isCorrect = q.correct === ai;
            return (
              <div
                key={ai}
                className="flex items-center gap-2 rounded-2xl pl-3 pr-2 py-1"
                style={{ backgroundColor: `${s.color}22` }}
              >
                <span className="text-2xl" style={{ color: s.color }}>{s.glyph}</span>
                <input
                  className="flex-1 bg-transparent py-2 font-semibold text-paper placeholder:text-muted/60 focus:outline-none"
                  placeholder={`Answer ${ai + 1}`}
                  maxLength={60}
                  value={a}
                  onChange={(e) => onAnswer(ai, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => onChange({ correct: ai })}
                  title="Mark as correct"
                  className={`alkheelank-touch-target shrink-0 rounded-full text-sm font-bold transition ${
                    isCorrect ? "bg-tile-square text-ink-900" : "bg-ink-700 text-muted hover:text-paper"
                  }`}
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange({ doublePoints: !q.doublePoints })}
          className={`min-h-touch rounded-xl px-3 py-2.5 text-sm font-bold ring-1 transition ${
            q.doublePoints
              ? "bg-brand-mid/25 text-paper ring-brand-mid"
              : "bg-ink-800 text-muted ring-white/10 hover:text-paper"
          }`}
        >
          2× points
        </button>
        <label className="text-sm font-semibold text-muted">Time</label>
        <select
          className="rounded-xl bg-ink-800 px-3 py-2 font-semibold text-paper ring-1 ring-white/10 focus:outline-none focus:ring-brand-mid"
          value={q.timeLimit}
          onChange={(e) => onChange({ timeLimit: Number(e.target.value) })}
        >
          {[10, 15, 20, 30, 45, 60].map((t) => (
            <option key={t} value={t}>{t}s</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted">
          Correct:{" "}
          <b className="text-paper">
            {type === "tf" ? tfStyle(q.correct).label : answerStyle(q.correct).glyph}
          </b>
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bank picker drawer
// ---------------------------------------------------------------------------
function BankPicker({ userId, onAdd, onClose }) {
  const [questions, setQuestions] = useState(null); // null = loading
  const [filter, setFilter] = useState("");
  const [err, setErr] = useState(null);

  useEffect(() => {
    listBankQuestions(userId).then(({ data, error }) => {
      if (error) setErr(error.message);
      setQuestions(data || []);
    });
  }, [userId]);

  const visible = (questions || []).filter(
    (q) => !filter || q.question.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="relative z-10 flex w-full max-w-2xl flex-col rounded-t-3xl bg-ink-800 shadow-2xl ring-1 ring-white/10"
        style={{ maxHeight: "80vh" }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="font-display text-xl font-bold">Your Question Bank</h2>
          <button type="button" onClick={onClose} className="alkheelank-touch-target text-muted hover:text-paper">✕</button>
        </div>

        <div className="px-6 pb-3">
          <input
            className="alkheelank-input !py-2.5 !text-base !text-left"
            placeholder="Search questions…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
        </div>

        <div className="overflow-y-auto px-6 pb-8 flex-1">
          {questions === null ? (
            <p className="py-8 text-center text-muted animate-pulse">Loading…</p>
          ) : err ? (
            <p className="py-8 text-center text-tile-triangle">{err}</p>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-muted">
              {filter
                ? "No questions match that search."
                : "Your bank is empty. Hit 🔖 Bank on any question to save it here."}
            </p>
          ) : (
            <div className="space-y-3">
              {visible.map((row) => {
                const q = bankRowToQuestion(row);
                return (
                  <div
                    key={row.id}
                    className="flex items-start justify-between gap-4 rounded-2xl bg-ink-700/60 px-4 py-3 ring-1 ring-white/10"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-mid/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-end">
                          {q.type === "tf" ? "T/F" : "MC"}
                        </span>
                        <span className="text-xs text-muted">{q.timeLimit}s</span>
                      </div>
                      <p className="mt-1 line-clamp-2 font-semibold text-paper">{q.question}</p>
                    </div>
                    <button
                      onClick={() => onAdd(q)}
                      className="min-h-touch shrink-0 rounded-xl bg-brand-mid/20 px-4 py-2.5 text-sm font-bold text-brand-end hover:bg-brand-mid/40"
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image picker
// ---------------------------------------------------------------------------
function ImagePicker({ image, onChange }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const dataUrl = await fileToDataURL(file);
      onChange(dataUrl);
      setOpen(false);
    } catch (e2) {
      setErr(e2.message || "Couldn't load that image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const applyUrl = () => {
    const u = url.trim();
    if (!u) return;
    onChange(u);
    setUrl("");
    setOpen(false);
  };

  if (image) {
    return (
      <div className="mt-3 flex items-center gap-3">
        <img
          src={image}
          alt="Question"
          className="h-20 w-20 rounded-xl object-cover ring-1 ring-white/15"
          onError={() => setErr("Image failed to load — check the URL.")}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-paper">Image attached</span>
          <button
            onClick={() => onChange(null)}
            className="self-start rounded-lg px-2 py-1 text-sm font-semibold text-tile-triangle hover:bg-tile-triangle/10"
          >
            Remove image
          </button>
          {err && <span className="text-xs text-tile-triangle">{err}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-ink-700 px-3 py-2 text-sm font-semibold text-muted ring-1 ring-white/10 hover:text-paper"
        >
          🖼️ Add image
        </button>
      ) : (
        <div className="rounded-2xl bg-ink-800 p-3 ring-1 ring-white/10">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-xl bg-ink-700 px-3 py-2 font-medium text-paper placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-mid"
              placeholder="Paste image URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyUrl()}
            />
            <button onClick={applyUrl} className="alkheelank-btn-ghost !py-2 !text-sm">Use URL</button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="alkheelank-btn-ghost !py-2 !text-sm"
            >
              {busy ? "Uploading…" : "⬆ Upload file"}
            </button>
            <button
              onClick={() => { setOpen(false); setErr(null); }}
              className="text-sm text-muted hover:text-paper"
            >
              Cancel
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          </div>
          {err && <p className="mt-2 text-sm text-tile-triangle">{err}</p>}
        </div>
      )}
    </div>
  );
}
