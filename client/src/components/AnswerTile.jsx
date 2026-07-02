import { motion } from "framer-motion";
import Shape from "./Shape.jsx";
import { tileStyle } from "../lib/answers.js";
import { listStagger, spring, useReducedMotion } from "../lib/motion.js";

// One answer tile. Used both on the player phone (interactive, big tap target)
// and the host screen (display only). After reveal it can dim wrong answers and
// spotlight the correct one. `type` ("mc" | "tf") decides shape vs True/False
// glyph styling — True/False tiles read as a big ✓ / ✕.
export default function AnswerTile({
  index,
  text,
  type = "mc",
  onClick,
  disabled = false,
  selected = false,
  staggerIndex = 0,
  entranceDelay = null,
  kahoot = false,
  // reveal state (optional):
  revealed = false,
  correct = false,
  count = null,
  big = false,
  compact = false,
}) {
  const reduced = useReducedMotion();
  const s = tileStyle(type, index);
  const isTF = type === "tf";
  const interactive = typeof onClick === "function";

  let dim = "";
  let stateClass = "";
  if (revealed) {
    if (correct) stateClass = "answer-tile--correct";
    else dim = "opacity-40 saturate-50";
  }
  if (selected && !revealed) stateClass = "answer-tile--selected";

  const className = [
    "answer-tile",
    kahoot ? "answer-tile--kahoot" : "",
    compact ? "answer-tile--compact" : "",
    big && !compact ? "answer-tile--big" : "",
    isTF ? "answer-tile--tf" : "",
    dim,
    stateClass,
    disabled ? "answer-tile--disabled" : "answer-tile--interactive",
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e) => {
    if (disabled || !onClick) return;
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  const iconEl = isTF ? (
    <span className="answer-tile__icon answer-tile__icon--glyph">{s.glyph}</span>
  ) : (
    <span className="answer-tile__icon answer-tile__icon--shape">
      <Shape type={s.shape} size={kahoot ? 32 : compact ? 24 : big ? 38 : 30} />
    </span>
  );

  const inner = (
    <>
      {kahoot ? <span className="answer-tile__rail">{iconEl}</span> : iconEl}
      <span className={`answer-tile__label ${isTF ? "answer-tile__label--tf" : ""}`}>{text}</span>
      {revealed && correct && <span className="answer-tile__mark">✓</span>}
      {revealed && !correct && selected && <span className="answer-tile__mark">✕</span>}
      {count !== null && <span className="answer-tile__count">{count}</span>}
    </>
  );

  // Choreographed entrance: optional base delay (after prompt + image) plus the
  // per-tile ▲ ◆ ● ■ stagger.
  const delay = reduced ? 0 : (entranceDelay ?? 0) + listStagger(staggerIndex, 0.07);

  // Player taps: keep the native button (fixes iOS touch + backdrop-filter bugs)
  // and animate a wrapper div for the entrance instead.
  if (interactive) {
    const button = (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={className}
        style={{ "--tile-color": s.color, backgroundColor: "var(--tile-color)" }}
        aria-pressed={selected}
      >
        {inner}
      </button>
    );
    if (entranceDelay == null || reduced) return button;
    return (
      <motion.div
        className="min-h-0 min-w-0"
        initial={{ opacity: 0, y: 14, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring.snappy, delay }}
      >
        {button}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      disabled={disabled}
      initial={reduced ? false : { opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring.snappy, delay }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className={className}
      style={{ "--tile-color": s.color, backgroundColor: "var(--tile-color)" }}
      aria-pressed={selected}
    >
      {inner}
    </motion.button>
  );
}
