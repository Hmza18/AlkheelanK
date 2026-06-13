import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tileStyle } from "../lib/answers.js";
import { copy } from "../lib/copy.js";
import { spring, useReducedMotion, motionSafe } from "../lib/motion.js";
import { sfx } from "../lib/sound.js";
import Avatar from "./characters.jsx";
import SocialMoment from "./SocialMoment.jsx";

const STAGE_MAP = { bars: 0, highlight: 1, avatars: 2 };
const MAX_VISIBLE_AVATARS = 5;

const DEFAULT_TIMING = {
  barMs: 950,
  highlightMs: 400,
  barStagger: 0.08,
  avatarDelay: 0.09,
};

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function CountUp({ value, delay = 0, duration = 0.8, reduced }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    if (value <= 0) return undefined;
    if (reduced) { setDisplay(value); return undefined; }

    let frame;
    const startAt = performance.now() + delay * 1000;
    const tick = (now) => {
      if (now < startAt) { frame = requestAnimationFrame(tick); return; }
      const p = Math.min(1, (now - startAt) / (duration * 1000));
      setDisplay(Math.round(value * easeOutCubic(p)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delay, duration, reduced]);

  return <span className="tabular-nums">{display}</span>;
}

/** Mini avatar stack that floats to the right of the correct bar */
function BarAvatars({ players, show, reduced }) {
  const list = players || [];
  const visible = list.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = list.length - visible.length;

  if (!show || list.length === 0) return null;

  return (
    <div className="absolute right-[-2.75rem] top-0 flex flex-col items-center gap-1 landscapePhone:right-[-2.1rem]">
      {visible.map((p, i) => (
        <motion.div
          key={p.id}
          initial={reduced ? false : { scale: 0, x: 12, opacity: 0 }}
          animate={{ scale: 1, x: 0, opacity: 1 }}
          transition={motionSafe(
            { type: "spring", stiffness: 360, damping: 22, delay: 0.12 + i * 0.07 },
            reduced
          )}
          className="flex flex-col items-center"
          title={p.nick}
        >
          <Avatar config={p.character} size={32} ring />
        </motion.div>
      ))}
      {overflow > 0 && (
        <motion.span
          initial={reduced ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={motionSafe({ ...spring.bouncy, delay: 0.12 + visible.length * 0.07 }, reduced)}
          className="mt-0.5 rounded-full bg-surface-muted/90 px-1.5 py-0.5 text-[9px] font-extrabold text-ink-900 ring-1 ring-brand-mid/60"
        >
          +{overflow}
        </motion.span>
      )}
    </div>
  );
}

/** Name list below correct bar */
function CorrectNames({ players, show, reduced }) {
  const list = players || [];
  const visible = list.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = list.length - visible.length;

  if (!show) return <div className="mt-3 h-[72px] landscapePhone:mt-1 landscapePhone:h-10" aria-hidden />;
  if (list.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-3 min-h-[72px] text-sm font-semibold text-muted landscapePhone:mt-1 landscapePhone:min-h-10 landscapePhone:text-xs"
      >
        {copy.reveal.nobody}
      </motion.p>
    );
  }

  return (
    <div className="mt-3 flex min-h-[72px] flex-wrap items-start justify-center gap-2 landscapePhone:mt-1 landscapePhone:min-h-10 landscapePhone:gap-1">
      {visible.map((p, i) => (
        <motion.div
          key={p.id}
          initial={reduced ? false : { scale: 0, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={motionSafe({ type: "spring", stiffness: 320, damping: 22, delay: i * 0.07 }, reduced)}
          className="flex flex-col items-center gap-0.5"
        >
          <Avatar config={p.character} size={44} ring />
          <span className="max-w-[4rem] truncate text-[10px] font-bold text-ink-900/90">{p.nick}</span>
        </motion.div>
      ))}
      {overflow > 0 && (
        <motion.span
          initial={reduced ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="self-center rounded-full bg-surface-elevated px-3 py-2 text-sm font-extrabold text-ink-900 ring-2 ring-brand-mid/50"
        >
          +{overflow}
        </motion.span>
      )}
    </div>
  );
}

function RevealColumn({ index, type, count, maxCount, isCorrect, stage, correctPlayers, timing, reduced }) {
  const s = tileStyle(type, index);
  const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const dim = stage < STAGE_MAP.highlight && !isCorrect;
  const pop = stage >= STAGE_MAP.highlight && isCorrect;
  const showAvatars = stage >= STAGE_MAP.avatars;

  return (
    <motion.div
      className="flex flex-col items-center"
      animate={{
        scale: pop ? 1.05 : dim ? 0.92 : 1,
        opacity: dim ? 0.32 : 1,
      }}
      transition={motionSafe({ type: "spring", stiffness: 200, damping: 22 }, reduced)}
    >
      {/* bar */}
      <div className="relative flex h-48 w-full items-end justify-center sm:h-56">
        {/* glow pulse behind correct bar */}
        {pop && !reduced && (
          <motion.span
            className="pointer-events-none absolute bottom-2 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-brand-mid/25"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.9, 1.45, 1.15], opacity: [0.55, 0.18, 0.32] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        )}

        {/* the bar itself */}
        <motion.div
          className="relative z-10 w-[76%] max-w-[110px] rounded-t-2xl shadow-tile-sm ring-1 ring-paper/12"
          style={{ backgroundColor: s.color }}
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: `${Math.max(count > 0 ? 10 : 0, barPct)}%`,
            opacity: 1,
          }}
          transition={motionSafe(
            { type: "spring", stiffness: 110, damping: 16, delay: index * timing.barStagger },
            reduced
          )}
        >
          {/* mini avatars floating on the right edge of the correct bar */}
          {isCorrect && (
            <BarAvatars players={correctPlayers} show={showAvatars} reduced={reduced} />
          )}
        </motion.div>
      </div>

      {/* answer label + count */}
      <motion.div
        className={`relative z-10 mt-3 flex w-full max-w-[190px] items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-base font-bold text-ink-900 shadow-tile landscapePhone:mt-1.5 landscapePhone:py-2 landscapePhone:text-sm ${
          pop ? "ring-4 ring-paper shadow-glow" : ""
        }`}
        style={{ backgroundColor: s.color }}
        animate={pop && !reduced ? { y: [0, -5, 0] } : { y: 0 }}
        transition={pop ? { duration: 0.6, ease: "easeOut", repeat: 1 } : undefined}
      >
        <span className="text-xl landscapePhone:text-lg">{s.glyph}</span>
        <CountUp
          value={count}
          delay={index * timing.barStagger}
          duration={reduced ? 0 : 0.85}
          reduced={reduced}
        />
        {pop && (
          <motion.span
            initial={reduced ? false : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={motionSafe({ type: "spring", stiffness: 400, damping: 20 }, reduced)}
            className="text-xl landscapePhone:text-base"
          >
            ✓
          </motion.span>
        )}
      </motion.div>

      {/* full avatar + name row below, only for correct column */}
      {isCorrect ? (
        <CorrectNames players={correctPlayers} show={showAvatars} reduced={reduced} />
      ) : (
        <div className="mt-3 h-[72px] landscapePhone:mt-1 landscapePhone:h-10" aria-hidden />
      )}
    </motion.div>
  );
}

function stageFromReveal(reveal) {
  const n = reveal?.revealStage ?? 0;
  if (n >= 2) return "avatars";
  if (n >= 1) return "highlight";
  return "bars";
}

export default function SocialReveal({ question, image, reveal, onStandings, externalStage }) {
  const reduced = useReducedMotion();
  const timing = reveal?.timing || DEFAULT_TIMING;
  const [localStage, setLocalStage] = useState("bars");
  const stage = externalStage ?? localStage;
  const stageNum = STAGE_MAP[stage] ?? 0;
  const isTF = question.type === "tf";
  const maxCount = Math.max(1, ...reveal.counts);
  const correctPlayers = reveal.correctPlayers || [];

  useEffect(() => {
    if (externalStage != null) return undefined;
    setLocalStage("bars");
    const barMs = reduced ? 80 : timing.barMs;
    const highlightMs = reduced ? 40 : timing.highlightMs;
    const t1 = setTimeout(() => setLocalStage("highlight"), barMs);
    const t2 = setTimeout(() => {
      setLocalStage("avatars");
      if (reveal.highlight) sfx.moment();
    }, barMs + highlightMs);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reveal.index, timing.barMs, timing.highlightMs, externalStage, reduced, reveal.highlight]);

  useEffect(() => {
    if (externalStage) setLocalStage(externalStage);
  }, [externalStage]);

  const showMoment = stageNum >= STAGE_MAP.highlight && reveal.highlight;

  return (
    <div className="host-phase-fill alkheelank-screen-host mx-auto flex min-h-0 flex-col items-center overflow-x-hidden">
      <header className="w-full max-w-3xl shrink-0 text-center landscapePhone:max-w-none">
        {image && (
          <img
            src={image}
            alt=""
            className="mx-auto mb-4 hidden h-20 w-20 rounded-xl object-cover ring-1 ring-blue-200 sm:block landscapePhone:mb-2 landscapePhone:h-12 landscapePhone:w-12"
          />
        )}
        <h1 className="alkheelank-heading text-3xl landscapePhone:text-xl landscapePhone:leading-snug sm:text-5xl landscapePhone:sm:text-xl">
          {question.question}
        </h1>
        {reveal.doublePoints && (
          <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-brand-mid/25 px-5 py-2 text-lg font-extrabold text-ink-900 ring-1 ring-brand-mid landscapePhone:mt-1 landscapePhone:px-3 landscapePhone:py-1 landscapePhone:text-sm">
            ⚡ {copy.reveal.doublePoints}
          </div>
        )}
      </header>

      <SocialMoment highlight={reveal.highlight} show={showMoment} />

      {/* key on reveal.index so bars fully unmount+remount between questions — fixes spacing bug */}
      <div
        key={reveal.index}
        className={`mt-8 w-full max-w-3xl landscapePhone:mt-3 landscapePhone:max-w-none ${
          isTF
            ? "grid grid-cols-2 gap-8 sm:gap-10 landscapePhone:gap-4"
            : "grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-7 landscapePhone:gap-3"
        }`}
      >
        {question.answers.map((_, i) => (
          <RevealColumn
            key={i}
            index={i}
            type={question.type}
            count={reveal.counts[i]}
            maxCount={maxCount}
            isCorrect={i === reveal.correctIndex}
            stage={stageNum}
            correctPlayers={i === reveal.correctIndex ? correctPlayers : null}
            timing={timing}
            reduced={reduced}
          />
        ))}
      </div>

      {reveal.mode === "teams" && reveal.teamStandings?.length > 0 && (
        <div className="mt-8 w-full max-w-2xl landscapePhone:mt-3">
          <h3 className="alkheelank-heading mb-3 text-center text-2xl text-muted landscapePhone:mb-1 landscapePhone:text-lg">
            Team scores
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {reveal.teamStandings.map((t) => (
              <div key={t.id} className="rounded-xl bg-surface-muted px-4 py-3 ring-1 ring-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: t.color }}>
                    {t.rank}. {t.name}
                  </span>
                  <span className="font-display text-2xl tabular-nums">{t.score.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-6 mt-auto flex w-full max-w-3xl shrink-0 justify-center pt-10 landscapePhone:bottom-2 landscapePhone:pt-4">
        <button
          type="button"
          onClick={onStandings}
          className="alkheelank-btn-primary px-16 text-2xl landscapePhone:px-8 landscapePhone:py-3 landscapePhone:text-lg"
        >
          {copy.reveal.standingsCta} →
        </button>
      </div>
    </div>
  );
}

/** Map server revealStage (0–2) to stage name for synced skips. */
export function revealStageName(revealStage) {
  if (revealStage >= 2) return "avatars";
  if (revealStage >= 1) return "highlight";
  return "bars";
}
