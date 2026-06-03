// AlkheelanK avatar stickers — picker faces + legacy config for older saves.

import { useId } from "react";
import {
  ACCESSORIES,
  CHARACTER_VIBES,
  ACCESSORY_VIBES,
  CompositeAvatar,
  MannequinWithAccessory,
  PICKER_BASES,
  resolveAccessory,
} from "./avatarArt.jsx";

export { PICKER_BASES, ACCESSORIES, CHARACTER_VIBES, ACCESSORY_VIBES };

const INK = "#1f2937";
const PAPER = "#f8fafc";
const LINE = "#334155";
const BLUSH = "#fb7185";
const GOLD = "#facc15";

export const BASES = [
  ...PICKER_BASES,
  "spark",
  "fox",
  "frog",
  "bunny",
  "robot",
  "lion",
  "owl",
  "seal",
  "dragon",
  "bee",
  "bear",
  "pup",
  "alien",
  "chick",
  "raccoon",
].filter((id, i, arr) => arr.indexOf(id) === i);

export const COLORS = [
  "#f43f5e",
  "#fb923c",
  "#facc15",
  "#22c55e",
  "#10b981",
  "#0ea5e9",
  "#6366f1",
  "#d97706",
];

export const HATS = ["none", "cap", "crown", "party"];
export const GLASSES = ["none", "round", "shades"];
export const MOUTHS = ["smile", "grin", "oh"];

export const DEFAULT_AVATAR = {
  base: "sun",
  accessory: "none",
  color: "#0ea5e9",
  hat: "none",
  glasses: "none",
  mouth: "smile",
};

export function sanitizeAvatar(cfg) {
  const c = cfg && typeof cfg === "object" ? cfg : {};
  let base = BASES.includes(c.base) ? c.base : DEFAULT_AVATAR.base;
  if (base === "mouse") base = "hamster";
  return {
    base,
    accessory: resolveAccessory(c.accessory),
    color: COLORS.includes(c.color) ? c.color : DEFAULT_AVATAR.color,
    hat: HATS.includes(c.hat) ? c.hat : "none",
    glasses: GLASSES.includes(c.glasses) ? c.glasses : "none",
    mouth: MOUTHS.includes(c.mouth) ? c.mouth : "smile",
  };
}

function mix(color, opacity = 0.22) {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}

function EyePair({ y = 32, happy = false }) {
  if (happy) {
    return (
      <g stroke={INK} strokeWidth="2.3" fill="none" strokeLinecap="round">
        <path d={`M21 ${y} q4 -4 8 0`} />
        <path d={`M35 ${y} q4 -4 8 0`} />
      </g>
    );
  }
  return (
    <g>
      <circle cx="25" cy={y} r="6" fill={PAPER} />
      <circle cx="39" cy={y} r="6" fill={PAPER} />
      <circle cx="26" cy={y + 1} r="2.8" fill={INK} />
      <circle cx="38" cy={y + 1} r="2.8" fill={INK} />
      <circle cx="27" cy={y - 0.7} r="1" fill={PAPER} />
      <circle cx="39" cy={y - 0.7} r="1" fill={PAPER} />
    </g>
  );
}

const MOUTH = {
  smile: () => <path d="M25 43 q7 6 14 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />,
  grin: () => (
    <g>
      <path d="M23 41 h18 q-1 9 -9 9 q-8 0 -9 -9" fill={INK} />
      <rect x="25" y="41" width="14" height="3" rx="1" fill={PAPER} />
    </g>
  ),
  oh: () => <ellipse cx="32" cy="45" rx="4" ry="5" fill={INK} />,
};

function Face({ color, children, happy = false }) {
  return (
    <g>
      <circle cx="32" cy="32" r="30" fill="#0f172a" opacity="0.15" />
      <circle cx="32" cy="30" r="27" fill={PAPER} />
      <circle cx="32" cy="30" r="24" fill={color} />
      <ellipse cx="32" cy="41" rx="14" ry="9" fill={PAPER} opacity="0.18" />
      {children}
      <EyePair y={32} happy={happy} />
    </g>
  );
}

