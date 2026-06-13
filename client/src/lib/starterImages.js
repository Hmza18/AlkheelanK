/** Starter quiz photos — bundled via Vite (see starterImageAssets.js). */

import { bundledStarterImageUrl } from "../data/starterImageAssets.js";

const STARTER_RE = /\/starter-images\/(.+\.webp)$/i;

/** Extract `quiz-id/file.webp` from a starter image URL or path. */
export function starterImageRelPath(url) {
  if (!url) return null;
  const s = String(url).trim();
  const m = s.match(STARTER_RE);
  if (m) return m[1];
  // Already a bare relative key from the API, e.g. house-party/0.webp
  if (/^[\w-]+\/[\w-]+\.webp$/i.test(s)) return s;
  return null;
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

/** Rewrite question list image fields (API/DB may still have localhost URLs). */
export function normalizeStarterQuestions(questions) {
  if (!Array.isArray(questions)) return questions;
  return questions.map((q) => {
    if (!q?.image) return q;
    const src = starterImageSrc(q.image);
    return src === q.image ? q : { ...q, image: src };
  });
}
