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
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-xl font-bold ring-1 landscapePhone:gap-2 landscapePhone:px-3 landscapePhone:py-2 landscapePhone:text-base ${
                mine
                  ? "bg-gradient-to-r from-brand-start/40 to-brand-mid/40 ring-brand-mid"
                  : "bg-surface-elevated ring-blue-200"
              }`}
            >
              <span className="w-8 shrink-0 text-center text-2xl landscapePhone:w-6 landscapePhone:text-lg">
                {rank <= 3 ? medal[rank - 1] : <span className="text-muted">{rank}</span>}
              </span>
              <Avatar config={p.character} size={40} ring />
              <span className="min-w-0 flex-1 truncate landscapePhone:text-sm">
                {p.nick}
                {mine && <span className="ml-2 text-sm text-brand-end">you</span>}
              </span>
              <span className="tabular-nums text-ink-900">{p.score.toLocaleString()}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {rows.length === 0 && <p className="text-center text-muted">No scores yet.</p>}
    </div>
  );
}
