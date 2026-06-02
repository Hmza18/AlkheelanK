import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./characters.jsx";

const medal = ["🥇", "🥈", "🥉"];

// Animated standings. Rows slide/reorder via layout animation for that
// satisfying "climbing the ranks" feel between questions. Each row shows the
// player's chosen character avatar.
export default function Leaderboard({ entries = [], highlightId = null, max = 8 }) {
  const rows = entries.slice(0, max);
  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {rows.map((p, i) => {
          const mine = p.id === highlightId;
          const rank = p.rank ?? i + 1;
          return (
            <motion.div
              key={p.id ?? p.nick}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-xl font-bold ring-1 ${
                mine
                  ? "bg-gradient-to-r from-brand-start/40 to-brand-mid/40 ring-brand-mid"
                  : "bg-ink-700/70 ring-white/10"
              }`}
            >
              <span className="w-8 text-center text-2xl">
                {rank <= 3 ? medal[rank - 1] : <span className="text-muted">{rank}</span>}
              </span>
              <Avatar config={p.character} size={40} ring />
              <span className="flex-1 truncate">
                {p.nick}
                {mine && <span className="ml-2 text-sm text-brand-end">you</span>}
              </span>
              <span className="tabular-nums text-paper">{p.score.toLocaleString()}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {rows.length === 0 && <p className="text-center text-muted">No scores yet.</p>}
    </div>
  );
}
