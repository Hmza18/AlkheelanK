// Original post-answer filler lines — kid-friendly, Alkheeloot tone (not Kahoot copy).

const FAST = [
  "Whoa, lightning fingers! ⚡",
  "Speed demon alert! 🏎️",
  "Too fast? Nah — nailed it! 😎",
  "You blinked and tapped. Respect.",
  "Zoom zoom — nobody saw that coming!",
];

const LATE = [
  "Just in time! 🕐",
  "Cutting it close — drama! 😅",
  "The clock sweated. You didn't. Phew!",
  "Last-second hero energy!",
  "Snuck in under the buzzer!",
];

const GENERIC = [
  "Locked in! 🔒",
  "Nice pick… no peeking! 👀",
  "Let's see how that goes…",
  "Fingers crossed for you! 🤞",
  "Answer's in the vault!",
  "Holding our breath with you…",
  "Plot twist loading… 📦",
  "Brain cells: deployed. ☁️",
  "The suspense is snacking on us.",
  "Your pick is warming up on stage.",
  "Antenna up for the reveal! 📡",
  "Mystery mode: ON.",
];

function pick(pool, salt = 0) {
  const i = Math.abs(salt) % pool.length;
  return pool[i];
}

/** Stable-ish line per question + pace so it doesn't flicker on re-render. */
export function pickWaitingMessage(waitContext, questionIndex = 0) {
  const pace = waitContext?.pace || "normal";
  const salt =
    (questionIndex + 1) * 17 +
    (waitContext?.speedRank ?? 0) * 3 +
    (waitContext?.timeMs ?? 0) % 997;

  if (pace === "fast") return pick(FAST, salt);
  if (pace === "late") return pick(LATE, salt + 1);
  return pick(GENERIC, salt + 2);
}

export const WAITING_POOL_SIZE = FAST.length + LATE.length + GENERIC.length;
