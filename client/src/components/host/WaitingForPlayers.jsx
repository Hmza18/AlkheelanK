import { motion } from "framer-motion";
import { copy } from "../../lib/copy.js";
import { useReducedMotion } from "../../lib/motion.js";

const RINGS = [0, 1, 2];
const GHOSTS = [
  { x: "-72%", y: "-8%", delay: 0 },
  { x: "68%", y: "-12%", delay: 0.35 },
  { x: "-64%", y: "42%", delay: 0.7 },
  { x: "60%", y: "38%", delay: 1.05 },
];

export default function WaitingForPlayers() {
  const reduced = useReducedMotion();

  return (
    <div className="pregame-waiting" role="status" aria-live="polite">
      <div className="pregame-waiting__stage" aria-hidden="true">
        {RINGS.map((i) => (
          <motion.span
            key={i}
            className="pregame-waiting__ring"
            initial={{ scale: 0.35, opacity: 0.65 }}
            animate={
              reduced
                ? { scale: 1, opacity: 0.25 }
                : { scale: [0.35, 1.35], opacity: [0.55, 0] }
            }
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 0.75 }
            }
          />
        ))}

        <motion.span
          className="pregame-waiting__core"
          animate={reduced ? {} : { scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        >
          <span className="pregame-waiting__core-icon">📲</span>
        </motion.span>

        {GHOSTS.map((g, i) => (
          <motion.span
            key={i}
            className="pregame-waiting__ghost"
            style={{ left: `calc(50% + ${g.x})`, top: `calc(50% + ${g.y})` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              reduced
                ? { scale: 1, opacity: 0.35 }
                : { scale: [0, 1, 0.85, 0], opacity: [0, 0.9, 0.5, 0] }
            }
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: g.delay }
            }
          />
        ))}
      </div>

      <p className="pregame-waiting__label alkheelank-wait-shimmer">{copy.lobby.waiting}</p>
      <p className="pregame-waiting__hint">{copy.lobby.waitingHint}</p>
    </div>
  );
}
