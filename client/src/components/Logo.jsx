import { useId } from "react";
import { BRAND } from "../lib/brand.js";

/** Brand mid — kept for legacy call sites (PlayerShareCard, etc.). */
const MARK_PURPLE = "#7C3AED";

const CAT_PATH =
  "M76 96 L80 52 L73 45 L79 37 L71 31 L77 23 L66 23 L64 8 L58 19 L54 8 L49 21 L41 25 L29 33 L17 49 L11 61 L18 67 L27 62 L31 71 L41 81 L46 96 Z M32 40 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z";

function Mark({ size = 44 }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `k-logo-grad-${uid}`;
  const shineId = `k-logo-shine-${uid}`;
  const shadowId = `k-logo-shadow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="k-logo-mark"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="8%" y1="6%" x2="92%" y2="94%">
          <stop offset="0%" stopColor="var(--alkheelank-brand-start, #a78bfa)" />
          <stop offset="52%" stopColor="var(--alkheelank-brand-mid, #7c3aed)" />
          <stop offset="100%" stopColor="var(--alkheelank-brand-end, #6d28d9)" />
        </linearGradient>
        <linearGradient id={shineId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#f8f8f8" stopOpacity="0.38" />
          <stop offset="55%" stopColor="#f8f8f8" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#f8f8f8" stopOpacity="0" />
        </linearGradient>
        <filter id={shadowId} x="-18%" y="-12%" width="136%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#7c3aed" floodOpacity="0.28" />
        </filter>
      </defs>
      <rect width="100" height="100" rx="26" fill={`url(#${gradId})`} filter={`url(#${shadowId})`} />
      <rect width="100" height="100" rx="26" fill={`url(#${shineId})`} />
      <rect
        x="1.25"
        y="1.25"
        width="97.5"
        height="97.5"
        rx="24.75"
        fill="none"
        stroke="#f8f8f8"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      <g transform="translate(20, 20) scale(0.6)">
        <path d={CAT_PATH} fill="#f8f8f8" fillRule="evenodd" />
      </g>
    </svg>
  );
}

export default function Logo({ size = "md", withMark = true, withText = true, className = "" }) {
  const text =
    size === "lg" ? "text-5xl sm:text-6xl" : size === "sm" ? "text-xl" : "text-3xl";
  const markSize = size === "lg" ? 56 : size === "sm" ? 28 : 40;
  const wordClass =
    size === "lg"
      ? "k-shimmer-text"
      : size === "sm"
        ? "text-brand-mid"
        : "text-ink-900";

  return (
    <div className={`k-logo flex items-center gap-2.5 ${className}`}>
      {withMark && <Mark size={markSize} />}
      {withText && (
        <span className={`font-display font-extrabold tracking-tight ${wordClass} ${text}`}>
          {BRAND.name}
        </span>
      )}
    </div>
  );
}

export { Mark, MARK_PURPLE, CAT_PATH };
