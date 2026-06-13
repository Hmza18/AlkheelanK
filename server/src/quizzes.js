// Built-in quizzes. Each question has a `type`:
//   - "mc" (multiple choice): exactly 4 positional answers (0..3)
//   - "tf" (true/false):      exactly 2 answers ["True", "False"] (0..1)
// `correct` is the index of the right answer. The `correct` field NEVER leaves
// the server in a player-facing payload — it is stripped before broadcasting
// questions and only revealed after a question closes.

import { questionImageFor } from "./starterImages.js";

const TF = ["True", "False"];

// All starter content below is ORIGINAL — written for Alkheeloot, not lifted from any
// copyrighted quiz set or trivia book. Facts are general knowledge.

export const QUIZZES = [
  {
    id: "house-party",
    title: "House Party Mix",
    description: "A little bit of everything — perfect for a mixed crowd.",
    emoji: "🎉",
    category: "Mixed",
    questions: [
      {
        type: "mc",
        question: "Which planet is known as the Red Planet?",
        answers: ["Mars", "Venus", "Jupiter", "Mercury"],
        correct: 0,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "How many sides does a hexagon have?",
        answers: ["5", "6", "7", "8"],
        correct: 1,
        timeLimit: 15,
      },
      {
        type: "tf",
        question: "The Great Wall of China is visible from space with the naked eye.",
        answers: TF,
        correct: 1, // False
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "What is the largest ocean on Earth?",
        answers: ["Atlantic", "Indian", "Pacific", "Arctic"],
        correct: 2,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "Who painted the Mona Lisa?",
        answers: ["Van Gogh", "Picasso", "Dalí", "Da Vinci"],
        correct: 3,
        timeLimit: 20,
      },
      {
        type: "tf",
        question: "Honey never spoils if stored properly.",
        answers: TF,
        correct: 0, // True
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "Which language has the most native speakers worldwide?",
        answers: ["English", "Mandarin Chinese", "Spanish", "Hindi"],
        correct: 1,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "In what year did the first humans land on the Moon?",
        answers: ["1965", "1972", "1969", "1958"],
        correct: 2,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "What is the chemical symbol for gold?",
        answers: ["Gd", "Go", "Ag", "Au"],
        correct: 3,
        timeLimit: 15,
      },
    ],
  },
  {
    id: "movie-night",
    title: "Movie Night",
    description: "Lights, camera, trivia.",
    emoji: "🎬",
    category: "Movies",
    questions: [
      {
        type: "mc",
        question: "Which film features a character named Forrest Gump?",
        answers: ["Forrest Gump", "Cast Away", "Big", "Rain Man"],
        correct: 0,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "What is the name of the hobbit who carries the One Ring?",
        answers: ["Sam", "Frodo", "Bilbo", "Pippin"],
        correct: 1,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "Which studio created Toy Story?",
        answers: ["DreamWorks", "Disney only", "Pixar", "Illumination"],
        correct: 2,
        timeLimit: 15,
      },
      {
        type: "tf",
        question: "Jurassic Park (1993) was directed by Steven Spielberg.",
        answers: TF,
        correct: 0, // True
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "In The Matrix, which pill does Neo take?",
        answers: ["Red", "Blue", "Green", "Yellow"],
        correct: 0,
        timeLimit: 15,
      },
    ],
  },
  {
    id: "general-knowledge",
    title: "General Knowledge",
    description: "A solid all-rounder to warm everyone up.",
    emoji: "🧠",
    category: "General",
    questions: [
      {
        type: "mc",
        question: "How many minutes are there in a full day?",
        answers: ["1200", "1440", "1600", "2400"],
        correct: 1,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "Which of these is a primary colour of light?",
        answers: ["Green", "Orange", "Purple", "Brown"],
        correct: 0,
        timeLimit: 15,
      },
      {
        type: "tf",
        question: "A leap year happens every four years (with some exceptions).",
        answers: TF,
        correct: 0, // True
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "What is the hardest naturally occurring substance?",
        answers: ["Steel", "Quartz", "Diamond", "Titanium"],
        correct: 2,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "How many continents are there on Earth?",
        answers: ["5", "6", "7", "8"],
        correct: 2,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "Which gas do plants mainly absorb from the air?",
        answers: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
        correct: 2,
        timeLimit: 20,
      },
      {
        type: "tf",
        question: "Sound travels faster than light.",
        answers: TF,
        correct: 1, // False
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "What do you call a shape with eight sides?",
        answers: ["Hexagon", "Heptagon", "Octagon", "Nonagon"],
        correct: 2,
        timeLimit: 15,
      },
    ],
  },
  {
    id: "kids-corner",
    title: "Kids' Corner",
    description: "Friendly questions for younger players.",
    emoji: "🧸",
    category: "Kids",
    questions: [
      {
        type: "mc",
        question: "What colour do you get by mixing blue and yellow?",
        answers: ["Green", "Purple", "Orange", "Pink"],
        correct: 0,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "Which animal says 'moo'?",
        answers: ["Sheep", "Cow", "Duck", "Horse"],
        correct: 1,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "How many legs does a spider have?",
        answers: ["6", "8", "10", "4"],
        correct: 1,
        timeLimit: 15,
      },
      {
        type: "tf",
        question: "A baby dog is called a puppy.",
        answers: TF,
        correct: 0, // True
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "Which one of these can fly?",
        answers: ["Penguin", "Ostrich", "Eagle", "Chicken"],
        correct: 2,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "What shape is a ball?",
        answers: ["Square", "Triangle", "Round", "Flat"],
        correct: 2,
        timeLimit: 15,
      },
      {
        type: "tf",
        question: "The sun comes out at night.",
        answers: TF,
        correct: 1, // False
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "How many days are there in a week?",
        answers: ["5", "6", "7", "10"],
        correct: 2,
        timeLimit: 15,
      },
    ],
  },
  {
    id: "around-the-world",
    title: "Around the World",
    description: "Geography from every corner of the globe.",
    emoji: "🌍",
    category: "Geography",
    questions: [
      {
        type: "mc",
        question: "Which is the largest country by land area?",
        answers: ["Canada", "China", "Russia", "United States"],
        correct: 2,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "What is the capital city of Australia?",
        answers: ["Sydney", "Melbourne", "Canberra", "Perth"],
        correct: 2,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "The Nile river is found on which continent?",
        answers: ["Asia", "Africa", "South America", "Europe"],
        correct: 1,
        timeLimit: 15,
      },
      {
        type: "tf",
        question: "Mount Everest is the tallest mountain above sea level.",
        answers: TF,
        correct: 0, // True
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "Which ocean is the smallest?",
        answers: ["Arctic", "Indian", "Atlantic", "Pacific"],
        correct: 0,
        timeLimit: 20,
      },
      {
        type: "mc",
        question: "Which country is shaped like a boot?",
        answers: ["Spain", "Greece", "Italy", "Portugal"],
        correct: 2,
        timeLimit: 15,
      },
      {
        type: "tf",
        question: "Antarctica is the driest continent on Earth.",
        answers: TF,
        correct: 0, // True
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "On which continent would you find the Amazon rainforest?",
        answers: ["Africa", "Asia", "South America", "Australia"],
        correct: 2,
        timeLimit: 20,
      },
    ],
  },
  {
    id: "family-faceoff",
    title: "Family Face-Off",
    description: "Cosy crowd-pleasers for the whole table.",
    emoji: "🏠",
    category: "Family",
    questions: [
      {
        type: "mc",
        question: "Which meal is eaten first thing in the morning?",
        answers: ["Lunch", "Dinner", "Breakfast", "Supper"],
        correct: 2,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "How many candles would be on a cake for a 10th birthday?",
        answers: ["9", "10", "11", "12"],
        correct: 1,
        timeLimit: 15,
      },
      {
        type: "tf",
        question: "A dozen means twelve.",
        answers: TF,
        correct: 0, // True
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "What do you call your parent's brother?",
        answers: ["Cousin", "Uncle", "Nephew", "Grandpa"],
        correct: 1,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "Which board game uses the phrase 'Go to Jail'?",
        answers: ["Chess", "Checkers", "Monopoly-style property game", "Dominoes"],
        correct: 2,
        timeLimit: 20,
      },
      {
        type: "tf",
        question: "A week contains two weekend days.",
        answers: TF,
        correct: 0, // True
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "What utensil is best for eating soup?",
        answers: ["Fork", "Knife", "Spoon", "Chopsticks"],
        correct: 2,
        timeLimit: 15,
      },
      {
        type: "mc",
        question: "Which of these is a popular family pet?",
        answers: ["Tiger", "Goldfish", "Crocodile", "Wolf"],
        correct: 1,
        timeLimit: 15,
      },
    ],
  },
];

