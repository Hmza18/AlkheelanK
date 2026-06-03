// Clay-style 3D avatar faces — each character has a distinct personality read.

const INK = "#2a2118";
const SCLERA = "#faf6f0";
const BLUSH = "#f4878a";
const BLUSH_DARK = "#e86b72";

export const PICKER_BASES = [
  "sun",
  "bear",
  "moose",
  "pug",
  "cat",
  "hamster",
  "rabbit",
  "fox",
  "wolf",
];

export const CHARACTER_VIBES = {
  sun: "Radiant · stands out",
  bear: "Chill · easygoing",
  moose: "Underrated · gentle giant",
  pug: "Funny · crowd favorite",
  cat: "Clean · composed",
  hamster: "Dark horse · sleeper pick",
  rabbit: "Fast · high energy",
  fox: "Sleek · sharp",
  wolf: "Intimidating · fierce",
};

/** Legacy saves may still use `mouse`; render as hamster. */
export function resolvePickerBase(base) {
  if (base === "mouse") return "hamster";
  return PICKER_BASES.includes(base) ? base : "sun";
}

export const ACCESSORIES = [
  "none",
  "disguise",
  "note",
  "pacifier",
  "pancakes",
  "icecream",
  "football",
  "cycling",
  "bow",
];

function ClayDefs({ uid, skin }) {
  const { light, mid, dark, rim } = skin;
  return (
    <defs>
      <radialGradient id={`${uid}-skin`} cx="34%" cy="28%" r="68%">
        <stop offset="0%" stopColor={light} />
        <stop offset="52%" stopColor={mid} />
        <stop offset="100%" stopColor={dark} />
      </radialGradient>
      <radialGradient id={`${uid}-highlight`} cx="30%" cy="22%" r="45%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-cheek`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={rim} stopOpacity="0.35" />
        <stop offset="100%" stopColor={rim} stopOpacity="0" />
      </radialGradient>
      <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#1a1814" floodOpacity="0.28" />
      </filter>
    </defs>
  );
}

function ClayShadow({ wide = false }) {
  return <ellipse cx="32" cy="56" rx={wide ? 19 : 17} ry="4.5" fill="#1a1814" opacity="0.18" />;
}

function ClayHead({ uid, cx = 32, cy = 34, rx = 21, ry = 22 }) {
  return (
    <g filter={`url(#${uid}-soft)`}>
      <ellipse cx={cx} cy={cy + 1} rx={rx} ry={ry} fill={`url(#${uid}-skin)`} />
      <ellipse cx={cx - 5} cy={cy - 7} rx={rx * 0.55} ry={ry * 0.42} fill={`url(#${uid}-highlight)`} />
      <ellipse cx={cx - 10} cy={cy + 5} rx="5.5" ry="3.5" fill={`url(#${uid}-cheek)`} />
      <ellipse cx={cx + 10} cy={cy + 5} rx="5.5" ry="3.5" fill={`url(#${uid}-cheek)`} />
    </g>
  );
}

function ClayTube({ d, color, width = 4.5, opacity = 1 }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

function ClayEar({ cx, cy, r, color, inner }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy + 1} r={r * 0.48} fill={inner} opacity="0.55" />
      <ellipse cx={cx - r * 0.2} cy={cy - r * 0.25} rx={r * 0.35} ry={r * 0.22} fill="#fff" opacity="0.25" />
    </g>
  );
}

