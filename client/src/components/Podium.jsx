import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { sfx } from "../lib/sound.js";
import Avatar from "./characters.jsx";

const COLORS = ["#fbbf24", "#cbd5e1", "#f59e0b"]; // gold, silver, bronze
const ORDER = [1, 0, 2]; // render 2nd, 1st, 3rd left→right
const HEIGHTS = ["h-72", "h-56", "h-40"]; // by place index (1st tallest)
const MEDALS = ["🥇", "🥈", "🥉"];
const PLACE_WORDS = ["First place", "Second place", "Third place"];

const BEAT_MS = 1500; // pause between each reveal — let it breathe

// Dramatic built-up podium. We announce 3rd, then 2nd, then 1st, each with a
// beat and an entrance. Confetti fires on 1st. `onComplete` lets the parent
// reveal the full ranked list once the top 3 are up. Avatars render straight
// from each winner's stored config object.
export default function Podium({ podium = [], sound = true, onComplete }) {
  // Reveal sequence: bottom-up (3rd → 2nd → 1st), skipping empty places.
  const sequence = [2, 1, 0].filter((i) => podium[i]);
  const [shownCount, setShownCount] = useState(0);
  const [announce, setAnnounce] = useState(null);

  const shownPlaces = new Set(sequence.slice(0, shownCount));

  useEffect(() => {
    const timers = [];
    sequence.forEach((placeIdx, step) => {
      timers.push(
        setTimeout(() => {
          setShownCount(step + 1);
          setAnnounce(placeIdx);
          if (placeIdx === 0) {
            // Winner! Confetti + a fanfare, then hand back to the parent.
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
        }, 600 + step * BEAT_MS)
      );
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slots = ORDER.map((placeIdx) => ({ placeIdx, player: podium[placeIdx] })).filter(
    (s) => s.player
  );

  return (
    <div className="flex w-full flex-col items-center">
      {/* Announcement banner for the place currently being revealed */}
      <div className="mb-6 h-12">
        <AnimatePresence mode="wait">
          {announce !== null && (
            <motion.div
              key={announce}
              initial={{ scale: 0.6, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 16 }}
              className="font-display text-3xl font-bold alkheelank-gradient-text sm:text-4xl"
            >
              {announce === 0 ? "🏆 " : ""}
              {PLACE_WORDS[announce]}
              {announce === 0 ? " 🏆" : ""}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex w-full items-end justify-center gap-3 sm:gap-6">
        {slots.map(({ placeIdx, player }) => {
          const shown = shownPlaces.has(placeIdx);
          // Always reserve the block footprint so the layout doesn't jump as
          // each winner rises into place; the content fades/rises in when shown.
          return (
            <div key={player.id ?? player.nick} className="flex w-28 flex-col items-center sm:w-44">
              {shown ? (
                <motion.div
                  initial={{ y: 220, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 130, damping: 14 }}
                  className="flex w-full flex-col items-center"
                >
                  <div className="mb-3 flex flex-col items-center text-center">
                    <motion.div
                      animate={placeIdx === 0 ? { scale: [1, 1.12, 1] } : {}}
                      transition={{ duration: 0.6, repeat: placeIdx === 0 ? Infinity : 0, repeatDelay: 1.2 }}
                    >
                      <Avatar config={player.character} size={placeIdx === 0 ? 84 : 64} ring />
                    </motion.div>
                    <div className="mt-1 text-3xl">{MEDALS[placeIdx]}</div>
                    <div className="max-w-full truncate text-xl font-bold text-paper sm:text-2xl">
                      {player.nick}
                    </div>
                    <div className="font-display text-2xl font-bold alkheelank-gradient-text tabular-nums">
                      {player.score.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`flex w-full items-start justify-center rounded-t-2xl ${HEIGHTS[placeIdx]} pt-3 font-display text-4xl font-bold text-ink-900`}
                    style={{
                      background: `linear-gradient(180deg, ${COLORS[placeIdx]}, ${COLORS[placeIdx]}aa)`,
                    }}
                  >
                    {placeIdx + 1}
                  </div>
                </motion.div>
              ) : (
                <div className={`w-full ${HEIGHTS[placeIdx]}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
