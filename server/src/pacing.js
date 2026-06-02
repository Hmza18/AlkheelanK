// Reveal timing presets — host "show pace" syncs via settings + reveal payload.

export const PACING_MODES = ["quick", "normal", "cinematic"];

export const REVEAL_TIMING = {
  quick: { barMs: 520, highlightMs: 180, barStagger: 0.05, avatarDelay: 0.08 },
  normal: { barMs: 1050, highlightMs: 450, barStagger: 0.09, avatarDelay: 0.11 },
  cinematic: { barMs: 1650, highlightMs: 720, barStagger: 0.14, avatarDelay: 0.14 },
};

export function sanitizePacing(raw) {
  const p = String(raw || "normal").toLowerCase();
  return PACING_MODES.includes(p) ? p : "normal";
}

export function getRevealTiming(pacing) {
  return REVEAL_TIMING[sanitizePacing(pacing)] || REVEAL_TIMING.normal;
}
