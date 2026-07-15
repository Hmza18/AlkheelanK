import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ANSWERS } from "../lib/answers.js";
import { copy } from "../lib/copy.js";
import { sfx } from "../lib/sound.js";
import { motionSafe, spring, useReducedMotion } from "../lib/motion.js";
import { serverToLocal } from "../socket.js";

const STEPS = ["3", "2", "1", "go"];

/** Kahoot-style beat colors: 3=red, 2=blue, 1=amber, GO=green */
const STEP_COLORS = [
  ANSWERS[0].color,
  ANSWERS[1].color,
  ANSWERS[2].color,
  ANSWERS[3].color,
];

/**
 * Server-synced 3-2-1-GO! shown on host + every phone between "Let's play" and
 * the first question. The current step derives from the server's startedAt, so
 * every screen ticks together and a reconnecting client lands mid-count
 * instead of restarting.
 */
export default function Countdown({ countdown, variant = "player" }) {
  const reduced = useReducedMotion();
  const startedAt = () =>
    typeof countdown?.serverStartedAt === "number"
      ? serverToLocal(countdown.serverStartedAt)
      : countdown?.startedAt ?? Date.now();
  const stepMs = (countdown?.durationMs ?? 3200) / STEPS.length;
  const stepNow = () =>
    Math.min(STEPS.length - 1, Math.max(0, Math.floor((Date.now() - startedAt()) / stepMs)));
  const [step, setStep] = useState(stepNow);
  const lastStepRef = useRef(-1);

  useEffect(() => {
    const tick = () => {
      const s = stepNow();
      if (s === lastStepRef.current) return;
      lastStepRef.current = s;
      setStep(s);
      if (STEPS[s] === "go") sfx.confirm();
      else sfx.tick();
    };
    tick();
    const timer = setInterval(tick, 50);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown?.startedAt, countdown?.serverStartedAt, stepMs]);

  const isGo = STEPS[step] === "go";
  const beatColor = STEP_COLORS[step];
  const label = isGo ? copy.countdown.go : STEPS[step];

  if (reduced) {
    const shellClass =
      variant === "host"
        ? "host-phase-fill alkheelank-screen-host flex flex-col items-center justify-center text-center"
        : "alkheelank-screen-player player-phase-fill flex flex-col items-center justify-center text-center";
    return (
      <div className={shellClass}>
        <p className="alkheelank-label tracking-[0.3em]">{copy.countdown.label}</p>
        <div className="mt-6 grid h-44 w-full place-items-center sm:h-60 landscapePhone:mt-2 landscapePhone:h-28" aria-live="assertive">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`alkheelank-heading leading-none alkheelank-gradient-text ${
                isGo ? "text-7xl sm:text-9xl landscapePhone:text-5xl" : "text-9xl sm:text-[10rem] landscapePhone:text-6xl"
              }`}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div
      className="countdown-screen fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: beatColor }}
      aria-live="assertive"
    >
      <motion.div
        key={step}
        className="absolute inset-0"
        initial={{ opacity: 0.35 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        style={{ backgroundColor: "#ffffff" }}
        aria-hidden
      />
      <p className="countdown-screen__label">{copy.countdown.label}</p>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={step}
          initial={{ opacity: 0, scale: 0.35 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.25 }}
          transition={motionSafe(spring.bouncy, reduced)}
          className={`countdown-screen__num ${isGo ? "countdown-screen__num--go" : ""}`}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
