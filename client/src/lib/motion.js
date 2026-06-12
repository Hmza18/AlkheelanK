// Shared motion choreography — one language for host + player flows.

export const duration = {
  instant: 0.12,
  fast: 0.22,
  normal: 0.35,
  slow: 0.55,
  reveal: 0.85,
};

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.45, 0, 0.55, 1],
  anticipate: [0.18, 0.89, 0.32, 1.28],
};

export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 28 },
  default: { type: "spring", stiffness: 320, damping: 26 },
  soft: { type: "spring", stiffness: 220, damping: 22 },
  bouncy: { type: "spring", stiffness: 420, damping: 18 },
  gentle: { type: "spring", stiffness: 90, damping: 18 },
};

export const stagger = {
  tight: 0.05,
  normal: 0.09,
  relaxed: 0.14,
  list: 0.11,
};

/** Respect prefers-reduced-motion — use for Framer transition overrides. */
export function useReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionSafe(transition, reduced) {
  if (!reduced) return transition;
  if (Array.isArray(transition)) return { duration: duration.fast };
  if (transition?.type === "spring") return { duration: duration.fast };
  return { ...transition, duration: Math.min(transition.duration ?? duration.normal, duration.fast) };
}

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeScale = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const phaseTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: spring.soft,
};

export function listStagger(index, base = stagger.normal, reduced = false) {
  return reduced ? 0 : index * base;
}

/**
 * Kahoot-style question entrance choreography (delays in seconds):
 * prompt → image → answer tiles → timer strip. The server holds the question
 * clock for QUESTION_INTRO_MS (server/src/index.js) so the timer never counts
 * down while screens are still animating in — keep the two in sync.
 */
export const questionIntro = {
  prompt: 0,
  image: 0.08,
  tiles: 0.28,
  tileStagger: 0.07,
  timer: 0.62,
};
