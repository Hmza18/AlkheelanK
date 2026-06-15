import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { answerStyle, tfStyle } from "../lib/answers.js";
import { fileToDataURL } from "../lib/image.js";
import { extractPdfText } from "../lib/pdf.js";
import {
  isSetupError,
  addBankQuestion,
  listBankQuestions,
  bankRowToQuestion,
  deleteBankQuestion,
} from "../lib/db.js";
import Logo from "../components/Logo.jsx";
import AnswerTile from "../components/AnswerTile.jsx";
import QuestionScreen from "../components/QuestionScreen.jsx";
import { TimerStrip } from "../components/Timer.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { normalizeStarterQuestions, starterImageSrc } from "../lib/starterImages.js";
import { prepareStarterQuestionsForEditor } from "../lib/starterTemplate.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const MAX_QUESTIONS = 30;
const MAX_QUESTION_CHARS = 500;
const MAX_ANSWER_CHARS = 120;

const SETUP_HELP =
  "Your database isn't set up yet. Run supabase/schema.sql in the Supabase SQL editor (see README), then try again.";

// Points mode used by the editor; normalizes the legacy `doublePoints` boolean.
const questionPoints = (q) =>
  q.points === "double" || q.points === "none" || q.points === "standard"
    ? q.points
    : q.doublePoints
    ? "double"
    : "standard";

const blankQuestion = () => ({
  type: "mc",
  question: "",
  answers: ["", "", "", ""],
  correct: 0,
  timeLimit: 20,
  image: null,
  points: "standard",
  hint: "",
  mediaPrompt: "",
});

function serializeQuiz(title, questions) {
  return JSON.stringify({
    title: title.trim(),
    questions: questions.map((q) => ({
      type: q.type || "mc",
      question: q.question,
      answers: [...(q.answers || [])],
      correct: Array.isArray(q.correct) ? [...q.correct] : q.correct ?? 0,
      accept: Array.isArray(q.accept) ? [...q.accept] : undefined,
      timeLimit: q.timeLimit ?? 20,
      image: q.image ?? null,
      points: questionPoints(q),
      hint: q.hint ?? "",
      mediaPrompt: q.mediaPrompt ?? "",
    })),
  });
}

// Per-type fresh answer fields, used when adding a question or switching type.
const TYPE_DEFAULTS = {
  mc: () => ({ answers: ["", "", "", ""], correct: 0, accept: undefined }),
  tf: () => ({ answers: ["True", "False"], correct: 0, accept: undefined }),
  ms: () => ({ answers: ["", "", "", ""], correct: [], accept: undefined }),
  type: () => ({ answers: [], correct: 0, accept: ["", ""] }),
  puzzle: () => ({ answers: ["", "", "", ""], correct: 0, accept: undefined }),
};

const TYPE_OPTIONS = [
  { id: "mc", label: "Multiple choice", short: "MC" },
  { id: "tf", label: "True / False", short: "T/F" },
  { id: "ms", label: "Multi-select", short: "MS" },
  { id: "type", label: "Type answer", short: "TYPE" },
  { id: "puzzle", label: "Puzzle", short: "PUZ" },
];

// Is a question complete enough to launch?
function questionFilled(q) {
  if (!q.question?.trim()) return false;
  const type = q.type || "mc";
  if (type === "tf") return true;
  if (type === "type") return (q.accept || []).some((a) => a.trim());
  if (type === "ms") {
    const filled = (q.answers || []).filter((a) => a.trim());
    return filled.length >= 2 && Array.isArray(q.correct) && q.correct.length > 0;
  }
  if (type === "puzzle") return (q.answers || []).filter((a) => a.trim()).length >= 2;
  return (q.answers || []).every((a) => a.trim()); // mc
}

