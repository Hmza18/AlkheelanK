import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { sfx } from "../lib/sound.js";
import { useReducedMotion } from "../lib/motion.js";
import Avatar from "./characters.jsx";

const COLORS = ["#fbbf24", "#cbd5e1", "#f59e0b"]; // gold, silver, bronze
const ORDER = [1, 0, 2]; // render 2nd, 1st, 3rd left→right
const HEIGHTS = ["h-72 landscapePhone:h-24", "h-56 landscapePhone:h-20", "h-40 landscapePhone:h-16"]; // by place index (1st tallest)
const MEDALS = ["🥇", "🥈", "🥉"];
const PLACE_WORDS = ["First place", "Second place", "Third place"];
const TEASERS = ["Third place…", "Second place…", "And the winner is…"];

const PAUSE_AFTER_MS = 900;
const START_DELAY_MS = 500;
const DRUM_MS = { 2: 1100, 1: 1400, 0: 2400 }; // by place index — longest before 1st

// Dramatic built-up podium. Drum roll → reveal 3rd → drum roll → 2nd → drum roll → 1st.
// Confetti fires on 1st. `onComplete` lets the parent reveal the full ranked list once
// the top 3 are up. Avatars render straight from each winner's stored config object.
// `instant` renders the finished podium with no drum roll and never fires
// `onComplete` — used when the host navigates back after the reveal already played.
export default function Podium({ podium = [], sound = true, onComplete, instant = false }) {
  const reduced = useReducedMotion();
  const sequence = [2, 1, 0].filter((i) => podium[i]);
  const [shownCount, setShownCount] = useState(instant ? sequence.length : 0);
  const [announce, setAnnounce] = useState(instant ? 0 : null);
  const [pendingPlace, setPendingPlace] = useState(null);

  const shownPlaces = new Set(sequence.slice(0, shownCount));
  const drumRolling = pendingPlace !== null && !shownPlaces.has(pendingPlace);

  useEffect(() => {
    if (instant) return undefined; // already revealed — skip the sequence entirely
    const timers = [];
    let cancelled = false;

    const revealPlace = (placeIdx, step) => {
      setPendingPlace(null);
      setShownCount(step + 1);
      setAnnounce(placeIdx);
      if (placeIdx === 0) {
        if (sound) sfx.podium();
        confetti({ particleCount: 180, spread: 100, origin: { y: 0.55 } });
        const end = Date.now() + 2400;
        const frame = () => {
          confetti({ particleCount: 5, angle: 60, spread: 65, origin: { x: 0 } });
          confetti({ particleCount: 5, angle: 120, spread: 65, origin: { x: 1 } });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
        timers.push(setTimeout(() => onComplete?.(), 900));
      } else if (sound) {
        sfx.reveal();
      }
    };

    const runStep = (step) => {
      if (cancelled || step >= sequence.length) return;
      const placeIdx = sequence[step];
      const drumMs = reduced ? 0 : DRUM_MS[placeIdx] ?? 1200;

      if (drumMs > 0) {
        setPendingPlace(placeIdx);
        setAnnounce(null);
        if (sound) sfx.drumRoll({ durationMs: drumMs, intense: placeIdx === 0 });
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            revealPlace(placeIdx, step);
            if (step + 1 < sequence.length) {
              timers.push(setTimeout(() => runStep(step + 1), PAUSE_AFTER_MS));
            }
          }, drumMs)
        );
      } else {
        revealPlace(placeIdx, step);
        if (step + 1 < sequence.length) {
          timers.push(setTimeout(() => runStep(step + 1), PAUSE_AFTER_MS));
        }
      }
    };

    timers.push(setTimeout(() => runStep(0), START_DELAY_MS));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slots = ORDER.map((placeIdx) => ({ placeIdx, player: podium[placeIdx] })).filter(
    (s) => s.player
  );

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-6 h-14 landscapePhone:mb-2 landscapePhone:h-10">
        <AnimatePresence mode="wait">
          {drumRolling && pendingPlace !== null ? (
            <motion.div
              key={`drum-${pendingPlace}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-1"
            >
              <motion.span
                animate={reduced ? {} : { scale: [1, 1.08, 1] }}
                transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl landscapePhone:text-xl"
                aria-hidden
              >
                🥁
              </motion.span>
              <motion.p
                animate={reduced ? {} : { opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                className="font-display text-2xl font-bold text-muted sm:text-3xl landscapePhone:text-base landscapePhone:sm:text-base"
              >
                {TEASERS[pendingPlace]}
              </motion.p>
            </motion.div>
          ) : announce !== null ? (
            <motion.div
              key={announce}
              initial={{ scale: 0.6, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 16 }}
              className="font-display text-3xl font-bold alkheelank-gradient-text sm:text-4xl landscapePhone:text-lg landscapePhone:sm:text-lg"
            >
              {announce === 0 ? "🏆 " : ""}
              {PLACE_WORDS[announce]}
              {announce === 0 ? " 🏆" : ""}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex w-full items-end justify-center gap-3 sm:gap-6 landscapePhone:gap-2">
        {slots.map(({ placeIdx, player }) => {
          const shown = shownPlaces.has(placeIdx);
          const pending = pendingPlace === placeIdx;
          return (
            <div key={player.id ?? player.nick} className="flex w-28 flex-col items-center sm:w-44 landscapePhone:w-20 landscapePhone:sm:w-24">
              {shown ? (
                <motion.div
                  initial={{ y: 220, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 130, damping: 14 }}
                  className="flex w-full flex-col items-center"
                >
                  <div className="mb-3 flex flex-col items-center text-center landscapePhone:mb-1">
                    <motion.div
                      animate={placeIdx === 0 ? { scale: [1, 1.12, 1] } : {}}
                      transition={{ duration: 0.6, repeat: placeIdx === 0 ? Infinity : 0, repeatDelay: 1.2 }}
                    >
                      <Avatar config={player.character} size={placeIdx === 0 ? 84 : 64} ring className="landscapePhone:hidden" />
                      <span className="hidden landscapePhone:inline-flex">
                        <Avatar config={player.character} size={placeIdx === 0 ? 48 : 40} ring />
                      </span>
                    </motion.div>
                    <div className="mt-1 text-3xl landscapePhone:text-lg">{MEDALS[placeIdx]}</div>
                    <div className="max-w-full truncate text-xl font-bold text-ink-900 sm:text-2xl landscapePhone:text-sm landscapePhone:sm:text-sm">
                      {player.nick}
                    </div>
                    <div className="font-display text-2xl font-bold alkheelank-gradient-text tabular-nums landscapePhone:text-base">
                      {player.score.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`flex w-full items-start justify-center rounded-t-2xl pt-3 font-display text-4xl font-bold text-ink-900 landscapePhone:rounded-t-xl landscapePhone:pt-1 landscapePhone:text-2xl ${HEIGHTS[placeIdx]}`}
                    style={{
                      background: `linear-gradient(180deg, ${COLORS[placeIdx]}, ${COLORS[placeIdx]}aa)`,
                    }}
                  >
                    {placeIdx + 1}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  animate={
                    pending && !reduced
                      ? { scale: [1, 1.03, 1], opacity: [0.35, 0.7, 0.35] }
                      : { opacity: 0.25 }
                  }
                  transition={
                    pending && !reduced
                      ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.2 }
                  }
                  className={`w-full rounded-t-2xl bg-surface-muted landscapePhone:rounded-t-xl ${HEIGHTS[placeIdx]}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
