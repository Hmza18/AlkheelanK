import { motion } from "framer-motion";
import Shape from "./Shape.jsx";
import { tileStyle } from "../lib/answers.js";

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
  // reveal state (optional):
  revealed = false,
  correct = false,
  count = null,
  big = false,
  compact = false,
}) {
  const s = tileStyle(type, index);
  const isTF = type === "tf";

  let dim = "";
  let ring = "";
  if (revealed) {
    if (correct) ring = "ring-4 ring-paper scale-[1.02]";
    else dim = "opacity-40 saturate-50";
  }
  if (selected && !revealed) ring = "ring-4 ring-paper";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className={`answer-tile relative flex w-full items-center gap-4 rounded-2xl px-5 font-bold text-paper shadow-tile transition
        ${compact ? "min-h-[2.75rem] gap-2 px-3 py-3 text-base landscapePhone:min-h-[2.5rem] landscapePhone:py-2 landscapePhone:text-sm" : ""}
        ${big && !compact ? "min-h-[3.5rem] py-7 text-2xl sm:min-h-[4rem] sm:text-3xl" : ""}
        ${!big && !compact ? "min-h-touch py-6 text-xl sm:text-2xl" : ""}
        ${isTF && !compact ? "min-h-[4.5rem] justify-center py-8 sm:min-h-[5.5rem] sm:py-12" : ""}
        ${isTF && compact ? "min-h-[3rem] justify-center py-4 landscapePhone:min-h-[2.75rem] landscapePhone:py-3" : ""}
        ${dim} ${ring} ${disabled ? "cursor-default" : "active:translate-y-1 hover:brightness-105"}`}
      style={{ backgroundColor: s.color }}
      aria-pressed={selected}
    >
      {isTF ? (
        <span className="answer-tile__icon text-4xl sm:text-5xl">{s.glyph}</span>
      ) : (
        <span className={`answer-tile__icon flex shrink-0 items-center justify-center ${compact ? "h-7 w-7" : big ? "h-10 w-10" : "h-10 w-10"}`}>
          <Shape type={s.shape} size={compact ? 24 : big ? 38 : 30} />
        </span>
      )}
      <span
        className={`answer-tile__label leading-tight drop-shadow ${isTF ? "answer-tile__label--tf text-3xl sm:text-4xl" : "flex-1 text-left"}`}
      >
        {text}
      </span>

      {revealed && correct && <span className="ml-2 text-3xl">✓</span>}
      {revealed && !correct && selected && <span className="ml-2 text-3xl">✕</span>}

      {count !== null && (
        <span className="ml-auto rounded-full bg-black/25 px-3 py-1 text-base tabular-nums">
          {count}
        </span>
      )}
    </motion.button>
  );
}
