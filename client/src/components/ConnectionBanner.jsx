import { motion, AnimatePresence } from "framer-motion";
import { spring } from "../lib/motion.js";

export function HostRecoveredBanner({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={spring.snappy}
          className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 -translate-x-1/2 rounded-2xl bg-tile-square/20 px-5 py-3 text-center font-semibold text-paper ring-1 ring-tile-square/40 backdrop-blur-md"
          role="status"
        >
          You're back — room restored.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function HostStatusBanner({ connected, forPlayer }) {
  const show = connected === false;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={spring.default}
          className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-50 mx-auto max-w-md rounded-2xl bg-warning/15 px-4 py-3 text-center text-sm font-bold text-paper ring-1 ring-warning/35 backdrop-blur-md"
          role="alert"
        >
          {forPlayer ? "Host stepped away — hang tight." : "Connection hiccup — players still see the game."}
        </motion.div>
      )}
      {connected === true && forPlayer && (
        <motion.div
          key="back"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={spring.default}
          className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-50 mx-auto max-w-md rounded-2xl bg-tile-square/20 px-4 py-3 text-center text-sm font-bold text-paper ring-1 ring-tile-square/40 backdrop-blur-md"
          role="status"
        >
          Host is back on deck.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PlayerReconnectBanner({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mb-3 rounded-xl bg-tile-square/15 px-3 py-2 text-center text-sm font-semibold text-tile-square ring-1 ring-tile-square/30"
          role="status"
        >
          Back in — your score is safe.
        </motion.p>
      )}
    </AnimatePresence>
  );
}
