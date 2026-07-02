import { STARTER_SUMMARIES } from "../data/starterSummaries.js";
import { applyStarterTemplateImages, normalizeStarterQuestions } from "./starterImages.js";

/** Editor load: attach every starter photo when this quiz matches a built-in template. */
export function prepareStarterQuestionsForEditor(title, questions) {
  if (!Array.isArray(questions) || !questions.length) return questions;
  const raw = questions.map((q) => ({ ...q }));
  const starter = STARTER_SUMMARIES.find((s) => s.title === title);
  if (starter && raw.length === starter.questionCount) {
    return applyStarterTemplateImages(starter.id, raw);
  }
  return normalizeStarterQuestions(raw);
}
