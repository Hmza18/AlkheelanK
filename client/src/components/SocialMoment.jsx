import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./characters.jsx";
import { spring, stagger } from "../lib/motion.js";

export default function SocialMoment({ highlight, show }) {
  if (!highlight?.player) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ ...spring.bouncy, delay: stagger.relaxed }}
          className="mx-auto mt-6 flex w-full max-w-md items-center gap-4 rounded-2xl bg-gradient-to-r from-brand-start/20 via-brand-mid/15 to-brand-end/20 px-5 py-4 ring-1 ring-brand-mid/40"
        >
          <Avatar config={highlight.player.character} size={56} ring />
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-end">
              {highlight.title}
            </p>
            <p className="truncate font-display text-xl font-bold text-paper">
              {highlight.player.nick}
            </p>
            <p className="text-sm text-muted">{highlight.subtitle}</p>
          </div>
          <motion.span
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={spring.snappy}
            className="text-3xl"
            aria-hidden
          >
            {highlight.key === "clutch_answer" ? "🎯" : "⚡"}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