function ClayFace({ mood = "default", eyeY = 30, eyeScale = 1 }) {
  switch (mood) {
    case "sun":
      return (
        <g>
          <path d="M20 30 q4 -4 8 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M36 30 q4 -4 8 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="32" cy="39" rx="3.5" ry="2.8" fill={BLUSH} />
          <path d="M24 43 q8 5 16 0" fill="none" stroke={BLUSH_DARK} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "chill":
      return (
        <g>
          <path d="M19 24 q5 -3 10 0" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M35 24 q5 -3 10 0" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M20 31 q4 2 8 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36 31 q4 2 8 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="32" cy="40" rx="4" ry="3" fill={BLUSH} opacity="0.85" />
          <path d="M24 44 q8 3 16 0" fill="none" stroke={BLUSH_DARK} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "gentle":
      return (
        <g>
          <rect x="20" y="23" width="9" height="2.5" rx="1.2" fill={INK} opacity="0.7" />
          <rect x="35" y="23" width="9" height="2.5" rx="1.2" fill={INK} opacity="0.7" />
          <circle cx="24" cy={eyeY + 1} r="4.8" fill={SCLERA} />
          <circle cx="40" cy={eyeY + 1} r="4.8" fill={SCLERA} />
          <circle cx="25" cy={eyeY + 2} r="2.2" fill={INK} />
          <circle cx="39" cy={eyeY + 2} r="2.2" fill={INK} />
          <ellipse cx="32" cy="41" rx="5" ry="3.5" fill={BLUSH} opacity="0.8" />
          <path d="M27 45 q5 2 10 0" fill="none" stroke={BLUSH_DARK} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "funny":
      return (
        <g>
          <circle cx="23" cy={eyeY - 1} r="6" fill={SCLERA} />
          <circle cx="41" cy={eyeY + 1} r="5.2" fill={SCLERA} />
          <circle cx="24" cy={eyeY} r="3" fill={INK} />
          <circle cx="40" cy={eyeY + 2} r="2.5" fill={INK} />
          <ellipse cx="32" cy="39" rx="6" ry="5" fill={BLUSH} opacity="0.35" />
          <ellipse cx="32" cy="46" rx="5" ry="4" fill="#fb7185" />
          <ellipse cx="32" cy="47" rx="3" ry="2.2" fill="#fda4af" />
        </g>
      );
    case "clean":
      return (
        <g>
          <ellipse cx="24" cy={eyeY} rx="4.5" ry="5.5" fill={SCLERA} />
          <ellipse cx="40" cy={eyeY} rx="4.5" ry="5.5" fill={SCLERA} />
          <ellipse cx="24" cy={eyeY + 0.5} rx="2" ry="2.8" fill={INK} />
          <ellipse cx="40" cy={eyeY + 0.5} rx="2" ry="2.8" fill={INK} />
          <polygon points="32,40 28,44 36,44" fill={BLUSH} opacity="0.9" />
          <path d="M28 45 q4 1 8 0" fill="none" stroke={BLUSH_DARK} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    case "sleeper":
      return (
        <g>
          <rect x="19" y="22" width="10" height="3" rx="1.5" fill={INK} />
          <rect x="34" y="24" width="10" height="2.5" rx="1.2" fill={INK} opacity="0.65" />
          <circle cx="24" cy={eyeY + 1} r="5" fill={SCLERA} />
          <circle cx="40" cy={eyeY + 1} r="5" fill={SCLERA} />
          <circle cx="25.5" cy={eyeY + 2} r="2.3" fill={INK} />
          <circle cx="38.5" cy={eyeY + 2} r="2.3" fill={INK} />
          <ellipse cx="32" cy="40" rx="3" ry="2.2" fill={BLUSH} />
          <path d="M27 44 q5 3 10 -1" fill="none" stroke={BLUSH_DARK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case "fast":
      return (
        <g>
          <rect x="18" y="22" width="11" height="3.2" rx="1.6" fill={INK} />
          <rect x="35" y="22" width="11" height="3.2" rx="1.6" fill={INK} />
          <circle cx="24" cy={eyeY - 1} r="6" fill={SCLERA} />
          <circle cx="40" cy={eyeY - 1} r="6" fill={SCLERA} />
          <circle cx="25" cy={eyeY} r="2.8" fill={INK} />
          <circle cx="39" cy={eyeY} r="2.8" fill={INK} />
          <circle cx="26.5" cy={eyeY - 1.5} r="1" fill={SCLERA} />
          <circle cx="40.5" cy={eyeY - 1.5} r="1" fill={SCLERA} />
          <rect x="30" y="39" width="4" height="3.5" rx="1.8" fill={BLUSH} />
          <path d="M25 43 q7 5 14 0" fill="none" stroke={BLUSH_DARK} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "sleek":
      return (
        <g>
          <path d="M18 24 L28 21" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M46 24 L36 21" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <ellipse cx="24" cy={eyeY} rx="4" ry="3.2" fill={SCLERA} />
          <ellipse cx="40" cy={eyeY} rx="4" ry="3.2" fill={SCLERA} />
          <ellipse cx="24.5" cy={eyeY + 0.3} rx="1.8" ry="2" fill={INK} />
          <ellipse cx="39.5" cy={eyeY + 0.3} rx="1.8" ry="2" fill={INK} />
          <ellipse cx="32" cy="41" rx="3.5" ry="3" fill={INK} />
          <path d="M28 44 q4 2 8 -1" fill="none" stroke={BLUSH_DARK} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "fierce":
      return (
        <g>
          <path d="M17 22 L27 26" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M47 22 L37 26" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M24 20 L30 24" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M40 20 L34 24" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy={eyeY} r="4.8" fill="#fef3c7" />
          <circle cx="40" cy={eyeY} r="4.8" fill="#fef3c7" />
          <circle cx="24" cy={eyeY + 0.5} r="1.8" fill={INK} />
          <circle cx="40" cy={eyeY + 0.5} r="1.8" fill={INK} />
          <ellipse cx="32" cy="41" rx="5" ry="4" fill={INK} opacity="0.85" />
          <path d="M27 46 q5 -2 10 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="19" y="23" width="10" height="3.2" rx="1.6" fill={INK} />
          <rect x="35" y="23" width="10" height="3.2" rx="1.6" fill={INK} />
          <circle cx="24" cy={eyeY} r={5.2 * eyeScale} fill={SCLERA} />
          <circle cx="40" cy={eyeY} r={5.2 * eyeScale} fill={SCLERA} />
          <circle cx="25" cy={eyeY + 0.8} r={2.35 * eyeScale} fill={INK} />
          <circle cx="39" cy={eyeY + 0.8} r={2.35 * eyeScale} fill={INK} />
          <rect x="29.5" y="38" width="5" height="4.2" rx="2.1" fill={BLUSH} />
          <path d="M26 43 q6 4.5 12 0" fill="none" stroke={BLUSH_DARK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
  }
}

const SKINS = {
  sun: { light: "#fff3bf", mid: "#fbbf24", dark: "#ea580c", rim: "#fb923c" },
  bear: { light: "#e8c9a0", mid: "#a16207", dark: "#78350f", rim: "#92400e" },
  moose: { light: "#c4a484", mid: "#8b5e34", dark: "#5c3d1e", rim: "#6b4423" },
  pug: { light: "#f0c89a", mid: "#d4a574", dark: "#a16207", rim: "#b45309" },
  cat: { light: "#fed7aa", mid: "#f97316", dark: "#c2410c", rim: "#ea580c" },
  hamster: { light: "#fde68a", mid: "#d97706", dark: "#92400e", rim: "#fbbf24" },
  rabbit: { light: "#fff7ed", mid: "#f5f0e8", dark: "#d6d3d1", rim: "#fce7f3" },
  fox: { light: "#fdba74", mid: "#ea580c", dark: "#9a3412", rim: "#fb923c" },
  wolf: { light: "#cbd5e1", mid: "#64748b", dark: "#334155", rim: "#475569" },
  mannequin: { light: "#e5e7eb", mid: "#9ca3af", dark: "#6b7280", rim: "#d1d5db" },
};

function ClayAccessory({ id, uid }) {
  switch (id) {
    case "disguise":
      return (
        <g>
          <rect x="15" y="27" width="13" height="8" rx="3" fill="#6366f1" />
          <rect x="36" y="27" width="13" height="8" rx="3" fill="#6366f1" />
          <rect x="28.5" y="30" width="7" height="2.5" rx="1.2" fill="#4f46e5" />
          <rect x="21" y="40" width="22" height="5" rx="2.5" fill="#78350f" />
        </g>
      );
    case "note":
      return (
        <g transform="rotate(-7 32 16)">
          <rect x="21" y="7" width="22" height="18" rx="3" fill="#fde047" filter={`url(#${uid}-soft)`} />
          <rect x="25" y="14" width="14" height="2" rx="1" fill="#ca8a04" opacity="0.55" />
        </g>
      );
    case "pacifier":
      return (
        <g>
          <circle cx="32" cy="44" r="7.5" fill="#f472b6" />
          <circle cx="32" cy="44" r="4.5" fill="#fce7f3" />
          <rect x="30" y="35" width="4" height="7" rx="2" fill="#ec4899" />
        </g>
      );
    case "pancakes":
      return (
        <g>
          <ellipse cx="32" cy="11" rx="15" ry="4.5" fill="#d97706" />
          <ellipse cx="32" cy="7.5" rx="13" ry="3.8" fill="#fbbf24" />
          <ellipse cx="32" cy="4.5" rx="10" ry="3" fill="#fde68a" />
          <rect x="28" y="3" width="8" height="3.5" rx="1.5" fill="#f43f5e" />
        </g>
      );
    case "icecream":
      return (
        <g>
          <path d="M26 15 q6 -11 12 0 l-3.5 17 q-2.5 4 -8.5 0 z" fill="#f9a8d4" />
          <ellipse cx="32" cy="13" rx="10" ry="6" fill="#fda4af" />
        </g>
      );
    case "football":
      return (
        <g>
          <ellipse cx="32" cy="10" rx="17" ry="10" fill="#854d0e" />
          <path d="M17 10 h30" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    case "cycling":
      return (
        <g>
          <path d="M11 22 q21 -17 42 0 v7 q-21 7 -42 0 z" fill="#0ea5e9" />
          <rect x="28" y="14" width="8" height="5" rx="2" fill="#38bdf8" />
        </g>
      );
    case "bow":
      return (
        <g>
          <path d="M18 12 q14 9 28 0 q-14 9 -28 0" fill="#e11d48" />
          <circle cx="32" cy="12" r="4.2" fill="#f43f5e" />
        </g>
      );
    default:
      return null;
  }
}

export function AccessoryLayer({ id, uid = "clay" }) {
  return <ClayAccessory id={id} uid={uid} />;
}

const CHARACTERS = {
  sun: ({ uid, skin }) => (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 32 32)`}>
          <ellipse cx="32" cy="7" rx="3" ry="5.5" fill={skin.dark} />
          <ellipse cx="32" cy="6" rx="1.6" ry="3" fill={skin.light} opacity="0.7" />
        </g>
      ))}
      <ClayHead uid={uid} cy={34} rx={21} ry={22} />
      <circle cx="21" cy="37" r="3.2" fill={skin.rim} opacity="0.4" />
      <circle cx="43" cy="37" r="3.2" fill={skin.rim} opacity="0.4" />
      <ClayFace mood="sun" />
    </g>
  ),
  bear: ({ uid, skin }) => (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow />
      <ClayEar cx={16} cy={17} r={9} color={skin.dark} inner={skin.mid} />
      <ClayEar cx={48} cy={17} r={9} color={skin.dark} inner={skin.mid} />
      <ClayHead uid={uid} cy={35} />
      <ellipse cx="32" cy="41" rx="11" ry="8" fill={skin.light} opacity="0.35" />
      <ClayFace mood="chill" />
    </g>
  ),
  moose: ({ uid, skin }) => (
    <g transform="rotate(-3 32 32)">
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow wide />
      <ClayTube d="M11 21 q7 -8 14 0" color={skin.dark} width={4} opacity={0.85} />
      <ClayTube d="M53 21 q-7 -8 -14 0" color={skin.dark} width={4} opacity={0.85} />
      <ClayHead uid={uid} cy={36} rx={22} ry={21} />
      <ellipse cx="32" cy="43" rx="13" ry="9" fill={skin.light} opacity="0.28" />
      <ClayFace mood="gentle" eyeY={31} />
    </g>
  ),
  pug: ({ uid, skin }) => (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow />
      <ellipse cx="19" cy="28" rx="8" ry="11" fill={skin.dark} />
      <ellipse cx="45" cy="28" rx="8" ry="11" fill={skin.dark} />
      <ClayHead uid={uid} cy={35} rx={20} ry={21} />
      <path d="M22 36 q10 8 20 0" fill="none" stroke={skin.dark} strokeWidth="1.5" opacity="0.35" />
      <ClayFace mood="funny" eyeY={27} />
    </g>
  ),
  cat: ({ uid, skin }) => (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow />
      <path d="M15 27 L21 10 L27 26 Z" fill={skin.mid} />
      <path d="M49 27 L43 10 L37 26 Z" fill={skin.mid} />
      <ClayHead uid={uid} cy={36} rx={20} ry={21} />
      <ClayFace mood="clean" eyeY={31} />
    </g>
  ),
  hamster: ({ uid, skin }) => (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow />
      <circle cx="14" cy="38" r="7" fill={skin.light} opacity="0.9" />
      <circle cx="50" cy="38" r="7" fill={skin.light} opacity="0.9" />
      <circle cx="14" cy="38" r="4" fill={skin.mid} opacity="0.5" />
      <circle cx="50" cy="38" r="4" fill={skin.mid} opacity="0.5" />
      <ClayEar cx="19" cy="14" r={9} color={skin.mid} inner={skin.light} />
      <ClayEar cx="45" cy="14" r={9} color={skin.mid} inner={skin.light} />
      <ClayHead uid={uid} cy={36} rx={19} ry={20} />
      <ClayFace mood="sleeper" eyeY={31} />
    </g>
  ),
  rabbit: ({ uid, skin }) => (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow />
      <ellipse cx="23" cy="11" rx="6" ry="15" fill={skin.mid} />
      <ellipse cx="41" cy="11" rx="6" ry="15" fill={skin.mid} />
      <ellipse cx="23" cy="12" rx="2.8" ry="11" fill="#fce7f3" opacity="0.75" />
      <ellipse cx="41" cy="12" rx="2.8" ry="11" fill="#fce7f3" opacity="0.75" />
      <ClayHead uid={uid} cy={36} rx={20} ry={21} />
      <circle cx="24" cy="39" r="2.8" fill="#fda4af" opacity="0.65" />
      <circle cx="40" cy="39" r="2.8" fill="#fda4af" opacity="0.65" />
      <ellipse cx="24" cy="31" rx="5.2" ry="6" fill={SCLERA} />
      <ellipse cx="40" cy="31" rx="5.2" ry="6" fill={SCLERA} />
      <ellipse cx="24.5" cy="32" rx="2.4" ry="3" fill={INK} />
      <ellipse cx="39.5" cy="32" rx="2.4" ry="3" fill={INK} />
      <circle cx="25.8" cy="29.5" r="1" fill={SCLERA} />
      <circle cx="40.8" cy="29.5" r="1" fill={SCLERA} />
      <polygon points="32,39 29,43 35,43" fill={BLUSH} />
      <path d="M26 44 q6 4 12 0" fill="none" stroke={BLUSH_DARK} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  ),
  fox: ({ uid, skin }) => (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow />
      <ClayTube d="M14 25 Q19 9 27 23" color={skin.mid} width={5} />
      <ClayTube d="M50 25 Q45 9 37 23" color={skin.mid} width={5} />
      <ClayHead uid={uid} cy={36} rx={19} ry={20} />
      <path d="M23 38 q9 9 18 0" fill={skin.light} opacity="0.45" />
      <ClayFace mood="sleek" eyeY={31} />
    </g>
  ),
  wolf: ({ uid, skin }) => (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow wide />
      <ClayTube d="M13 23 Q17 6 25 21" color={skin.dark} width={5.5} />
      <ClayTube d="M51 23 Q47 6 39 21" color={skin.dark} width={5.5} />
      <ClayHead uid={uid} cy={36} rx={20} ry={21} />
      <ellipse cx="32" cy="42" rx="12" ry="8" fill={skin.light} opacity="0.25" />
      <ClayFace mood="fierce" eyeY={31} />
    </g>
  ),
};

function MannequinClay({ uid }) {
  const skin = SKINS.mannequin;
  return (
    <g>
      <ClayDefs uid={uid} skin={skin} />
      <ClayShadow />
      <ClayHead uid={uid} cy={34} />
    </g>
  );
}

export function PickerCharacter({ base, uid = "clay" }) {
  const resolved = resolvePickerBase(base);
  const skin = SKINS[resolved] || SKINS.sun;
  const Draw = CHARACTERS[resolved] || CHARACTERS.sun;
  return <Draw uid={uid} skin={skin} />;
}

export function MannequinWithAccessory({ accessory, uid = "clay" }) {
  return (
    <g>
      <MannequinClay uid={uid} />
      {accessory && accessory !== "none" ? <ClayAccessory id={accessory} uid={uid} /> : null}
    </g>
  );
}

export function CompositeAvatar({ base, accessory, uid = "clay" }) {
  const resolved = resolvePickerBase(base);
  return (
    <g>
      <PickerCharacter base={resolved} uid={uid} />
      {accessory && accessory !== "none" ? <ClayAccessory id={accessory} uid={uid} /> : null}
    </g>
  );
}
