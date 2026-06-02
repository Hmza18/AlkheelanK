// Built-in quizzes. Each question has a `type`:
//   - "mc" (multiple choice): exactly 4 positional answers (0..3)
//   - "tf" (true/false):      exactly 2 answers ["True", "False"] (0..1)
// `correct` is the index of the right answer. The `correct` field NEVER leaves
// the server in a player-facing payload — it is stripped before broadcasting
// questions and only revealed after a question closes.

import { questionImageFor } from "./starterImages.js";

const TF = ["True", "False"];

// All starter content below is ORIGINAL — written for AlkheelanK, not lifted from any
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

for (const quiz of QUIZZES) {
  quiz.questions.forEach((q, i) => {
    q.image = questionImageFor(quiz.id, i, quiz.category);
  });
}

export function getQuiz(id) {
  return QUIZZES.find((q) => q.id === id) || QUIZZES[0];
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
    questions: q.questions.map((qq) => ({
      type: qq.type || "mc",
      question: qq.question,
      answers: [...qq.answers],
      correct: qq.correct,
      timeLimit: qq.timeLimit,
      image: qq.image || null,
    })),
  };
}

// --- Custom quiz validation ------------------------------------------------
// Host-built quizzes arrive over the socket. We sanitize + clamp everything so
// a malformed editor payload can never crash a game. The optional `image` is a
// string (a pasted URL or a base64 data URL) — stored inline with the question.

const MAX_QUESTIONS = 30;
const MAX_IMAGE_LEN = 4_000_000; // ~4MB of base64 — generous, downscaled client-side

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
  for (let i = 0; i < raw.questions.length; i++) {
    const q = raw.questions[i] || {};
    const text = String(q.question || "").trim();
    if (!text) return { error: `Question ${i + 1} needs some text.` };

    const type = q.type === "tf" ? "tf" : "mc";
    const expected = type === "tf" ? 2 : 4;

    let answers;
    if (type === "tf") {
      answers = ["True", "False"]; // canonical, ignore whatever the editor sent
    } else {
      if (!Array.isArray(q.answers) || q.answers.length !== 4) {
        return { error: `Question ${i + 1} needs exactly 4 answers.` };
      }
      answers = q.answers.map((a) => String(a ?? "").trim());
      if (answers.some((a) => !a)) {
        return { error: `Question ${i + 1} has an empty answer.` };
      }
    }

    const correct = Number(q.correct);
    if (!Number.isInteger(correct) || correct < 0 || correct >= expected) {
      return { error: `Mark the correct answer for question ${i + 1}.` };
    }

    let timeLimit = Number(q.timeLimit);
    if (!Number.isFinite(timeLimit)) timeLimit = 20;
    timeLimit = Math.min(120, Math.max(5, Math.round(timeLimit)));

    let image = q.image ? String(q.image) : null;
    if (image && image.length > MAX_IMAGE_LEN) {
      return { error: `Question ${i + 1}'s image is too large — pick a smaller one.` };
    }

    questions.push({
      type,
      question: text,
      answers,
      correct,
      timeLimit,
      image,
      doublePoints: !!q.doublePoints,
    });
  }

  return {
    quiz: { id: "custom", title, description: "Custom quiz", questions },
  };
}
