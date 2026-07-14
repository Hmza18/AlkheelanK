import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./characters.jsx";
import { spring, useReducedMotion, motionSafe } from "../lib/motion.js";

const medal = ["🥇", "🥈", "🥉"];
// Rank-badge gradients for the host board — gold / silver / bronze, then a
// neutral chip for everyone else.
const RANK_BADGE = [
  "linear-gradient(145deg, #fde68a, #f59e0b)",
  "linear-gradient(145deg, #e2e8f0, #94a3b8)",
  "linear-gradient(145deg, #fcd9b6, #d97706)",
];

// A single movement indicator: ▲ up, ▼ down, or — held. `delta` is
// (prevRank - rank): positive means the player climbed.
function Movement({ delta, big = false }) {
  if (!delta) {
    return <span className={`font-bold text-muted ${big ? "text-base" : "text-sm"}`}>—</span>;
  }
  const up = delta > 0;
  return (
    <motion.span
      initial={{ y: up ? 6 : -6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 18 }}
      className={`flex items-center gap-0.5 font-extrabold ${big ? "text-lg" : "text-sm"} ${
        up ? "text-tile-square" : "text-tile-triangle"
      }`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </motion.span>
  );
}

// Host between-question scoreboard. Rows reorder with a layout animation so rank
// changes feel dramatic — the "one more round" hook. The `host` variant is the
// big-screen board: chunky rows, gold/silver/bronze rank badges, and a relative
// score bar behind each row so the gap between players reads at a glance.
export default function Standings({
  standings = [],
  highlightId = null,
  max = 8,
  compactLandscape = false,
  variant = "default",
}) {
  const rows = standings.slice(0, max);
  const reduced = useReducedMotion();
  const host = variant === "host";
  const topScore = Math.max(1, ...rows.map((p) => p.score || 0));

  return (
    <div className={`flex flex-col ${host ? "gap-3 landscapePhone:gap-2" : compactLandscape ? "gap-2 landscapePhone:gap-1.5" : "gap-3"}`}>
      <AnimatePresence>
        {rows.map((p, i) => {
          const mine = p.id === highlightId;
          const rank = p.rank;
          const isTop3 = rank <= 3;
          const barPct = Math.max(4, Math.round(((p.score || 0) / topScore) * 100));

          if (host) {
            return (
              <motion.div
                key={p.id ?? p.nick}
                layout
                initial={reduced ? false : { opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={motionSafe(
                  { ...spring.default, delay: reduced ? 0 : i * 0.05, layout: spring.bouncy },
                  reduced
                )}
                className={`host-score-row relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3.5 ring-1 landscapePhone:gap-2 landscapePhone:rounded-xl landscapePhone:px-3 landscapePhone:py-2 ${
                  isTop3 ? "ring-brand-mid/40" : "ring-edge"
                } ${p.connected === false ? "opacity-60" : ""}`}
              >
                {/* relative-score fill behind the content */}
                <motion.div
                  className="pointer-events-none absolute inset-y-0 left-0 -z-0"
                  aria-hidden
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ delay: 0.15 + i * 0.05, ...spring.default }}
                  style={{
                    background: isTop3
                      ? "linear-gradient(90deg, rgba(var(--alkheelank-rgb-accent),0.28), rgba(var(--alkheelank-rgb-accent),0.06))"
                      : "linear-gradient(90deg, rgba(var(--alkheelank-rgb-tint),0.14), transparent)",
                  }}
                />
                {/* rank badge */}
                <span
                  className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-xl font-extrabold text-ink-900 shadow-card landscapePhone:h-9 landscapePhone:w-9 landscapePhone:text-base"
                  style={
                    isTop3
                      ? { background: RANK_BADGE[rank - 1], color: "#1a1523" }
                      : { background: "var(--alkheelank-surface-muted)", color: "var(--alkheelank-muted)" }
                  }
                >
                  {isTop3 ? medal[rank - 1] : rank}
                </span>
                <span className="relative z-10 shrink-0">
                  <Avatar config={p.character} size={56} ring className="landscapePhone:hidden" />
                  <span className="hidden landscapePhone:inline-flex">
                    <Avatar config={p.character} size={38} ring />
                  </span>
                </span>
                <span className="relative z-10 flex min-w-0 flex-1 items-center gap-2 truncate font-display text-2xl font-bold text-ink-900 landscapePhone:gap-1 landscapePhone:text-lg">
                  <span className="truncate">{p.nick}</span>
                  {p.connected === false && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-muted landscapePhone:hidden">
                      away
                    </span>
                  )}
                </span>
                <span className="relative z-10">
                  <Movement delta={p.delta} big />
                </span>
                <span className="relative z-10 w-32 shrink-0 text-right font-display text-3xl font-extrabold tabular-nums alkheelank-gradient-text landscapePhone:w-20 landscapePhone:text-xl">
                  {p.score.toLocaleString()}
                </span>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={p.id ?? p.nick}
              layout
              initial={reduced ? false : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              // Stagger the entrance top-to-bottom; rank-change layout moves
              // keep their own spring so reorders stay immediate.
              transition={motionSafe(
                { ...spring.default, delay: reduced ? 0 : i * 0.05, layout: spring.bouncy },
                reduced
              )}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-xl font-bold ring-1 landscapePhone:gap-2 landscapePhone:px-3 landscapePhone:py-2 landscapePhone:text-base ${
                compactLandscape ? "landscapePhone:rounded-xl" : ""
              } ${
                mine
                  ? "bg-brand-gradient-highlight ring-brand-mid"
                  : "bg-surface-muted ring-edge"
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
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-muted landscapePhone:px-1.5 landscapePhone:py-0 landscapePhone:text-[10px]">
                    away
                  </span>
                )}
                {mine && <span className="text-sm text-brand-end landscapePhone:text-xs">you</span>}
              </span>
              <Movement delta={p.delta} />
              <span className="w-24 shrink-0 text-right tabular-nums text-ink-900 landscapePhone:w-16 landscapePhone:text-sm">
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
