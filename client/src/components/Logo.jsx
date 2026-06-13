// Alkheeloot wordmark. The four answer shapes are baked into the mark so the brand
// itself hints at the gameplay — familiarity from the flow, not a copied logo.

const SHAPES = [
  { type: "triangle", color: "#f43f5e" },
  { type: "diamond", color: "#3b82f6" },
  { type: "circle", color: "#f59e0b" },
  { type: "square", color: "#10b981" },
];

function Mark({ size = 44 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="ak-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--alkheelank-brand-start)" />
          <stop offset="55%" stopColor="var(--alkheelank-brand-mid)" />
          <stop offset="100%" stopColor="var(--alkheelank-brand-end)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="26" fill="url(#ak-bg)" />
      {/* mini answer-shape cluster */}
      <polygon points="30,28 39,44 21,44" fill="#fde68a" />
      <rect x="56" y="28" width="16" height="16" rx="3" transform="rotate(45 64 36)" fill="#93c5fd" />
      <circle cx="30" cy="66" r="9" fill="#fdba74" />
      <rect x="55" y="57" width="18" height="18" rx="4" fill="#a7f3d0" />
    </svg>
  );
}

export default function Logo({ size = "md", withMark = true, withText = true, className = "" }) {
  const text =
    size === "lg"
      ? "text-6xl sm:text-7xl"
      : size === "sm"
      ? "text-2xl"
      : "text-4xl";
  const markSize = size === "lg" ? 64 : size === "sm" ? 30 : 44;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {withMark && <Mark size={markSize} />}
      {withText && (
        <span className={`font-display font-bold tracking-tight alkheelank-gradient-text ${text}`}>
          Alkheeloot
        </span>
      )}
    </div>
  );
}

export { SHAPES };
