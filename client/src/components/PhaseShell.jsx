import { AnimatePresence, motion } from "framer-motion";
import { phaseTransition } from "../lib/motion.js";

/** Wraps host/player phase content with consistent enter/exit motion. */
export default function PhaseShell({ phaseKey, children, className = "" }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        initial={phaseTransition.initial}
        animate={phaseTransition.animate}
        exit={phaseTransition.exit}
        transition={phaseTransition.transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