// Create or edit a quiz. `initial` is null for a brand-new quiz, or a saved
// quiz row { id, title, questions } when editing. `userId` is needed for bank
// features (null for guests — bank buttons simply don't appear).
export default function QuizEditor({ initial, canSave, userId, onCancel, onSave, onLaunch }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [questions, setQuestions] = useState(() =>
    initial?.questions?.length
      ? prepareStarterQuestionsForEditor(initial.title || "", initial.questions)
      : [blankQuestion()],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [launchWarnOpen, setLaunchWarnOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const savedSnapshotRef = useRef(
    serializeQuiz(initial?.title || "", initial?.questions?.length ? initial.questions : [blankQuestion()])
  );

  // Feature-detect AI generation so the button only shows when the server has a key.
  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/features`)
      .then((r) => (r.ok ? r.json() : null))
      .then((f) => {
        if (!cancelled && f?.aiGeneration) setAiAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2600);
    return () => clearTimeout(t);
  }, [saved]);

  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, questions.length - 1)));
  }, [questions.length]);

  const update = (i, patch) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const updateAnswer = (i, ai, value) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === i ? { ...q, answers: q.answers.map((a, x) => (x === ai ? value : a)) } : q
      )
    );
  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) return;
    setQuestions((qs) => [...qs, blankQuestion()]);
    setSelectedIndex(questions.length);
  };
  // Generated questions replace a lone untouched blank question instead of
  // appending after it, so a fresh quiz doesn't start with an empty card.
  const addGenerated = (gen) => {
    setQuestions((qs) => {
      const isBlank = (q) => !q.question.trim() && q.answers.every((a) => !a.trim());
      const keep = qs.length === 1 && isBlank(qs[0]) ? [] : qs;
      return [...keep, ...gen.questions.map((q) => ({ ...q }))];
    });
    if (!title.trim() && gen.title) setTitle(gen.title);
  };
  const removeQuestion = (i) => {
    setQuestions((qs) => {
      if (qs.length <= 1) return qs;
      return qs.filter((_, idx) => idx !== i);
    });
    setSelectedIndex((sel) => {
      if (sel > i) return sel - 1;
      if (sel >= questions.length - 1) return Math.max(0, questions.length - 2);
      return sel;
    });
  };
  const duplicateQuestion = (i) =>
    setQuestions((qs) => {
      if (qs.length >= MAX_QUESTIONS) return qs;
      const src = qs[i];
      const copy = {
        ...src,
        answers: [...(src.answers || [])],
        correct: Array.isArray(src.correct) ? [...src.correct] : src.correct,
        accept: Array.isArray(src.accept) ? [...src.accept] : src.accept,
      };
      setSelectedIndex(i + 1);
      return [...qs.slice(0, i + 1), copy, ...qs.slice(i + 1)];
    });
  const moveQuestion = (i, dir) => {
    setQuestions((qs) => {
      const j = i + dir;
      if (j < 0 || j >= qs.length) return qs;
      const next = [...qs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSelectedIndex((sel) => {
      if (sel === i) return i + dir;
      if (sel === i + dir) return i;
      return sel;
    });
  };
  const addFromBank = (q) => {
    setQuestions((qs) => {
      const next = [...qs, { ...q }];
      setSelectedIndex(next.length - 1);
      return next;
    });
  };

  const ready =
    title.trim() && questions.length > 0 && questions.every(questionFilled);

  const payload = () => ({
    title: title.trim() || "Untitled quiz",
    questions: normalizeStarterQuestions(questions),
  });
  const isDirty = useMemo(
    () => serializeQuiz(title, questions) !== savedSnapshotRef.current,
    [title, questions]
  );
  const atQuestionCap = questions.length >= MAX_QUESTIONS;

  const requestLeave = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    onCancel();
  };

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
    savedSnapshotRef.current = serializeQuiz(title, questions);
    setSaved(true);
  };

  const handleLaunch = () => {
    if (!ready) { setError("Add a title and fill in every question + answer."); return; }
    // The game uses the edits either way — but warn account holders that the
    // latest changes aren't saved to their library yet.
    if (canSave && isDirty) {
      setLaunchWarnOpen(true);
      return;
    }
    onLaunch(payload());
  };

  return (
    <div className="alkheelank-safe-x mx-auto max-w-6xl pb-36 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={requestLeave}
          className="rounded-xl transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-mid"
          aria-label="Back to dashboard"
        >
          <Logo size="sm" />
        </button>
        <button type="button" onClick={requestLeave} className="min-h-touch px-2 text-muted hover:text-ink-900">
          ← Dashboard
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold">
            {initial?.id ? "Edit quiz" : "New quiz"}
          </h1>
          <input
            className="alkheelank-input mt-3 !text-left !text-xl"
            placeholder="Quiz title (e.g. Friday Family Trivia)"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <p className="shrink-0 text-sm font-semibold text-muted">
          {questions.length} / {MAX_QUESTIONS} questions
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <QuestionSidebar
          questions={questions}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onAdd={addQuestion}
          atQuestionCap={atQuestionCap}
        />
        <div className="min-w-0 flex-1">
          <QuestionEditor
            key={selectedIndex}
            index={selectedIndex}
            q={questions[selectedIndex]}
            canRemove={questions.length > 1}
            canDuplicate={!atQuestionCap}
            canMoveUp={selectedIndex > 0}
            canMoveDown={selectedIndex < questions.length - 1}
            atQuestionCap={atQuestionCap}
            onAdd={addQuestion}
            userId={userId}
            onChange={(patch) => update(selectedIndex, patch)}
            onAnswer={(ai, v) => updateAnswer(selectedIndex, ai, v)}
            onRemove={() => removeQuestion(selectedIndex)}
            onDuplicate={() => duplicateQuestion(selectedIndex)}
            onMove={(dir) => moveQuestion(selectedIndex, dir)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:ml-[15.5rem]">
        {aiAvailable && (
          <button
            onClick={() => setAiOpen(true)}
            className="alkheelank-btn-ghost flex-1 !text-brand-end"
            title="Generate questions with AI"
          >
            ✨ Generate with AI
          </button>
        )}
        {aiAvailable && (
          <button
            onClick={() => setIngestOpen(true)}
            className="alkheelank-btn-ghost flex-1 !text-brand-end"
            title="Turn a document or pasted text into a quiz"
          >
            📄 Import from document
          </button>
        )}
      </div>

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
          onAddAll={(list) => {
            setQuestions((qs) => [...qs, ...list.map((q) => ({ ...q }))]);
            setBankOpen(false);
          }}
          onClose={() => setBankOpen(false)}
        />
      )}

      {aiOpen && (
        <AiGeneratePanel
          onGenerated={(gen) => { addGenerated(gen); setAiOpen(false); }}
          onClose={() => setAiOpen(false)}
        />
      )}

      {ingestOpen && (
        <IngestPanel
          onGenerated={(gen) => { addGenerated(gen); setIngestOpen(false); }}
          onClose={() => setIngestOpen(false)}
        />
      )}

      {previewOpen && (
        <QuizPreview
          title={title.trim() || "Untitled quiz"}
          questions={questions}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {launchWarnOpen && (
        <ConfirmModal
          title="Launch without saving?"
          message="The game will use your latest edits, but they aren't saved to your account yet."
          confirmLabel="Launch anyway"
          cancelLabel="Keep editing"
          onConfirm={() => {
            setLaunchWarnOpen(false);
            onLaunch(payload());
          }}
          onCancel={() => setLaunchWarnOpen(false)}
        />
      )}

      {discardOpen && (
        <ConfirmModal
          title="Discard unsaved changes?"
          message="You have edits that haven't been saved. Leave without saving?"
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          destructive
          onConfirm={() => {
            setDiscardOpen(false);
            onCancel();
          }}
          onCancel={() => setDiscardOpen(false)}
        />
      )}

      <div className="alkheelank-safe-bottom fixed inset-x-0 bottom-0 border-t border-edge bg-surface-elevated/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <span className={`hidden text-sm sm:block ${atQuestionCap ? "font-bold text-tile-circle" : "text-muted"}`}>
            Q{selectedIndex + 1} of {questions.length}
          </span>
          <div className="flex flex-1 items-center justify-end gap-3">
            <button
              type="button"
              onClick={addQuestion}
              disabled={atQuestionCap}
              className="min-h-touch rounded-xl bg-brand-mid/10 px-4 py-2.5 text-sm font-bold text-brand-mid ring-1 ring-brand-mid/30 hover:bg-brand-mid/15 disabled:cursor-not-allowed disabled:opacity-40"
              title={atQuestionCap ? `Quiz is at the ${MAX_QUESTIONS}-question limit` : "Add a new question"}
            >
              + Add question
            </button>
            {userId && (
              <button
                onClick={() => setBankOpen(true)}
                className="min-h-touch rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-bold text-muted ring-1 ring-edge hover:text-ink-900"
                title="Add questions from your bank"
              >
                📚 From bank
              </button>
            )}
            <button
              onClick={() => {
                if (!ready) { setError("Add a title and fill in every question + answer."); return; }
                setError(null);
                setPreviewOpen(true);
              }}
              className="min-h-touch rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-bold text-muted ring-1 ring-edge hover:text-ink-900"
              title="Play through the quiz exactly as players will see it"
            >
              ▶ Preview
            </button>
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
// Question sidebar — Kahoot-style overview list
// ---------------------------------------------------------------------------
function QuestionSidebar({ questions, selectedIndex, onSelect, onAdd, atQuestionCap }) {
  const renderItem = (q, i, compact = false) => {
    const filled = questionFilled(q);
    const type = q.type || "mc";
    const typeShort = TYPE_OPTIONS.find((t) => t.id === type)?.short || "MC";
    return (
      <button
        key={i}
        type="button"
        onClick={() => onSelect(i)}
        className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
          selectedIndex === i
            ? "border-brand-mid bg-brand-mid/10 ring-1 ring-brand-mid/30"
            : "border-edge bg-surface-elevated hover:bg-surface-muted"
        } ${compact ? "min-w-[9rem] shrink-0" : ""}`}
      >
        <span
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
            filled ? "bg-tile-square/20 text-tile-square" : "bg-surface-muted text-muted"
          }`}
        >
          {i + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink-900">
            {q.question.trim() || "Untitled question"}
          </span>
          <span className="mt-0.5 block text-[0.65rem] font-bold uppercase tracking-wider text-muted">
            {typeShort} · {q.timeLimit ?? 20}s
            {questionPoints(q) === "double" ? " · 2×" : questionPoints(q) === "none" ? " · 0×" : ""}
            {q.hint?.trim() ? " · 🔍" : ""}
          </span>
        </span>
        {q.image && (
          <img src={starterImageSrc(q.image)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-edge" />
        )}
      </button>
    );
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {questions.map((q, i) => renderItem(q, i, true))}
        <button
          type="button"
          onClick={onAdd}
          disabled={atQuestionCap}
          className="flex min-h-[3.25rem] shrink-0 items-center justify-center gap-1 rounded-xl border border-dashed border-brand-mid/40 bg-brand-mid/5 px-3 text-sm font-bold text-brand-mid disabled:opacity-40"
          title="Add question"
        >
          + Add
        </button>
      </div>
      <aside className="hidden w-56 shrink-0 lg:block">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Questions</p>
        <div className="sticky top-4 max-h-[calc(100dvh-12rem)] space-y-2 overflow-y-auto pr-1">
          {questions.map((q, i) => renderItem(q, i))}
          <button
            type="button"
            onClick={onAdd}
            disabled={atQuestionCap}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-mid/40 bg-brand-mid/5 px-3 py-3 text-sm font-bold text-brand-mid transition hover:bg-brand-mid/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add question
          </button>
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Question editor card
// ---------------------------------------------------------------------------
function QuestionEditor({
  index,
  q,
  canRemove,
  canDuplicate,
  canMoveUp,
  canMoveDown,
  atQuestionCap,
  onAdd,
  userId,
  onChange,
  onAnswer,
  onRemove,
  onDuplicate,
  onMove,
}) {
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState(null);
  const [pendingType, setPendingType] = useState(null);
  const type = q.type || "mc";
  const points = questionPoints(q);

  const answers = q.answers || [];
  const accept = q.accept || [];
  const correctArr = Array.isArray(q.correct) ? q.correct : [];

  const applyType = (next) => {
    onChange({ type: next, ...TYPE_DEFAULTS[next]() });
    setPendingType(null);
  };

  const setType = (next) => {
    if (next === type) return;
    const hasContent = answers.some((a) => a.trim()) || accept.some((a) => a.trim());
    if (hasContent) {
      setPendingType(next);
      return;
    }
    applyType(next);
  };

  // Variable-length option helpers (ms / puzzle / type).
  const setAnswers = (arr) => onChange({ answers: arr });
  const toggleMsCorrect = (i) => {
    const set = new Set(correctArr);
    set.has(i) ? set.delete(i) : set.add(i);
    onChange({ correct: [...set].sort((a, b) => a - b) });
  };
  const addOption = () => answers.length < 6 && setAnswers([...answers, ""]);
  const removeOption = (i) => {
    if (answers.length <= 2) return;
    const next = answers.filter((_, x) => x !== i);
    if (type === "ms") {
      const correct = correctArr.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c));
      onChange({ answers: next, correct });
    } else {
      setAnswers(next);
    }
  };
  const moveOption = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= answers.length) return;
    const next = [...answers];
    [next[i], next[j]] = [next[j], next[i]];
    setAnswers(next);
  };
  const updateAccept = (i, v) => onChange({ accept: accept.map((a, x) => (x === i ? v : a)) });
  const addAccept = () => accept.length < 8 && onChange({ accept: [...accept, ""] });
  const removeAccept = (i) => accept.length > 1 && onChange({ accept: accept.filter((_, x) => x !== i) });

  const saveToBank = async () => {
    if (!userId || !q.question.trim()) return;
    setBankError(null);
    const { error } = await addBankQuestion(userId, q);
    if (error) {
      setBankError(error.message || "Couldn't save to bank.");
      return;
    }
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 2000);
  };

  return (
    <div className="alkheelank-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-lg font-bold text-ink-900">Question {index + 1}</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg bg-surface-muted ring-1 ring-edge">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={!canMoveUp}
              title="Move question up"
              aria-label={`Move question ${index + 1} up`}
              className="min-h-touch rounded-l-lg px-2.5 py-2 text-sm font-bold text-muted hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={!canMoveDown}
              title="Move question down"
              aria-label={`Move question ${index + 1} down`}
              className="min-h-touch rounded-r-lg px-2.5 py-2 text-sm font-bold text-muted hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ↓
            </button>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={atQuestionCap}
            title={atQuestionCap ? `Quiz is at the ${MAX_QUESTIONS}-question limit` : "Add a new question"}
            className="min-h-touch rounded-lg px-3 py-2 text-sm font-bold text-brand-mid hover:bg-brand-mid/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            + Add
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            disabled={!canDuplicate}
            title={canDuplicate ? "Duplicate this question" : `Quiz is at the ${MAX_QUESTIONS}-question limit`}
            className="min-h-touch rounded-lg px-3 py-2 text-sm font-bold text-muted hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ⧉ Duplicate
          </button>
          {userId && q.question.trim() && (type === "mc" || type === "tf") && (
            <button
              type="button"
              onClick={saveToBank}
              title="Save this question to your bank"
              className={`min-h-touch rounded-lg px-3 py-2 text-sm font-bold transition ${
                bankSaved ? "text-tile-square" : "text-muted hover:text-ink-900"
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

      <div className="mt-3 flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-edge">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setType(opt.id)}
            className={`min-h-touch rounded-lg px-3 py-2.5 text-sm font-bold transition ${
              type === opt.id ? "bg-brand-mid text-white" : "text-muted hover:text-ink-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {pendingType && (
        <div className="mt-3 rounded-xl bg-tile-circle/10 px-4 py-3 ring-1 ring-tile-circle/30">
          <p className="text-sm font-semibold text-ink-900">
            Switch to {TYPE_OPTIONS.find((t) => t.id === pendingType)?.label}? Your current answers will be reset.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => applyType(pendingType)} className="rounded-lg bg-brand-mid px-3 py-1.5 text-sm font-bold text-white">
              Switch
            </button>
            <button type="button" onClick={() => setPendingType(null)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink-900">
              Cancel
            </button>
          </div>
        </div>
      )}

      <textarea
        className="mt-4 w-full resize-none rounded-2xl bg-surface-elevated px-4 py-3 text-lg font-semibold text-ink-900 ring-2 ring-edge focus:outline-none focus:ring-brand-mid"
        rows={3}
        placeholder={type === "tf" ? "Type a statement (true or false)…" : "Type your question…"}
        maxLength={MAX_QUESTION_CHARS}
        value={q.question}
        onChange={(e) => onChange({ question: e.target.value })}
      />
      <p className="mt-1 text-right text-xs text-muted">{q.question.length} / {MAX_QUESTION_CHARS}</p>

      <ImagePicker image={q.image} onChange={(image) => onChange({ image })} />

      {type === "tf" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["True", "False"].map((label, ai) => {
            const s = tfStyle(ai);
            const isCorrect = q.correct === ai;
            return (
              <button
                key={ai}
                type="button"
                onClick={() => onChange({ correct: ai })}
                className={`flex min-h-touch items-center justify-center gap-2 rounded-2xl py-5 text-2xl font-bold text-white transition ${
                  isCorrect ? "ring-4 ring-edge scale-[1.02]" : "opacity-80 hover:opacity-100"
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
      )}

      {type === "mc" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {q.answers.map((a, ai) => {
            const isCorrect = q.correct === ai;
            return (
              <div key={ai} className="flex flex-col gap-2">
                <AnswerTile
                  index={ai}
                  type="mc"
                  text={a.trim() || `Answer ${ai + 1}`}
                  selected={isCorrect}
                  onClick={() => onChange({ correct: ai })}
                  kahoot
                  compact
                />
                <input
                  className="w-full rounded-xl bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-edge placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-mid"
                  placeholder={`Answer ${ai + 1}`}
                  maxLength={MAX_ANSWER_CHARS}
                  value={a}
                  onChange={(e) => onAnswer(ai, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      )}

      {type === "ms" && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted">Tick every correct option (players must pick the exact set).</p>
          {answers.map((a, ai) => {
            const isCorrect = correctArr.includes(ai);
            return (
              <div key={ai} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMsCorrect(ai)}
                  aria-label={isCorrect ? "Marked correct" : "Mark correct"}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg font-bold ring-1 transition ${
                    isCorrect ? "bg-tile-square/20 text-tile-square ring-tile-square" : "bg-surface-muted text-muted ring-edge"
                  }`}
                >
                  {isCorrect ? "☑" : "☐"}
                </button>
                <input
                  className="w-full rounded-xl bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-edge placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-mid"
                  placeholder={`Option ${ai + 1}`}
                  maxLength={MAX_ANSWER_CHARS}
                  value={a}
                  onChange={(e) => onAnswer(ai, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeOption(ai)}
                  disabled={answers.length <= 2}
                  className="min-h-touch shrink-0 rounded-lg px-2 text-muted hover:text-tile-triangle disabled:opacity-30"
                  aria-label="Remove option"
                >
                  ✕
                </button>
              </div>
            );
          })}
          {answers.length < 6 && (
            <button type="button" onClick={addOption} className="self-start rounded-lg px-3 py-2 text-sm font-bold text-brand-end hover:bg-brand-mid/10">
              + Add option
            </button>
          )}
        </div>
      )}

      {type === "type" && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted">Players type their answer. List every spelling you'll accept (case/spacing-insensitive).</p>
          {accept.map((a, ai) => (
            <div key={ai} className="flex items-center gap-2">
              <input
                className="w-full rounded-xl bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-edge placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-mid"
                placeholder={ai === 0 ? "Correct answer" : "Also accept…"}
                maxLength={MAX_ANSWER_CHARS}
                value={a}
                onChange={(e) => updateAccept(ai, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeAccept(ai)}
                disabled={accept.length <= 1}
                className="min-h-touch shrink-0 rounded-lg px-2 text-muted hover:text-tile-triangle disabled:opacity-30"
                aria-label="Remove accepted answer"
              >
                ✕
              </button>
            </div>
          ))}
          {accept.length < 8 && (
            <button type="button" onClick={addAccept} className="self-start rounded-lg px-3 py-2 text-sm font-bold text-brand-end hover:bg-brand-mid/10">
              + Add accepted spelling
            </button>
          )}
        </div>
      )}

      {type === "puzzle" && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted">List items in the correct order — players sort a shuffled copy.</p>
          {answers.map((a, ai) => (
            <div key={ai} className="flex items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-mid/15 text-sm font-extrabold text-brand-mid">{ai + 1}</span>
              <input
                className="w-full rounded-xl bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-edge placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-mid"
                placeholder={`Item ${ai + 1}`}
                maxLength={MAX_ANSWER_CHARS}
                value={a}
                onChange={(e) => onAnswer(ai, e.target.value)}
              />
              <button type="button" onClick={() => moveOption(ai, -1)} disabled={ai === 0} className="min-h-touch shrink-0 rounded-lg px-2 text-muted hover:text-ink-900 disabled:opacity-30" aria-label="Move up">↑</button>
              <button type="button" onClick={() => moveOption(ai, 1)} disabled={ai === answers.length - 1} className="min-h-touch shrink-0 rounded-lg px-2 text-muted hover:text-ink-900 disabled:opacity-30" aria-label="Move down">↓</button>
              <button type="button" onClick={() => removeOption(ai)} disabled={answers.length <= 2} className="min-h-touch shrink-0 rounded-lg px-2 text-muted hover:text-tile-triangle disabled:opacity-30" aria-label="Remove item">✕</button>
            </div>
          ))}
          {answers.length < 6 && (
            <button type="button" onClick={addOption} className="self-start rounded-lg px-3 py-2 text-sm font-bold text-brand-end hover:bg-brand-mid/10">
              + Add item
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-surface-muted p-1 ring-1 ring-edge">
          {[
            { id: "standard", label: "1×", title: "Standard points" },
            { id: "double", label: "2×", title: "Double points" },
            { id: "none", label: "0×", title: "No points — just for fun" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              title={opt.title}
              onClick={() => onChange({ points: opt.id, doublePoints: opt.id === "double" })}
              className={`min-h-touch rounded-lg px-3 py-2 text-sm font-bold transition ${
                points === opt.id ? "bg-brand-mid text-white" : "text-muted hover:text-ink-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="text-sm font-semibold text-muted">Time</label>
        <select
          className="rounded-xl bg-surface-elevated px-3 py-2 font-semibold text-ink-900 ring-1 ring-edge focus:outline-none focus:ring-brand-mid"
          value={q.timeLimit}
          onChange={(e) => onChange({ timeLimit: Number(e.target.value) })}
        >
          {[10, 15, 20, 30, 45, 60].map((t) => (
            <option key={t} value={t}>{t}s</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted">
          Correct:{" "}
          <b className="text-ink-900">
            {type === "tf"
              ? tfStyle(q.correct).label
              : type === "mc"
              ? answerStyle(q.correct).glyph
              : type === "ms"
              ? `${correctArr.length} option${correctArr.length === 1 ? "" : "s"}`
              : type === "type"
              ? "typed"
              : "in order"}
          </b>
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted">🔍 Closer Look hint <span className="font-normal">(optional — halves points if used)</span></span>
          <input
            className="w-full rounded-xl bg-surface-elevated px-3 py-2 text-sm font-medium text-ink-900 ring-1 ring-edge placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-mid"
            placeholder="A nudge that doesn't give it away…"
            maxLength={200}
            value={q.hint ?? ""}
            onChange={(e) => onChange({ hint: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted">🎨 Media prompt <span className="font-normal">(optional — for cover art)</span></span>
          <input
            className="w-full rounded-xl bg-surface-elevated px-3 py-2 text-sm font-medium text-ink-900 ring-1 ring-edge placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-mid"
            placeholder="Describe an image for this question…"
            maxLength={400}
            value={q.mediaPrompt ?? ""}
            onChange={(e) => onChange({ mediaPrompt: e.target.value })}
          />
        </label>
      </div>
      {bankError && (
        <p className="mt-3 rounded-xl bg-tile-triangle/20 px-3 py-2 text-sm font-semibold text-tile-triangle">
          {bankError}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI question generation panel
// ---------------------------------------------------------------------------
const AI_COUNTS = [3, 5, 8, 10];
const AI_AUDIENCES = [
  { id: "family", label: "👨‍👩‍👧 Family" },
  { id: "kids", label: "🧸 Kids" },
  { id: "general", label: "🎯 Adults" },
  { id: "hard", label: "🔥 Hard" },
];
// null = let the model match the topic's language.
const AI_LANGUAGES = [
  { id: null, label: "🌐 Auto" },
  { id: "English", label: "English" },
  { id: "Arabic", label: "العربية" },
];

function AiGeneratePanel({ onGenerated, onClose }) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [audience, setAudience] = useState("family");
  const [language, setLanguage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const generate = async () => {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${SERVER_URL}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), count, audience, language }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(body?.error || "Generation failed — try again in a moment.");
        return;
      }
      onGenerated(body);
    } catch {
      setErr("Couldn't reach the server — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={busy ? undefined : onClose}
        className="absolute inset-0 bg-edge-scrim backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="relative z-10 w-full max-w-lg rounded-t-3xl bg-surface-elevated p-6 shadow-2xl ring-1 ring-edge sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">✨ Generate with AI</h2>
          <button type="button" onClick={onClose} disabled={busy} className="alkheelank-touch-target text-muted hover:text-ink-900">✕</button>
        </div>

        <input
          className="alkheelank-input mt-4 !text-left !text-lg"
          placeholder="Topic — e.g. 90s music, dinosaurs, world capitals…"
          maxLength={200}
          value={topic}
          autoFocus
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          disabled={busy}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted">Questions:</span>
          {AI_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              disabled={busy}
              onClick={() => setCount(n)}
              className={`min-h-touch rounded-xl px-4 py-2 text-sm font-bold transition ${
                count === n ? "bg-brand-mid text-white" : "bg-surface-muted text-muted hover:text-ink-900"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted">Crowd:</span>
          {AI_AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={busy}
              onClick={() => setAudience(a.id)}
              className={`min-h-touch rounded-xl px-3 py-2 text-sm font-bold transition ${
                audience === a.id ? "bg-brand-mid text-white" : "bg-surface-muted text-muted hover:text-ink-900"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted">Language:</span>
          {AI_LANGUAGES.map((l) => (
            <button
              key={l.label}
              type="button"
              disabled={busy}
              onClick={() => setLanguage(l.id)}
              className={`min-h-touch rounded-xl px-3 py-2 text-sm font-bold transition ${
                language === l.id ? "bg-brand-mid text-white" : "bg-surface-muted text-muted hover:text-ink-900"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {err && <p className="mt-4 rounded-xl bg-tile-triangle/20 px-4 py-3 text-sm font-semibold text-tile-triangle">{err}</p>}

        <button
          onClick={generate}
          disabled={!topic.trim() || busy}
          className="alkheelank-btn-primary mt-5 w-full disabled:opacity-50"
        >
          {busy ? "Writing questions… ✍️" : `Generate ${count} questions`}
        </button>
        {busy && <p className="mt-2 text-center text-xs text-muted">This usually takes 10–20 seconds.</p>}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document ingestion panel — paste text or drop a PDF/TXT, extract → quiz
// ---------------------------------------------------------------------------
const INGEST_MAX_CHARS = 20000;

function IngestPanel({ onGenerated, onClose }) {
  const [text, setText] = useState("");
  const [count, setCount] = useState(8);
  const [audience, setAudience] = useState("family");
  const [language, setLanguage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [err, setErr] = useState(null);
  const [sourceName, setSourceName] = useState(null);
  const fileRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setReading(true);
    setSourceName(file.name);
    try {
      let extracted;
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        extracted = await extractPdfText(file);
      } else {
        extracted = await file.text();
      }
      if (!extracted?.trim()) {
        setErr("Couldn't read any text from that file — it may be a scanned image. Try pasting the text instead.");
      } else {
        setText(extracted.slice(0, INGEST_MAX_CHARS));
      }
    } catch {
      setErr("Couldn't read that file. Paste the text instead.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const build = async () => {
    if (text.trim().length < 40 || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${SERVER_URL}/ingest-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, INGEST_MAX_CHARS), count, audience, language }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(body?.error || "Import failed — try again in a moment.");
        return;
      }
      onGenerated(body);
    } catch {
      setErr("Couldn't reach the server — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={busy ? undefined : onClose}
        className="absolute inset-0 bg-edge-scrim backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="relative z-10 w-full max-w-lg rounded-t-3xl bg-surface-elevated p-6 shadow-2xl ring-1 ring-edge sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">📄 Import from document</h2>
          <button type="button" onClick={onClose} disabled={busy} className="alkheelank-touch-target text-muted hover:text-ink-900">✕</button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy || reading}
            className="alkheelank-btn-ghost !py-2 !text-sm disabled:opacity-50"
          >
            {reading ? "Reading…" : "⬆ Upload PDF / text"}
          </button>
          {sourceName && <span className="truncate text-xs text-muted">{sourceName}</span>}
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" onChange={onFile} className="hidden" />
        </div>

        <textarea
          className="mt-3 w-full resize-none rounded-2xl bg-surface-elevated px-4 py-3 text-sm font-medium text-ink-900 ring-2 ring-edge focus:outline-none focus:ring-brand-mid"
          rows={7}
          placeholder="…or paste your notes, an article, or a chapter here."
          maxLength={INGEST_MAX_CHARS}
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-muted">{text.length.toLocaleString()} / {INGEST_MAX_CHARS.toLocaleString()}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted">Questions:</span>
          {AI_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              disabled={busy}
              onClick={() => setCount(n)}
              className={`min-h-touch rounded-xl px-4 py-2 text-sm font-bold transition ${
                count === n ? "bg-brand-mid text-white" : "bg-surface-muted text-muted hover:text-ink-900"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted">Crowd:</span>
          {AI_AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={busy}
              onClick={() => setAudience(a.id)}
              className={`min-h-touch rounded-xl px-3 py-2 text-sm font-bold transition ${
                audience === a.id ? "bg-brand-mid text-white" : "bg-surface-muted text-muted hover:text-ink-900"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted">Language:</span>
          {AI_LANGUAGES.map((l) => (
            <button
              key={l.label}
              type="button"
              disabled={busy}
              onClick={() => setLanguage(l.id)}
              className={`min-h-touch rounded-xl px-3 py-2 text-sm font-bold transition ${
                language === l.id ? "bg-brand-mid text-white" : "bg-surface-muted text-muted hover:text-ink-900"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {err && <p className="mt-4 rounded-xl bg-tile-triangle/20 px-4 py-3 text-sm font-semibold text-tile-triangle">{err}</p>}

        <button
          onClick={build}
          disabled={text.trim().length < 40 || busy}
          className="alkheelank-btn-primary mt-5 w-full disabled:opacity-50"
        >
          {busy ? "Reading & writing… ✍️" : `Build ${count} questions`}
        </button>
        {busy && <p className="mt-2 text-center text-xs text-muted">Pulling out the key ideas — usually 10–25 seconds.</p>}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz preview — step through questions exactly as players will see them
// ---------------------------------------------------------------------------
function QuizPreview({ title, questions, onClose }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const q = questions[index];
  const type = q.type || "mc";
  const hasNext = index + 1 < questions.length;

  const goTo = (i) => {
    setIndex(i);
    setRevealed(false);
    setStartedAt(Date.now());
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex shrink-0 items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <span className="rounded-full bg-brand-mid/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-end">
          Preview · {title}
        </span>
        <button type="button" onClick={onClose} className="alkheelank-touch-target font-bold text-muted hover:text-ink-900">
          ✕ Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2">
        <QuestionScreen
          variant="player"
          questionType={type}
          header={
            <div className="question-screen__meta flex shrink-0 items-center justify-between text-sm font-semibold text-muted">
              <span>Q{index + 1} / {questions.length}</span>
              <span>{questionPoints(q) === "double" ? "⚡ 2× points" : questionPoints(q) === "none" ? "🎈 No points" : type === "tf" ? "True / False" : "Multiple choice"}</span>
            </div>
          }
          prompt={q.question}
          image={starterImageSrc(q.image)}
          animateImage
          timerStrip={
            <TimerStrip
              key={`${index}-${startedAt}`}
              timeLimit={q.timeLimit}
              startedAt={startedAt}
              paused={revealed}
            />
          }
          answers={
            type === "type" ? (
              <div className="flex w-full flex-col gap-2">
                <p className="text-sm font-semibold text-muted">⌨️ Players type the answer. Accepted:</p>
                {(q.accept || []).filter((a) => a.trim()).map((a, i) => (
                  <div key={i} className="rounded-xl bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-edge">
                    {i === 0 ? "✓ " : ""}{a}
                  </div>
                ))}
              </div>
            ) : type === "puzzle" ? (
              <div className="flex w-full flex-col gap-2">
                <p className="text-sm font-semibold text-muted">↕ Correct order (players sort a shuffle):</p>
                {q.answers.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-edge">
                    <span className="grid h-6 w-6 place-items-center rounded bg-brand-mid/15 text-xs font-extrabold text-brand-mid">{i + 1}</span>
                    {a}
                  </div>
                ))}
              </div>
            ) : (
              q.answers.map((a, i) => (
                <AnswerTile
                  key={i}
                  index={i}
                  type={type === "ms" ? "mc" : type}
                  text={a}
                  revealed={revealed}
                  correct={Array.isArray(q.correct) ? q.correct.includes(i) : i === q.correct}
                  onClick={() => setRevealed(true)}
                />
              ))
            )
          }
        />
      </div>

      <div className="alkheelank-safe-bottom flex shrink-0 items-center justify-center gap-3 border-t border-edge bg-surface-elevated/95 px-5 py-3">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="alkheelank-btn-ghost !py-2 disabled:opacity-40"
        >
          ← Back
        </button>
        {!revealed && (
          <button onClick={() => setRevealed(true)} className="alkheelank-btn-ghost !py-2">
            Show answer
          </button>
        )}
        {hasNext ? (
          <button onClick={() => goTo(index + 1)} className="alkheelank-btn-primary !py-2 px-8">
            Next →
          </button>
        ) : (
          <button onClick={onClose} className="alkheelank-btn-primary !py-2 px-8">
            Done ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bank picker drawer
// ---------------------------------------------------------------------------
function BankPicker({ userId, onAdd, onAddAll, onClose }) {
  const [questions, setQuestions] = useState(null); // null = loading
  const [filter, setFilter] = useState("");
  const [err, setErr] = useState(null);

  useEffect(() => {
    listBankQuestions(userId).then(({ data, error }) => {
      if (error) setErr(error.message);
      setQuestions(data || []);
    });
  }, [userId]);

  const handleDelete = async (id) => {
    const previous = questions;
    setQuestions((qs) => (qs || []).filter((q) => q.id !== id));
    const { error } = await deleteBankQuestion(userId, id);
    if (error) {
      setQuestions(previous);
      setErr(error.message || "Couldn't delete that question.");
    }
  };

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
        className="absolute inset-0 bg-edge-scrim backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="relative z-10 flex w-full max-w-2xl flex-col rounded-t-3xl bg-surface-elevated shadow-2xl ring-1 ring-edge"
        style={{ maxHeight: "80dvh" }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="font-display text-xl font-bold">Your Question Bank</h2>
          <button type="button" onClick={onClose} className="alkheelank-touch-target text-muted hover:text-ink-900">✕</button>
        </div>

        <div className="px-6 pb-3">
          <div className="flex gap-2">
            <input
              className="alkheelank-input flex-1 !py-2.5 !text-base !text-left"
              placeholder="Search questions…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoFocus
            />
            {visible.length > 1 && (
              <button
                onClick={() => onAddAll(visible.map(bankRowToQuestion))}
                className="min-h-touch shrink-0 rounded-xl bg-brand-mid/20 px-4 text-sm font-bold text-brand-end hover:bg-brand-mid/40"
                title={filter ? "Add all matching questions" : "Add every question in your bank"}
              >
                + Add all ({visible.length})
              </button>
            )}
          </div>
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
                    className="flex items-start justify-between gap-4 rounded-2xl bg-surface-muted px-4 py-3 ring-1 ring-edge"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-mid/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-end">
                          {q.type === "tf" ? "T/F" : "MC"}
                        </span>
                        <span className="text-xs text-muted">{q.timeLimit}s</span>
                      </div>
                      <p className="mt-1 line-clamp-2 font-semibold text-ink-900">{q.question}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <button
                        onClick={() => onAdd(q)}
                        className="min-h-touch rounded-xl bg-brand-mid/20 px-4 py-2.5 text-sm font-bold text-brand-end hover:bg-brand-mid/40"
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-tile-triangle/10 hover:text-tile-triangle"
                        title="Delete from your bank"
                      >
                        Delete
                      </button>
                    </div>
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
  const displaySrc = starterImageSrc(image);
  // image search:
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = no search yet
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setErr(null);
  }, [image, displaySrc]);

  const search = async () => {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setErr(null);
    try {
      const res = await fetch(`${SERVER_URL}/image-search?q=${encodeURIComponent(q)}`);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(body?.error || "Search failed — try again.");
        setResults([]);
        return;
      }
      setResults(body || []);
    } catch {
      setErr("Couldn't reach the server for image search.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

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
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== "https:") {
        setErr("Image URLs must use https.");
        return;
      }
    } catch {
      setErr("Enter a valid https image URL, or upload a file.");
      return;
    }
    onChange(u);
    setUrl("");
    setOpen(false);
  };

  if (image) {
    return (
      <div className="mt-3 flex items-center gap-3">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Question"
            className="h-20 w-20 rounded-xl object-cover ring-1 ring-edge"
            onError={() => setErr("Image failed to load — check the URL.")}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface-muted text-xs font-semibold text-muted ring-1 ring-edge">
            Unavailable
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink-900">Image attached</span>
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
          className="rounded-xl bg-surface-muted px-3 py-2 text-sm font-semibold text-muted ring-1 ring-edge hover:text-ink-900"
        >
          🖼️ Add image
        </button>
      ) : (
        <div className="rounded-2xl bg-surface-muted p-3 ring-1 ring-edge">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-xl bg-surface-elevated px-3 py-2 font-medium text-ink-900 ring-1 ring-edge placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-mid"
              placeholder="Search free images… (e.g. mars planet)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <button onClick={search} disabled={searching || !query.trim()} className="alkheelank-btn-ghost !py-2 !text-sm disabled:opacity-50">
              {searching ? "Searching…" : "🔍 Search"}
            </button>
          </div>

          {results !== null && (
            <div className="mt-3">
              {results.length === 0 && !searching ? (
                <p className="text-sm text-muted">No images found — try different words.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      title={r.title}
                      onClick={() => { onChange(r.url); setOpen(false); }}
                      className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-edge transition hover:ring-2 hover:ring-brand-mid"
                    >
                      <img src={r.thumbnail} alt={r.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[10px] text-muted">Openly licensed images via Openverse.</p>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2 border-t border-edge pt-3 sm:flex-row">
            <input
              className="flex-1 rounded-xl bg-surface-elevated px-3 py-2 font-medium text-ink-900 ring-1 ring-edge placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-mid"
              placeholder="…or paste an image URL"
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
              className="text-sm text-muted hover:text-ink-900"
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
