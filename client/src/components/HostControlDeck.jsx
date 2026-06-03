import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { copy } from "../lib/copy.js";
import { sfx } from "../lib/sound.js";

const PACING_OPTIONS = [
  { id: "quick", label: copy.host.pacing.quick, hint: copy.host.pacing.quickHint },
  { id: "normal", label: copy.host.pacing.normal, hint: copy.host.pacing.normalHint },
  { id: "cinematic", label: copy.host.pacing.cinematic, hint: copy.host.pacing.cinematicHint },
];

export default function HostControlDeck({
  phase,
  pacing = "normal",
  paused,
  onPacing,
  onPause,
  onResume,
  onSkipReveal,
  onSkipQuestion,
  visible = true,
  wrapperClassName = "",
  panelAnchor = "above",
}) {
  const [open, setOpen] = useState(false);

  if (!visible || !["question", "reveal", "standings"].includes(phase)) return null;

  const showQuestionControls = phase === "question";
  const showRevealControls = phase === "reveal";

  const wrapperPos =
    panelAnchor === "below"
      ? "relative flex flex-col items-end gap-2"
      : "fixed bottom-[max(5rem,env(safe-area-inset-bottom,0px)+4rem)] right-[max(1rem,env(safe-area-inset-right))] z-40 flex flex-col items-end gap-2";

  const panelMotion =
    panelAnchor === "below"
      ? { initial: { opacity: 0, y: -8, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -6, scale: 0.98 } }
      : { initial: { opacity: 0, y: 8, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 6, scale: 0.98 } };

  return (
    <div className={`${wrapperPos} ${wrapperClassName}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            {...panelMotion}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-ink-800/95 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-md ${
              panelAnchor === "below" ? "absolute right-0 top-full z-50 mt-2" : ""
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              {copy.host.pacing.label}
            </p>
            <div className="mt-2 flex gap-1.5">
              {PACING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.hint}
                  onClick={() => {
                    sfx.tap();
                    onPacing?.(opt.id);
                  }}
                  className={`min-h-touch flex-1 rounded-xl px-2 py-2.5 text-sm font-bold ring-1 transition ${
                    pacing === opt.id
                      ? "bg-brand-mid/25 ring-brand-mid text-paper"
                      : "bg-ink-700 ring-white/10 text-muted hover:text-paper"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {showQuestionControls && (
              <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    sfx.tap();
                    paused ? onResume?.() : onPause?.();
                  }}
                  className="alkheelank-btn-ghost w-full py-3 text-base"
                >
                  {paused ? copy.host.resume : copy.host.pause}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.confirm?.();
                    onSkipQuestion?.();
                  }}
                  className="alkheelank-btn-ghost w-full py-3 text-base"
                >
                  {copy.host.skipResults}
                </button>
              </div>
            )}

            {showRevealControls && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    sfx.tap();
                    onSkipReveal?.();
                  }}
                  className="alkheelank-btn-ghost w-full py-3 text-base"
                >
                  {copy.host.skipReveal}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          sfx.tap();
          setOpen((v) => !v);
        }}
        className="alkheelank-touch-target h-12 w-12 rounded-2xl bg-ink-800/90 text-lg ring-1 ring-white/10 backdrop-blur transition hover:bg-ink-700"
        aria-expanded={open}
        title="Show controls"
      >
        🎛️
      </button>
    </div>
  );
}
