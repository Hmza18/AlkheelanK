// AI quiz generation via the Anthropic API. Optional feature — when
// ANTHROPIC_API_KEY isn't set, the endpoint reports itself as unavailable and
// the editor hides the button. Output is constrained with structured outputs
// (json_schema), then run through the same normalization rules as the editor
// so a generated quiz is always launchable as-is.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";
const MAX_COUNT = 15;

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

// Structured-outputs schema. Numeric/array bounds aren't supported by the API,
// so counts and ranges are enforced in normalizeQuestions() below.
const QUIZ_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short, fun quiz title (max 80 chars)" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["mc", "tf"] },
          question: { type: "string", description: "The question or statement, max 140 chars" },
          answers: {
            type: "array",
            items: { type: "string" },
            description: 'Exactly 4 options for "mc". For "tf" use exactly ["True","False"].',
          },
          correct: { type: "integer", description: "Index of the correct answer (0-based)" },
          timeLimit: { type: "integer", enum: [10, 15, 20, 30, 45, 60] },
        },
        required: ["type", "question", "answers", "correct", "timeLimit"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "questions"],
  additionalProperties: false,
};

function buildPrompt({ topic, count, audience, language }) {
  const audienceLine =
    audience === "kids"
      ? "The players are children — keep questions simple, friendly, and age-appropriate."
      : audience === "family"
        ? "The players are a mixed family crowd — keep everything family-friendly with a range of difficulty."
        : audience === "hard"
          ? "The players are trivia enthusiasts — make the questions genuinely challenging."
          : "The players are a general adult crowd — medium difficulty.";
  return [
    `Write ${count} quiz questions about: ${topic}`,
    audienceLine,
    language ? `Write all questions and answers in ${language}.` : "",
    "",
    "Rules:",
    '- Mostly multiple-choice ("mc", exactly 4 answers); sprinkle in a true/false ("tf") question or two if it fits.',
    "- Every question must have exactly one objectively correct answer; wrong answers must be plausible but clearly wrong.",
    "- Vary which index holds the correct answer.",
    "- Keep questions under 140 characters and answers under 60 characters.",
    "- Facts must be accurate and uncontroversial. No trick questions.",
    "- timeLimit: 15-20s for easy questions, 30s+ for ones that need reading or thought.",
  ]
    .filter(Boolean)
    .join("\n");
}

// Clamp/repair the model output into the exact shape the game validates.
function normalizeQuestions(raw, count) {
  const out = [];
  for (const q of raw || []) {
    if (out.length >= count) break;
    const type = q.type === "tf" ? "tf" : "mc";
    const text = String(q.question || "").trim().slice(0, 140);
    if (!text) continue;
    let answers;
    if (type === "tf") {
      answers = ["True", "False"];
    } else {
      answers = (Array.isArray(q.answers) ? q.answers : [])
        .map((a) => String(a ?? "").trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 4);
      if (answers.length !== 4) continue;
    }
    const max = type === "tf" ? 2 : 4;
    const correct = Number.isInteger(q.correct) && q.correct >= 0 && q.correct < max ? q.correct : 0;
    let timeLimit = Number(q.timeLimit);
    if (![10, 15, 20, 30, 45, 60].includes(timeLimit)) timeLimit = 20;
    out.push({ type, question: text, answers, correct, timeLimit, image: null });
  }
  return out;
}

export async function generateQuiz({ topic, count, audience, language }) {
  const cleanTopic = String(topic || "").trim().slice(0, 200);
  if (!cleanTopic) return { error: "Tell me a topic to write questions about." };
  const n = Math.min(MAX_COUNT, Math.max(1, Math.round(Number(count) || 5)));
  // Strip newlines and control characters to prevent prompt-injection through
  // the language field (it is user-supplied and interpolated into the prompt).
  const cleanLanguage =
    typeof language === "string"
      ? language.trim().slice(0, 60).replace(/[\r\n\t\u0000-\u001F\u007F]/g, " ").trim()
      : null;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { format: { type: "json_schema", schema: QUIZ_SCHEMA } },
    messages: [{ role: "user", content: buildPrompt({ topic: cleanTopic, count: n, audience, language: cleanLanguage }) }],
  });

  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) return { error: "The AI returned an empty response — try again." };

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "The AI response couldn't be read — try again." };
  }

  const questions = normalizeQuestions(parsed.questions, n);
  if (questions.length === 0) {
    return { error: "Couldn't generate usable questions for that topic — try rephrasing it." };
  }
  return {
    data: {
      title: String(parsed.title || cleanTopic).trim().slice(0, 80),
      questions,
    },
  };
}
