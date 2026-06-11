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

  let dim = "";
  let stateClass = "";
  if (revealed) {
    if (correct) stateClass = "answer-tile--correct ring-4 ring-paper scale-[1.02]";
    else dim = "opacity-40 saturate-50";
  }
  if (selected && !revealed) stateClass = "answer-tile--selected";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={reduced ? false : { opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: selected && !revealed ? 1.02 : 1 }}
      transition={{ ...spring.snappy, delay: listStagger(staggerIndex, 0.07, reduced) }}
      whileTap={disabled ? undefined : { scale: 0.95, y: 2 }}
      className={`answer-tile relative flex w-full items-center gap-4 rounded-2xl px-5 font-bold text-paper shadow-tile transition-[filter,box-shadow]
        ${compact ? "min-h-[2.75rem] gap-2 px-3 py-2.5 text-base landscapePhone:min-h-0 landscapePhone:py-2 landscapePhone:text-sm landscapePhone:gap-1.5" : ""}
        ${big && !compact ? "min-h-[3.5rem] py-7 text-2xl sm:min-h-[4rem] sm:text-3xl" : ""}
        ${!big && !compact ? "min-h-touch py-6 text-xl sm:text-2xl" : ""}
        ${isTF && !compact ? "min-h-[4.5rem] justify-center py-8 sm:min-h-[5.5rem] sm:py-12" : ""}
        ${isTF && compact ? "min-h-[3rem] justify-center py-4 landscapePhone:min-h-0 landscapePhone:py-2 landscapePhone:flex-col landscapePhone:gap-0.5" : ""}
        ${!isTF && compact ? "landscapePhone:flex-col landscapePhone:justify-center landscapePhone:gap-0.5 landscapePhone:text-center" : ""}
        ${dim} ${stateClass} ${disabled ? "cursor-default" : "hover:brightness-105"}`}
      style={{ "--tile-color": s.color, backgroundColor: "var(--tile-color)" }}
      aria-pressed={selected}
    >
      {isTF ? (
        <span className="answer-tile__icon text-4xl sm:text-5xl landscapePhone:text-2xl">{s.glyph}</span>
      ) : (
        <span
          className={`answer-tile__icon flex shrink-0 items-center justify-center ${compact ? "h-7 w-7 landscapePhone:h-5 landscapePhone:w-5" : big ? "h-10 w-10" : "h-10 w-10"}`}
        >
          <Shape type={s.shape} size={compact ? 24 : big ? 38 : 30} />
        </span>
      )}
      <span
        className={`answer-tile__label leading-tight drop-shadow ${isTF ? "answer-tile__label--tf text-3xl sm:text-4xl landscapePhone:text-sm" : "flex-1 text-left landscapePhone:flex-none landscapePhone:text-center landscapePhone:w-full"}`}
      >
        {text}
      </span>

      {revealed && correct && <span className="ml-2 text-3xl landscapePhone:text-xl">✓</span>}
      {revealed && !correct && selected && <span className="ml-2 text-3xl landscapePhone:text-xl">✕</span>}

      {count !== null && (
        <span className="ml-auto rounded-full bg-black/25 px-3 py-1 text-base tabular-nums landscapePhone:px-2 landscapePhone:text-xs">
          {count}
        </span>
      )}

      {selected && !revealed && (
        <span className="answer-tile__lock pointer-events-none absolute right-2 top-2 text-sm opacity-90 landscapePhone:right-1 landscapePhone:top-1 landscapePhone:text-xs">
          ✓
        </span>
      )}
    </motion.button>
  );
}
