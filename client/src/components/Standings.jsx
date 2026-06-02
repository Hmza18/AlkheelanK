import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./characters.jsx";
import { spring, useReducedMotion, motionSafe } from "../lib/motion.js";

const medal = ["🥇", "🥈", "🥉"];

// A single movement indicator: ▲ up, ▼ down, or — held. `delta` is
// (prevRank - rank): positive means the player climbed.
function Movement({ delta }) {
  if (!delta) {
    return <span className="text-sm font-bold text-muted">—</span>;
  }
  const up = delta > 0;
  return (
    <motion.span
      initial={{ y: up ? 6 : -6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 18 }}
      className={`flex items-center gap-0.5 text-sm font-extrabold ${
        up ? "text-tile-square" : "text-tile-triangle"
      }`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </motion.span>
  );
}

// Host between-question scoreboard. Rows reorder with a layout animation so rank
// changes feel dramatic — the "one more round" hook. Avatars render straight
// from each player's stored config object.
export default function Standings({ standings = [], highlightId = null, max = 8 }) {
  const rows = standings.slice(0, max);
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {rows.map((p) => {
          const mine = p.id === highlightId;
          const rank = p.rank;
          return (
            <motion.div
              key={p.id ?? p.nick}
              layout
              initial={reduced ? false : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={motionSafe({ layout: spring.bouncy }, reduced)}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-xl font-bold ring-1 ${
                mine
                  ? "bg-gradient-to-r from-brand-start/40 to-brand-mid/40 ring-brand-mid"
                  : "bg-ink-700/70 ring-white/10"
              } ${p.connected === false ? "opacity-60" : ""}`}
            >
              <span className="w-9 text-center text-2xl">
                {rank <= 3 ? medal[rank - 1] : <span className="text-muted">{rank}</span>}
              </span>
              <Avatar config={p.character} size={44} ring />
              <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                {p.nick}
                {p.connected === false && (
                  <span className="rounded-full bg-ink-900/50 px-2 py-0.5 text-xs font-semibold text-muted">
                    away
                  </span>
                )}
                {mine && <span className="text-sm text-brand-end">you</span>}
              </span>
              <Movement delta={p.delta} />
              <span className="w-24 text-right tabular-nums text-paper">
                {p.score.toLocaleString()}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {rows.length === 0 && <p className="text-center text-muted">No scores yet.</p>}
    </div>
  );
}
