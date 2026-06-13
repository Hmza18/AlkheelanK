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

/** Public origin for starter photo URLs (must be https in production). */
export function starterImagesBaseUrl() {
  const explicit = process.env.STARTER_IMAGES_BASE_URL?.trim();
  if (explicit) {
    const cleaned = explicit.replace(/\/$/, "");
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleaned);
    if (!(process.env.NODE_ENV === "production" && isLocalhost)) {
      return cleaned;
    }
  }

  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) return render.replace(/\/$/, "");

  const port = process.env.PORT || 3001;
  return `http://localhost:${port}`;
}

/** Relative path — preferred; client serves these from public/starter-images. */
export function starterPhotoPath(quizId, index) {
  return `/starter-images/${quizId}/${index}.webp`;
}

export function starterCoverPhotoPath(quizId) {
  const coverPath = path.join(ASSETS_DIR, quizId, "cover.webp");
  if (fs.existsSync(coverPath)) return `/starter-images/${quizId}/cover.webp`;
  const key = `${quizId}:0`;
  if (PHOTO_MANIFEST.has(key)) return starterPhotoPath(quizId, 0);
  return null;
}

export function starterPhotoUrl(quizId, index) {
  return `${starterImagesBaseUrl()}${starterPhotoPath(quizId, index)}`;
}

export function starterCoverPhotoUrl(quizId) {
  const rel = starterCoverPhotoPath(quizId);
  return rel ? `${starterImagesBaseUrl()}${rel}` : null;
}

/** Thematic Openverse queries for starter template cover cards. */
export const COVER_ART = {
  "house-party": { query: "house party friends celebrating", label: "House Party Mix" },
  "movie-night": { query: "movie theater cinema screen", label: "Movie Night" },
  "general-knowledge": { query: "library books reading study", label: "General Knowledge" },
  "kids-corner": { query: "children playing colorful toys", label: "Kids' Corner" },
  "around-the-world": { query: "world map travel globe", label: "Around the World" },
  "family-faceoff": { query: "family game night table", label: "Family Face-Off" },
};

export function questionImageFor(quizId, index, category) {
  const art = QUESTION_ART[quizId]?.[index];
  if (!art) return null;

  const key = `${quizId}:${index}`;
  if (PHOTO_MANIFEST.has(key)) {
    return starterPhotoPath(quizId, index);
  }

  return svgDataUri(art.emoji, ACCENTS[category] || "#d97706", art.label);
}
