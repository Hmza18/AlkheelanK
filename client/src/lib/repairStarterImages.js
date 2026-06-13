import { STARTER_SUMMARIES } from "../data/starterSummaries.js";
import { bundledStarterImageUrl } from "../data/starterImageAssets.js";
import {
  normalizeStarterQuestions,
  starterImageRelPath,
} from "./starterImages.js";

/**
 * Fix question images broken by an earlier bug that saved hashed /assets/ URLs
 * or localhost paths. Only runs when the quiz still matches a starter template.
 */
export function repairStarterQuestionImages(title, questions) {
  const starter = STARTER_SUMMARIES.find((s) => s.title === title);
  if (!starter || !Array.isArray(questions) || questions.length !== starter.questionCount) {
    return questions;
  }

  return questions.map((q, i) => {
    const rel = `${starter.id}/${i}.webp`;
    if (!bundledStarterImageUrl(rel)) return q;

    const current = q.image ? String(q.image).trim() : "";
    if (!current) return q;
    if (starterImageRelPath(current)) return q;

    const broken =
      current.includes("localhost") ||
      /^\/assets\/[\w-]+\.webp$/i.test(current) ||
      current.startsWith("http://");

    if (!broken) return q;
    return { ...q, image: `/starter-images/${rel}` };
  });
}

export function prepareStarterQuestionsForEditor(title, questions) {
  const raw = questions.map((q) => ({ ...q }));
  return normalizeStarterQuestions(repairStarterQuestionImages(title, raw));
}
