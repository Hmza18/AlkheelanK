/** Starter quiz photos — bundled under /starter-images/ (client/public). */

const STARTER_RE = /\/starter-images\/(.+\.webp)$/i;

/** Extract `quiz-id/file.webp` from a starter image URL or path. */
export function starterImageRelPath(url) {
  if (!url) return null;
  const s = String(url).trim();
  const m = s.match(STARTER_RE);
  return m ? m[1] : null;
}

/** Same-origin path for display (Vite public/ or Vercel static). */
export function starterImageSrc(url) {
  const rel = starterImageRelPath(url);
  if (rel) return `/starter-images/${rel}`;
  return url || null;
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