const LEGACY_DETAILS = {
  spark: ({ color }) => (
    <Face color={color}>
      <polygon points="32,7 35,17 46,17 37,23 40,34 32,27 24,34 27,23 18,17 29,17" fill={GOLD} />
    </Face>
  ),
  fox: ({ color }) => (
    <Face color={color}>
      <polygon points="15,20 22,6 29,22" fill={color} stroke={LINE} strokeWidth="1" />
      <polygon points="49,20 42,6 35,22" fill={color} stroke={LINE} strokeWidth="1" />
      <polygon points="20,19 23,11 27,21" fill={PAPER} opacity="0.55" />
      <polygon points="44,19 41,11 37,21" fill={PAPER} opacity="0.55" />
      <path d="M24 39 q8 7 16 0 q-2 12 -16 0" fill={PAPER} opacity="0.5" />
    </Face>
  ),
  frog: ({ color }) => (
    <Face color={color}>
      <circle cx="21" cy="15" r="8" fill={color} stroke={LINE} strokeWidth="1.5" />
      <circle cx="43" cy="15" r="8" fill={color} stroke={LINE} strokeWidth="1.5" />
      <circle cx="21" cy="15" r="3" fill={PAPER} />
      <circle cx="43" cy="15" r="3" fill={PAPER} />
      <circle cx="21" cy="15" r="1.5" fill={INK} />
      <circle cx="43" cy="15" r="1.5" fill={INK} />
    </Face>
  ),
  bunny: ({ color }) => (
    <Face color={color}>
      <ellipse cx="23" cy="8" rx="6" ry="15" fill={color} stroke={LINE} strokeWidth="1" />
      <ellipse cx="41" cy="8" rx="6" ry="15" fill={color} stroke={LINE} strokeWidth="1" />
      <ellipse cx="23" cy="9" rx="2.6" ry="10" fill={PAPER} opacity="0.5" />
      <ellipse cx="41" cy="9" rx="2.6" ry="10" fill={PAPER} opacity="0.5" />
      <circle cx="32" cy="39" r="2.3" fill={BLUSH} />
    </Face>
  ),
  robot: ({ color }) => (
    <g>
      <circle cx="32" cy="32" r="30" fill="#0f172a" opacity="0.15" />
      <rect x="10" y="12" width="44" height="40" rx="15" fill={PAPER} />
      <rect x="14" y="16" width="36" height="32" rx="11" fill={color} />
      <rect x="29" y="5" width="6" height="10" rx="3" fill={LINE} />
      <circle cx="32" cy="5" r="4" fill={GOLD} />
      <EyePair y={31} />
    </g>
  ),
  lion: ({ color }) => (
    <g>
      <circle cx="32" cy="32" r="30" fill="#0f172a" opacity="0.15" />
      <circle cx="32" cy="30" r="27" fill="#92400e" />
      <circle cx="32" cy="30" r="20" fill={color} />
      <EyePair y={30} />
      <ellipse cx="32" cy="40" rx="10" ry="7" fill={PAPER} opacity="0.42" />
    </g>
  ),
  owl: ({ color }) => (
    <Face color={color}>
      <polygon points="16,17 23,8 30,19" fill={color} stroke={LINE} strokeWidth="1" />
      <polygon points="48,17 41,8 34,19" fill={color} stroke={LINE} strokeWidth="1" />
      <polygon points="32,35 28,40 36,40" fill={GOLD} />
    </Face>
  ),
  seal: ({ color }) => (
    <Face color={color} happy>
      <ellipse cx="16" cy="30" rx="5" ry="8" fill={mix(LINE, 0.35)} />
      <ellipse cx="48" cy="30" rx="5" ry="8" fill={mix(LINE, 0.35)} />
      <circle cx="32" cy="39" r="2" fill={INK} />
      <path d="M26 43 q6 4 12 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Face>
  ),
  dragon: ({ color }) => (
    <Face color={color}>
      <polygon points="21,15 25,5 29,17" fill={GOLD} />
      <polygon points="35,17 39,5 43,15" fill={GOLD} />
      <path d="M18 22 q14 -8 28 0" stroke={LINE} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Face>
  ),
  bee: ({ color }) => (
    <Face color={color}>
      <ellipse cx="20" cy="15" rx="7" ry="5" fill={PAPER} opacity="0.65" transform="rotate(-24 20 15)" />
      <ellipse cx="44" cy="15" rx="7" ry="5" fill={PAPER} opacity="0.65" transform="rotate(24 44 15)" />
      <path d="M13 28 h38 M15 40 h34" stroke={LINE} strokeWidth="3" opacity="0.38" />
    </Face>
  ),
  bear: ({ color }) => (
    <Face color={color}>
      <circle cx="18" cy="16" r="8" fill={color} stroke={LINE} strokeWidth="1" />
      <circle cx="46" cy="16" r="8" fill={color} stroke={LINE} strokeWidth="1" />
      <circle cx="18" cy="16" r="4" fill={PAPER} opacity="0.42" />
      <circle cx="46" cy="16" r="4" fill={PAPER} opacity="0.42" />
      <ellipse cx="32" cy="40" rx="8" ry="6" fill={PAPER} opacity="0.32" />
    </Face>
  ),
  pup: ({ color }) => (
    <Face color={color}>
      <ellipse cx="16" cy="24" rx="6" ry="12" fill={LINE} opacity="0.65" transform="rotate(18 16 24)" />
      <ellipse cx="48" cy="24" rx="6" ry="12" fill={LINE} opacity="0.65" transform="rotate(-18 48 24)" />
      <circle cx="32" cy="40" r="2.5" fill={INK} />
    </Face>
  ),
  alien: ({ color }) => (
    <Face color={color}>
      <path d="M23 15 q-5 -8 -1 -12 M41 15 q5 -8 1 -12" stroke={LINE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="21" cy="3" r="3" fill={GOLD} />
      <circle cx="43" cy="3" r="3" fill={GOLD} />
    </Face>
  ),
  chick: ({ color }) => (
    <Face color={color} happy>
      <polygon points="32,34 27,40 37,40" fill="#fb923c" />
      <path d="M26 12 q6 -9 12 0" stroke="#fb923c" strokeWidth="4" fill="none" strokeLinecap="round" />
    </Face>
  ),
  raccoon: ({ color }) => (
    <Face color={color}>
      <path d="M15 30 q17 -15 34 0 q-4 12 -17 12 q-13 0 -17 -12" fill={LINE} opacity="0.55" />
      <circle cx="25" cy="32" r="5" fill={PAPER} />
      <circle cx="39" cy="32" r="5" fill={PAPER} />
      <circle cx="26" cy="33" r="2.4" fill={INK} />
      <circle cx="38" cy="33" r="2.4" fill={INK} />
    </Face>
  ),
};

const HAT_RENDER = {
  none: () => null,
  cap: () => <path d="M15 17 q17 -13 34 0 q-4 4 -34 3 z" fill="#10b981" />,
  crown: () => <polygon points="18,18 18,8 25,14 32,6 39,14 46,8 46,18" fill={GOLD} stroke="#b45309" strokeWidth="1" />,
  party: () => <polygon points="32,0 23,18 41,18" fill="#d97706" stroke={LINE} strokeWidth="1" />,
};

const GLASSES_RENDER = {
  none: () => null,
  round: () => (
    <g stroke={INK} strokeWidth="2" fill="none">
      <circle cx="25" cy="32" r="8" />
      <circle cx="39" cy="32" r="8" />
      <line x1="33" y1="32" x2="31" y2="32" />
    </g>
  ),
  shades: () => (
    <g fill={INK}>
      <rect x="16" y="28" width="15" height="10" rx="4" />
      <rect x="33" y="28" width="15" height="10" rx="4" />
      <rect x="30" y="31" width="4" height="2" rx="1" />
    </g>
  ),
};

export default function Avatar({
  config,
  size = 48,
  ring = false,
  className = "",
  variant = "default",
}) {
  const c = sanitizeAvatar(config);
  const uid = useId().replace(/:/g, "");

  if (variant === "mannequin") {
    return (
      <span
        className={`inline-grid place-items-center overflow-visible ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <MannequinWithAccessory accessory={c.accessory || "none"} uid={uid} />
        </svg>
      </span>
    );
  }

  if (PICKER_BASES.includes(c.base) || c.base === "mouse" || variant === "picker") {
    const base = c.base === "mouse" ? "hamster" : PICKER_BASES.includes(c.base) ? c.base : "sun";
    return (
      <span
        className={`inline-grid place-items-center overflow-visible ${ring ? "rounded-full ring-2 ring-white/30" : ""} ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <CompositeAvatar base={base} accessory={c.accessory || "none"} uid={uid} />
        </svg>
      </span>
    );
  }

  const Base = LEGACY_DETAILS[c.base] || LEGACY_DETAILS.spark;
  return (
    <span
      className={`inline-grid place-items-center overflow-visible ${ring ? "rounded-full ring-2 ring-white/30" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <Base color={c.color} />
        {GLASSES_RENDER[c.glasses]?.()}
        {MOUTH[c.mouth]?.()}
        {HAT_RENDER[c.hat]?.()}
      </svg>
    </span>
  );
}
