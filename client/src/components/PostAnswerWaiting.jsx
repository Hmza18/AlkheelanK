import { useMemo } from "react";
import { motion } from "framer-motion";
import Avatar from "./characters.jsx";
import { tileStyle } from "../lib/answers.js";
import { pickWaitingMessage } from "../lib/waitingMessages.js";
import { copy } from "../lib/copy.js";
import { useReducedMotion } from "../lib/motion.js";

export default function PostAnswerWaiting({
  me,
  question,
  selected,
  waitContext,
  paused,
}) {
  const reduced = useReducedMotion();
  const message = useMemo(
    () => pickWaitingMessage(waitContext, question?.index ?? 0),
    [waitContext, question?.index]
  );
  const tile = selected !== null && question ? tileStyle(question.type, selected) : null;

  return (
    <div className="alkheelank-screen-player relative flex min-h-screen flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="alkheelank-card relative w-full overflow-hidden p-8"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124, 58, 237, 0.35), transparent 70%)",
          }}
        />

        <motion.div
          className="relative mx-auto flex justify-center"
          animate={reduced ? {} : { y: [0, -10, 0, -6, 0] }}
          transition={{ duration: 2.4, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0 m-auto h-28 w-28 rounded-full bg-brand-mid/25"
            animate={reduced ? { opacity: 0.5 } : { scale: [1, 1.12, 1], opacity: [0.45, 0.75, 0.45] }}
            transition={{ duration: 1.8, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
          />
          <Avatar config={me?.character} size={112} ring />
        </motion.div>

        {tile && (
          <motion.div
            initial={{ scale: 0.5, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.08 }}
            className="mx-auto mt-5 grid h-14 w-14 place-items-center rounded-2xl text-3xl shadow-tile ring-2 ring-paper/20"
            style={{ backgroundColor: tile.color }}
          >
            {tile.glyph}
          </motion.div>
        )}

        {question?.image && (
          <motion.img
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            src={question.image}
            alt=""
            className="relative mx-auto mt-5 max-h-32 w-auto rounded-xl object-contain shadow-lg ring-1 ring-white/10"
          />
        )}

        <motion.p
          key={message}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.12 }}
          className="alkheelank-wait-shimmer mt-6 font-display text-2xl font-bold leading-snug"
        >
          {message}
        </motion.p>

        <p className="mt-3 text-sm font-semibold text-muted">
          Q{(question?.index ?? 0) + 1} / {question?.total ?? "?"}
          {waitContext?.answeredSoFar > 1
            ? ` · ${waitContext.answeredSoFar} in so far`
            : " · waiting on everyone else"}
        </p>

        <div className="mt-6 flex items-center justify-center gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-brand-mid"
              animate={{ opacity: [0.35, 1, 0.35], y: [0, -5, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>

      <motion.p
        className="mt-5 text-xs font-bold uppercase tracking-widest text-muted"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {copy.player.revealSoon}
      </motion.p>

      {paused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-ink-900/85 backdrop-blur-sm"
        >
          <div className="text-6xl">⏸</div>
          <h2 className="mt-4 alkheelank-heading text-3xl">{copy.player.paused}</h2>
        </motion.div>
      )}
    </div>
  );
}
