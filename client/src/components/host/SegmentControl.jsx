/** Pill segment control for mode, pace, team preset, etc. */
export default function SegmentControl({ options, value, onChange, className = "" }) {
  return (
    <div className={`pregame-segment ${className}`} role="group">
      {options.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={`pregame-segment__btn ${value === id ? "pregame-segment__btn--active" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
