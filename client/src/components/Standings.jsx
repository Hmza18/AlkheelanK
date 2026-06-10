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
export default function Standings({ standings = [], highlightId = null, max = 8, compactLandscape = false }) {
  const rows = standings.slice(0, max);
  const reduced = useReducedMotion();
  return (
    <div className={`flex flex-col ${compactLandscape ? "gap-2 landscapePhone:gap-1.5" : "gap-3"}`}>
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
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-xl font-bold ring-1 landscapePhone:gap-2 landscapePhone:px-3 landscapePhone:py-2 landscapePhone:text-base ${
                compactLandscape ? "landscapePhone:rounded-xl" : ""
              } ${
                mine
                  ? "bg-gradient-to-r from-brand-start/40 to-brand-mid/40 ring-brand-mid"
                  : "bg-ink-700/70 ring-white/10"
              } ${p.connected === false ? "opacity-60" : ""}`}
            >
              <span className="w-9 text-center text-2xl landscapePhone:w-7 landscapePhone:text-lg">
                {rank <= 3 ? medal[rank - 1] : <span className="text-muted">{rank}</span>}
              </span>
              <Avatar config={p.character} size={44} ring className="landscapePhone:hidden" />
              <span className="hidden landscapePhone:inline-flex">
                <Avatar config={p.character} size={32} ring />
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2 truncate landscapePhone:gap-1 landscapePhone:text-sm">
                {p.nick}
                {p.connected === false && (
                  <span className="rounded-full bg-ink-900/50 px-2 py-0.5 text-xs font-semibold text-muted landscapePhone:px-1.5 landscapePhone:py-0 landscapePhone:text-[10px]">
                    away
                  </span>
                )}
                {mine && <span className="text-sm text-brand-end landscapePhone:text-xs">you</span>}
              </span>
              <Movement delta={p.delta} />
              <span className="w-24 shrink-0 text-right tabular-nums text-paper landscapePhone:w-16 landscapePhone:text-sm">
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
