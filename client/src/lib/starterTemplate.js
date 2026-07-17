import { STARTER_COPY_DATA } from "../data/starterCopyData.js";
import { applyStarterTemplateImages, normalizeStarterQuestions } from "./starterImages.js";

function normalizeComparableQuestion(q) {
  return {
    type: q?.type || "mc",
    question: String(q?.question ?? ""),
    answers: Array.isArray(q?.answers) ? q.answers.map((answer) => String(answer ?? "")) : [],
    correct: Array.isArray(q?.correct) ? q.correct.map(Number) : q?.correct ?? 0,
    accept: Array.isArray(q?.accept) ? q.accept.map((answer) => String(answer ?? "")) : undefined,
    timeLimit: q?.timeLimit ?? 20,
    points: q?.points ?? "standard",
    hint: q?.hint ?? null,
    mediaPrompt: q?.mediaPrompt ?? null,
  };
}

function questionsMatchStarter(starter, questions) {
  if (!starter || !Array.isArray(starter.questions) || starter.questions.length !== questions.length) {
    return false;
  }
  return starter.questions.every(
    (starterQuestion, index) =>
      JSON.stringify(normalizeComparableQuestion(starterQuestion)) ===
      JSON.stringify(normalizeComparableQuestion(questions[index])),
  );
}

/** Editor load: attach every starter photo when this quiz matches a built-in template. */
export function prepareStarterQuestionsForEditor(title, questions) {
  if (!Array.isArray(questions) || !questions.length) return questions;
  const raw = questions.map((q) => ({ ...q }));
  const starterEntry = Object.entries(STARTER_COPY_DATA).find(([, starter]) => starter.title === title);
  if (starterEntry) {
    const [starterId, starter] = starterEntry;
    if (questionsMatchStarter(starter, raw)) {
      return applyStarterTemplateImages(starterId, raw, { preserveExistingImages: true });
    }
  }
  return normalizeStarterQuestions(raw);
}
