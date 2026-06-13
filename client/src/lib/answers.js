// Positional answer identity: each of the four slots has a fixed shape + color,
// exactly mirroring the familiar quiz-game muscle memory (▲ ◆ ● ■). The server
// only ever sends answer TEXT by index — shape/color are assigned client-side.

export const ANSWERS = [
  {
    key: "triangle",
    shape: "triangle",
    glyph: "▲",
    label: "Triangle",
    color: "#f43f5e", // rose
    color600: "#e11d48",
  },
  {
    key: "diamond",
    shape: "diamond",
    glyph: "◆",
    label: "Diamond",
    color: "#3b82f6", // blue
    color600: "#2563eb",
  },
  {
    key: "circle",
    shape: "circle",
    glyph: "●",
    label: "Circle",
    color: "#f59e0b", // amber
    color600: "#d97706",
  },
  {
    key: "square",
    shape: "square",
    glyph: "■",
    label: "Square",
    color: "#10b981", // emerald
    color600: "#059669",
  },
];

export function answerStyle(index) {
  return ANSWERS[index % ANSWERS.length];
}

// True/False tiles. Two big, unmistakable choices with their own identity so
// they don't read like "the first two multiple-choice options."
export const TF_ANSWERS = [
  {
    key: "true",
    shape: "check",
    glyph: "✓",
    label: "True",
    color: "#10b981", // emerald
    color600: "#059669",
  },
  {
    key: "false",
    shape: "cross",
    glyph: "✕",
    label: "False",
    color: "#f43f5e", // rose
    color600: "#e11d48",
  },
];

export function tfStyle(index) {
  return TF_ANSWERS[index % TF_ANSWERS.length];
}

// One accessor the views can use regardless of question type.
export function tileStyle(type, index) {
  return type === "tf" ? tfStyle(index) : answerStyle(index);
}