/** Clone a built-in quiz and resolve starter image URLs at call time (not module load). */
function hydrateQuizImages(quiz) {
  return {
    ...quiz,
    questions: quiz.questions.map((qq, i) => ({
      ...qq,
      image: questionImageFor(quiz.id, i, quiz.category),
    })),
  };
}

export function getQuiz(id) {
  const q = QUIZZES.find((x) => x.id === id);
  if (!q) return null;
  return hydrateQuizImages(q);
}

export function quizSummaries() {
  return QUIZZES.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    emoji: q.emoji || "🎯",
    category: q.category || "Mixed",
    questionCount: q.questions.length,
  }));
}

// Full starter quiz, shaped like an editor quiz so a host can duplicate it into
// their account and edit it. Starters are public templates, so returning the
// `correct` index here is intentional (this is NOT a live-game payload).
export function getStarterForCopy(id) {
  const q = QUIZZES.find((x) => x.id === id);
  if (!q) return null;
  return {
    title: q.title,
    questions: q.questions.map((qq, i) => ({
      type: qq.type || "mc",
      question: qq.question,
      answers: [...qq.answers],
      correct: qq.correct,
      timeLimit: qq.timeLimit,
      image: questionImageFor(q.id, i, q.category),
      points: normalizePoints(qq),
      hint: normalizeHint(qq.hint),
      mediaPrompt: normalizeMediaPrompt(qq.mediaPrompt),
    })),
  };
}

