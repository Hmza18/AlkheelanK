/** Starter quiz photos — bundled via Vite (see starterImageAssets.js). */

import { bundledStarterImageUrl } from "../data/starterImageAssets.js";

/** Match /starter-images/quiz/file.webp anywhere in a URL string. */
const STARTER_PATH_RE = /\/starter-images\/([^\s?#]+\.webp)/i;

/** Extract `quiz-id/file.webp` from any starter image reference. */
export function starterImageRelPath(url) {
  if (!url) return null;
  const s = String(url).trim();
  const m = s.match(STARTER_PATH_RE);
  if (m) return m[1];
  // Bare key from the API, e.g. house-party/0.webp
  if (/^[\w-]+\/[\w.-]+\.webp$/i.test(s)) return s;
  return null;
}

/** Stable path stored in the DB / sent to the game server. */
export function starterImageStoragePath(url) {
  if (!url) return null;
  const rel = starterImageRelPath(url);
  if (rel) return `/starter-images/${rel}`;
  return url;
}

/** Resolved src for <img> — prefers Vite-bundled /assets/ URLs. */
export function starterImageSrc(url) {
  if (!url) return null;
  const rel = starterImageRelPath(url);
  if (rel) {
    const bundled = bundledStarterImageUrl(rel);
    if (bundled) return bundled;
    return `/starter-images/${rel}`;
  }
  return url;
}

/** Cover photo for a starter template card. */
export function starterCoverSrc(quizId) {
  return starterImageSrc(`${quizId}/cover.webp`);
}

/** Normalize question images to stable /starter-images/ paths (never hashed /assets/). */
export function normalizeStarterQuestions(questions) {
  if (!Array.isArray(questions)) return questions;
  return questions.map((q) => {
    if (!q?.image) return q;
    const stored = starterImageStoragePath(q.image);
    return stored === q.image ? q : { ...q, image: stored };
  });
}
