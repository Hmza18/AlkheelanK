import { AnimatePresence, motion } from "framer-motion";
import { duration, ease, phaseTransition } from "../lib/motion.js";

/**
 * Wraps host/player phase content with consistent enter/exit motion.
 * `fast` swaps the springy host pacing for a snappy tween — phases on the
 * player's phone change on every tap, so the handoff must stay under ~350ms.
 */
export default function PhaseShell({ phaseKey, children, className = "", fast = false }) {
  const enter = fast ? { duration: duration.fast, ease: ease.out } : phaseTransition.transition;
  const exit = fast
    ? { ...phaseTransition.exit, transition: { duration: duration.instant, ease: ease.out } }
    : phaseTransition.exit;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        initial={phaseTransition.initial}
        animate={phaseTransition.animate}
        exit={exit}
        transition={enter}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
