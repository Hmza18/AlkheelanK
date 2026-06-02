// The four answer shapes rendered as crisp SVG (better than glyphs for big tap
// targets). White fill reads on any colored tile.

export default function Shape({ type, size = 28, color = "#ffffff" }) {
  const s = size;
  const common = { fill: color };
  switch (type) {
    case "triangle":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,3 22,21 2,21" {...common} />
        </svg>
      );
    case "diamond":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 22,12 12,22 2,12" {...common} />
        </svg>
      );
    case "circle":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" {...common} />
        </svg>
      );
    case "square":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" {...common} />
        </svg>
      );
    default:
      return null;
  }
}