// --- Custom quiz validation ------------------------------------------------
// Host-built quizzes arrive over the socket. We sanitize + clamp everything so
// a malformed editor payload can never crash a game. The optional `image` is a
// string (a pasted URL or a base64 data URL) — stored inline with the question.

const MAX_QUESTIONS = 30;
const MAX_QUESTION_TEXT_LEN = 500;
const MAX_ANSWER_TEXT_LEN = 120;
// Question types:
//   mc     — 4 positional options, one correct (classic)
//   tf     — True/False
//   ms     — multi-select: 2-6 options, correct is an array of indices
//   type   — type-answer: free text matched against `accept` keyword variants
//   puzzle — ordering: 2-6 options stored in the CORRECT order, shuffled at play
const QUESTION_TYPES = ["mc", "tf", "ms", "type", "puzzle"];
const MIN_LIST_OPTIONS = 2; // ms / puzzle
const MAX_LIST_OPTIONS = 6; // ms / puzzle
const MAX_ACCEPT_VARIANTS = 8; // type-answer accepted spellings
const MAX_HINT_LEN = 200;
const MAX_MEDIA_PROMPT_LEN = 400;

// Points mode: "standard" (1×), "double" (2×) or "none" (0× — just for fun).
// Reads `q.points`; falls back to the legacy `q.doublePoints` boolean.
function normalizePoints(q) {
  const p = q?.points;
  if (p === "double" || p === "none" || p === "standard") return p;
  return q?.doublePoints ? "double" : "standard";
}

// A "Closer Look" hint is optional, shown to players who choose to reveal it
// (at a score penalty). Plain text only — never HTML.
function normalizeHint(raw) {
  const s = String(raw ?? "").trim().slice(0, MAX_HINT_LEN);
  return s || null;
}

// Editor/AI metadata: a descriptive prompt for generating cover art. Never sent
// to players; lives with the question so it survives a save/load round-trip.
function normalizeMediaPrompt(raw) {
  const s = String(raw ?? "").trim().slice(0, MAX_MEDIA_PROMPT_LEN);
  return s || null;
}
const MAX_IMAGE_LEN = 900_000; // per-question inline image cap (~900 KB base64)
// Total image bytes across the whole quiz. Must be comfortably below the
// Socket.io maxHttpBufferSize (configured to 4 MB in index.js) so the
// validation check fires with a clear message before the socket frame is
// silently dropped. Allow ~2 MB for images, leaving room for the rest of the
// JSON payload.
const MAX_QUIZ_IMAGE_BYTES = 2_000_000;

function sanitizeQuestionImage(image, questionIndex) {
  if (!image) return { image: null };
  const s = String(image).trim();
  if (!s) return { image: null };
  if (s.startsWith("data:image/")) {
    if (s.length > MAX_IMAGE_LEN) {
      return { error: `Question ${questionIndex + 1}'s image is too large — pick a smaller one.` };
    }
    return { image: s };
  }
  let url;
  try {
    url = new URL(s);
  } catch {
    return { error: `Question ${questionIndex + 1}: use an https image URL or upload a file.` };
  }
  if (url.protocol !== "https:") {
    return { error: `Question ${questionIndex + 1}: image URLs must use https.` };
  }
  if (s.length > 2048) {
    return { error: `Question ${questionIndex + 1}: image URL is too long.` };
  }
  return { image: s };
}

