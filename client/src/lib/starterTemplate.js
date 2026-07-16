import { STARTER_SUMMARIES } from "../data/starterSummaries.js";
import { STARTER_COPY_DATA } from "../data/starterCopyData.js";
import { applyStarterTemplateImages, normalizeStarterQuestions } from "./starterImages.js";

const normalized = (value) => String(value ?? "").trim();

function answersMatch(left = [], right = []) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }
  return left.every((answer, index) => normalized(answer) === normalized(right[index]));
}

function matchesStarterQuestions(starterId, questions) {
  const starterQuestions = STARTER_COPY_DATA[starterId]?.questions;
  if (!Array.isArray(starterQuestions) || starterQuestions.length !== questions.length) {
    return false;
  }
  return questions.every((question, index) => {
    const starterQuestion = starterQuestions[index];
    return (
      normalized(question.type || "mc") === normalized(starterQuestion.type || "mc") &&
      normalized(question.question) === normalized(starterQuestion.question) &&
      answersMatch(question.answers, starterQuestion.answers)
    );
  });
}

/** Editor load: hydrate missing starter photos only when content matches a built-in template. */
export function prepareStarterQuestionsForEditor(title, questions) {
  if (!Array.isArray(questions) || !questions.length) return questions;
  const raw = questions.map((q) => ({ ...q }));
  const starter = STARTER_SUMMARIES.find((s) => s.title === title);
  if (starter && raw.length === starter.questionCount && matchesStarterQuestions(starter.id, raw)) {
    return applyStarterTemplateImages(starter.id, raw);
  }
  return normalizeStarterQuestions(raw);
}
