/** Starter quiz photos — embedded in the JS bundle (see starterImageAssets.js). */

import { bundledStarterImageUrl } from "../data/starterImageAssets.js";

/** Match /starter-images/quiz/file.webp anywhere in a URL string. */
const STARTER_PATH_RE = /\/starter-images\/([^\s?#]+\.webp)/i;

/** Extract `quiz-id/file.webp` from any starter image reference. */
export function starterImageRelPath(url) {
  if (!url) return null;
  const s = String(url).trim();
  const m = s.match(STARTER_PATH_RE);
  if (m) return m[1];
  if (/^[\w-]+\/[\w.-]+\.webp$/i.test(s)) return s;
  return null;
}

/** Stable token stored in the DB / sent to the game server. */
export function starterImageStoragePath(url) {
  if (!url) return null;
  const rel = starterImageRelPath(url);
  if (rel) return `/starter-images/${rel}`;
  return url;
}

/** Resolved src for <img> — bundled /assets/ URL when available. */
export function starterImageSrc(url) {
  if (!url) return null;
  const cleaned = String(url).split("?")[0];
  const rel = starterImageRelPath(cleaned);
  if (rel) return bundledStarterImageUrl(rel) ?? `/starter-images/${rel}`;
  if (/^\/assets\//i.test(cleaned)) return cleaned;
  return cleaned;
}

export function starterCoverSrc(quizId) {
  const rel = `${quizId}/cover.webp`;
  return bundledStarterImageUrl(rel) ?? `/starter-images/${rel}`;
}

/** Attach every starter question photo by template id + index. */
export function applyStarterTemplateImages(starterId, questions, { preserveExistingImages = false } = {}) {
  if (!Array.isArray(questions)) return questions;
  return questions.map((q, i) => ({
    ...q,
    image:
      preserveExistingImages && Object.prototype.hasOwnProperty.call(q, "image")
        ? q.image
        : `/starter-images/${starterId}/${i}.webp`,
  }));
}

/** Normalize stored paths (never save inline or /assets/ hashes). */
export function normalizeStarterQuestions(questions) {
  if (!Array.isArray(questions)) return questions;
  return questions.map((q) => {
    if (!q?.image) return q;
    const stored = starterImageStoragePath(q.image);
    return stored === q.image ? q : { ...q, image: stored };
  });
}