export function validateCustomQuiz(raw) {
  if (!raw || typeof raw !== "object") return { error: "Invalid quiz." };

  const title = String(raw.title || "").trim().slice(0, 80) || "Custom Quiz";

  if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
    return { error: "Add at least one question." };
  }
  if (raw.questions.length > MAX_QUESTIONS) {
    return { error: `Keep it to ${MAX_QUESTIONS} questions or fewer.` };
  }

  const questions = [];
  let totalImageBytes = 0;
  for (let i = 0; i < raw.questions.length; i++) {
    const q = raw.questions[i] || {};
    const text = String(q.question || "").trim();
    if (!text) return { error: `Question ${i + 1} needs some text.` };
    if (text.length > MAX_QUESTION_TEXT_LEN) {
      return { error: `Question ${i + 1} is too long (max ${MAX_QUESTION_TEXT_LEN} characters).` };
    }

    const type = QUESTION_TYPES.includes(q.type) ? q.type : "mc";
    const tooLong = (a) => a.length > MAX_ANSWER_TEXT_LEN;
    const lenErr = `Question ${i + 1} has an answer that is too long (max ${MAX_ANSWER_TEXT_LEN} characters).`;

    let answers = [];
    let correct = 0; // mc/tf: index · ms: sorted index array · type/puzzle: unused
    let accept = null; // type-answer: accepted text variants

    if (type === "tf") {
      answers = ["True", "False"]; // canonical, ignore whatever the editor sent
      correct = Number(q.correct);
      if (!Number.isInteger(correct) || correct < 0 || correct > 1) {
        return { error: `Mark the correct answer for question ${i + 1}.` };
      }
    } else if (type === "type") {
      const variants = (Array.isArray(q.accept) ? q.accept : [])
        .map((a) => String(a ?? "").trim())
        .filter(Boolean);
      if (variants.length === 0) {
        return { error: `Question ${i + 1} needs at least one accepted answer.` };
      }
      if (variants.some(tooLong)) return { error: lenErr };
      accept = variants.slice(0, MAX_ACCEPT_VARIANTS);
      answers = []; // no positional tiles
    } else if (type === "mc") {
      if (!Array.isArray(q.answers) || q.answers.length !== 4) {
        return { error: `Question ${i + 1} needs exactly 4 answers.` };
      }
      answers = q.answers.map((a) => String(a ?? "").trim());
      if (answers.some((a) => !a)) return { error: `Question ${i + 1} has an empty answer.` };
      if (answers.some(tooLong)) return { error: lenErr };
      correct = Number(q.correct);
      if (!Number.isInteger(correct) || correct < 0 || correct >= 4) {
        return { error: `Mark the correct answer for question ${i + 1}.` };
      }
    } else {
      // ms or puzzle — a 2-6 item list of non-empty options.
      answers = (Array.isArray(q.answers) ? q.answers : [])
        .map((a) => String(a ?? "").trim())
        .filter(Boolean)
        .slice(0, MAX_LIST_OPTIONS);
      if (answers.length < MIN_LIST_OPTIONS) {
        return { error: `Question ${i + 1} needs at least ${MIN_LIST_OPTIONS} options.` };
      }
      if (answers.some(tooLong)) return { error: lenErr };
      if (type === "ms") {
        const set = [
          ...new Set(
            (Array.isArray(q.correct) ? q.correct : [])
              .map(Number)
              .filter((n) => Number.isInteger(n) && n >= 0 && n < answers.length),
          ),
        ].sort((a, b) => a - b);
        if (set.length === 0) {
          return { error: `Mark at least one correct answer for question ${i + 1}.` };
        }
        correct = set; // array of indices
      }
      // puzzle: answers are stored in the correct order; `correct` stays 0/unused.
    }

    let timeLimit = Number(q.timeLimit);
    if (!Number.isFinite(timeLimit)) timeLimit = 20;
    timeLimit = Math.min(120, Math.max(5, Math.round(timeLimit)));

    const imgRes = sanitizeQuestionImage(q.image, i);
    if (imgRes.error) return { error: imgRes.error };
    const image = imgRes.image;
    if (image) {
      totalImageBytes += image.length;
      if (totalImageBytes > MAX_QUIZ_IMAGE_BYTES) {
        return { error: "Total image size across the quiz is too large." };
      }
    }

    const points = normalizePoints(q);
    questions.push({
      type,
      question: text,
      answers,
      correct,
      accept, // type-answer only; null otherwise
      timeLimit,
      image,
      points,
      doublePoints: points === "double", // back-compat: drives the 2× warning beat
      hint: normalizeHint(q.hint),
      mediaPrompt: normalizeMediaPrompt(q.mediaPrompt),
    });
  }

  return {
    quiz: { id: "custom", title, description: "Custom quiz", questions },
  };
}
