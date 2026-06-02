/** Topic emoji + label per question — rendered as inline SVG data URIs at runtime. */

function svgDataUri(emoji, accent, label) {
  const safe = String(label || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img">
  <defs>
    <linearGradient id="qbg" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#15163d"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" rx="24" fill="url(#qbg)"/>
  <text x="320" y="148" font-size="96" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="320" y="248" font-family="system-ui,sans-serif" font-size="24" font-weight="600" fill="#f5f6ff" fill-opacity="0.9" text-anchor="middle">${safe}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

const ACCENTS = {
  Mixed: "#a855f7",
  Movies: "#f43f5e",
  General: "#0ea5e9",
  Kids: "#f59e0b",
  Geography: "#10b981",
  Family: "#c026d3",
};

/** @type {Record<string, { emoji: string, label: string }[]>} */
export const QUESTION_ART = {
  "house-party": [
    { emoji: "🔴", label: "Red Planet" },
    { emoji: "⬡", label: "Hexagon" },
    { emoji: "🧱", label: "Great Wall" },
    { emoji: "🌊", label: "Pacific Ocean" },
    { emoji: "🖼️", label: "Mona Lisa" },
    { emoji: "🍯", label: "Honey" },
    { emoji: "🗣️", label: "Languages" },
    { emoji: "🌙", label: "Moon landing" },
    { emoji: "🥇", label: "Gold" },
  ],
  "movie-night": [
    { emoji: "🎬", label: "Forrest Gump" },
    { emoji: "💍", label: "The One Ring" },
    { emoji: "🤠", label: "Toy Story" },
    { emoji: "🦖", label: "Jurassic Park" },
    { emoji: "💊", label: "The Matrix" },
  ],
  "general-knowledge": [
    { emoji: "⏰", label: "Minutes in a day" },
    { emoji: "🌈", label: "Primary colours" },
    { emoji: "📅", label: "Leap year" },
    { emoji: "💎", label: "Diamond" },
    { emoji: "🗺️", label: "Continents" },
    { emoji: "🌿", label: "Plants & air" },
    { emoji: "🔊", label: "Sound vs light" },
    { emoji: "🛑", label: "Octagon" },
  ],
  "kids-corner": [
    { emoji: "🎨", label: "Mixing colours" },
    { emoji: "🐄", label: "Farm animals" },
    { emoji: "🕷️", label: "Spider legs" },
    { emoji: "🐶", label: "Puppy" },
    { emoji: "🦅", label: "Flying birds" },
    { emoji: "⚽", label: "Round shapes" },
    { emoji: "☀️", label: "Day & night" },
    { emoji: "📆", label: "Days in a week" },
  ],
  "around-the-world": [
    { emoji: "🇷🇺", label: "Largest country" },
    { emoji: "🇦🇺", label: "Canberra" },
    { emoji: "🏞️", label: "Nile River" },
    { emoji: "🏔️", label: "Mount Everest" },
    { emoji: "🧊", label: "Arctic Ocean" },
    { emoji: "🇮🇹", label: "Boot-shaped" },
    { emoji: "🐧", label: "Antarctica" },
    { emoji: "🌳", label: "Amazon" },
  ],
  "family-faceoff": [
    { emoji: "🥞", label: "Breakfast" },
    { emoji: "🎂", label: "Birthday cake" },
    { emoji: "🥚", label: "A dozen" },
    { emoji: "👨‍👩‍👧", label: "Uncle" },
    { emoji: "🎲", label: "Board games" },
    { emoji: "📅", label: "Weekend" },
    { emoji: "🥄", label: "Soup spoon" },
    { emoji: "🐠", label: "Family pet" },
  ],
};

export function questionImageFor(quizId, index, category) {
  const art = QUESTION_ART[quizId]?.[index];
  if (!art) return null;
  return svgDataUri(art.emoji, ACCENTS[category] || "#a855f7", art.label);
}
