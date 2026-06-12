import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "../assets/starter-images");
const MANIFEST_PATH = path.join(ASSETS_DIR, "manifest.json");

function svgDataUri(emoji, accent, label) {
  const safe = String(label || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img">
  <defs>
    <linearGradient id="qbg" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#242019"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" rx="24" fill="url(#qbg)"/>
  <text x="320" y="148" font-size="96" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="320" y="248" font-family="system-ui,sans-serif" font-size="24" font-weight="600" fill="#faf6f0" fill-opacity="0.92" text-anchor="middle">${safe}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

const ACCENTS = {
  Mixed: "#d97706",
  Movies: "#f43f5e",
  General: "#0ea5e9",
  Kids: "#f59e0b",
  Geography: "#10b981",
  Family: "#ea580c",
};

/** @type {Record<string, { query: string, emoji: string, label: string }[]>} */
export const QUESTION_ART = {
  "house-party": [
    { query: "mars planet red space", emoji: "🔴", label: "Red Planet" },
    { query: "hexagon shape geometry", emoji: "⬡", label: "Hexagon" },
    { query: "great wall china landscape", emoji: "🧱", label: "Great Wall" },
    { query: "pacific ocean waves", emoji: "🌊", label: "Pacific Ocean" },
    { query: "mona lisa painting art", emoji: "🖼️", label: "Mona Lisa" },
    { query: "honey jar golden", emoji: "🍯", label: "Honey" },
    { query: "world globe international flags", emoji: "🗣️", label: "Languages" },
    { query: "moon landing astronaut apollo", emoji: "🌙", label: "Moon landing" },
    { query: "gold ingot bullion bars", emoji: "🥇", label: "Gold" },
  ],
  "movie-night": [
    { query: "running shoes park bench", emoji: "🎬", label: "Forrest Gump" },
    { query: "golden ring jewelry", emoji: "💍", label: "The One Ring" },
    { query: "wooden toy blocks children play", emoji: "🤠", label: "Toy Story" },
    { query: "dinosaur skeleton museum", emoji: "🦖", label: "Jurassic Park" },
    { query: "red pill blue pill capsules", emoji: "💊", label: "The Matrix" },
  ],
  "general-knowledge": [
    { query: "clock time 24 hours", emoji: "⏰", label: "Minutes in a day" },
    { query: "rainbow primary colors light", emoji: "🌈", label: "Primary colours" },
    { query: "calendar leap year february", emoji: "📅", label: "Leap year" },
    { query: "diamond gemstone sparkle", emoji: "💎", label: "Diamond" },
    { query: "world map continents", emoji: "🗺️", label: "Continents" },
    { query: "green plant leaves nature", emoji: "🌿", label: "Plants & air" },
    { query: "sound waves audio waveform", emoji: "🔊", label: "Sound vs light" },
    { query: "stop sign octagon road", emoji: "🛑", label: "Octagon" },
  ],
  "kids-corner": [
    { query: "mixing paint blue yellow green", emoji: "🎨", label: "Mixing colours" },
    { query: "cow farm animal pasture", emoji: "🐄", label: "Farm animals" },
    { query: "spider insect web", emoji: "🕷️", label: "Spider legs" },
    { query: "puppy dog cute", emoji: "🐶", label: "Puppy" },
    { query: "eagle bird flying sky", emoji: "🦅", label: "Flying birds" },
    { query: "soccer ball round sports", emoji: "⚽", label: "Round shapes" },
    { query: "sun sunshine sky daytime", emoji: "☀️", label: "Day & night" },
    { query: "calendar week days", emoji: "📆", label: "Days in a week" },
  ],
  "around-the-world": [
    { query: "russia landscape snow taiga", emoji: "🇷🇺", label: "Largest country" },
    { query: "canberra australia city", emoji: "🇦🇺", label: "Canberra" },
    { query: "nile river africa", emoji: "🏞️", label: "Nile River" },
    { query: "mount everest mountain snow", emoji: "🏔️", label: "Mount Everest" },
    { query: "arctic ocean ice floe", emoji: "🧊", label: "Arctic Ocean" },
    { query: "italy map boot shape", emoji: "🇮🇹", label: "Boot-shaped" },
    { query: "antarctica penguin ice", emoji: "🐧", label: "Antarctica" },
    { query: "amazon rainforest jungle", emoji: "🌳", label: "Amazon" },
  ],
  "family-faceoff": [
    { query: "breakfast pancakes morning table", emoji: "🥞", label: "Breakfast" },
    { query: "birthday cake candles celebration", emoji: "🎂", label: "Birthday cake" },
    { query: "dozen eggs carton twelve", emoji: "🥚", label: "A dozen" },
    { query: "family gathering uncle relatives", emoji: "👨‍👩‍👧", label: "Uncle" },
    { query: "monopoly board game dice", emoji: "🎲", label: "Board games" },
    { query: "weekend relaxing family home", emoji: "📅", label: "Weekend" },
    { query: "chicken noodle soup bowl spoon", emoji: "🥄", label: "Soup spoon" },
    { query: "goldfish aquarium pet", emoji: "🐠", label: "Family pet" },
  ],
};

function loadPhotoManifest() {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
    const entries = JSON.parse(raw);
    const set = new Set();
    for (const e of entries) {
      if (e.quizId != null && e.index != null && e.file) {
        set.add(`${e.quizId}:${e.index}`);
      }
    }
    return set;
  } catch {
    return new Set();
  }
}

const PHOTO_MANIFEST = loadPhotoManifest();

export function starterImagesBaseUrl() {
  const base = process.env.STARTER_IMAGES_BASE_URL || "http://localhost:3001";
  return base.replace(/\/$/, "");
}

export function starterPhotoUrl(quizId, index) {
  return `${starterImagesBaseUrl()}/starter-images/${quizId}/${index}.webp`;
}

export function questionImageFor(quizId, index, category) {
  const art = QUESTION_ART[quizId]?.[index];
  if (!art) return null;

  const key = `${quizId}:${index}`;
  if (PHOTO_MANIFEST.has(key)) {
    return starterPhotoUrl(quizId, index);
  }

  return svgDataUri(art.emoji, ACCENTS[category] || "#d97706", art.label);
}
