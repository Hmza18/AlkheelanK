import { useEffect, useRef, useState } from "react";
import { sfx } from "../lib/sound.js";

/**
 * Thin linear countdown for phone — rendered into `question-screen__timer-strip`.
 * Same local countdown model as the circular Timer; the server stays authoritative.
 */
export function TimerStrip({ timeLimit, startedAt, paused = false }) {
  const [remaining, setRemaining] = useState(timeLimit);

  useEffect(() => {
    if (paused) return;
    let raf;
    const start = startedAt || Date.now();
    const loop = () => {
      const rem = Math.max(0, timeLimit - (Date.now() - start) / 1000);
      setRemaining(rem);
      if (rem > 0) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [timeLimit, startedAt, paused]);

  const pct = Math.max(0, Math.min(1, remaining / timeLimit));
  const danger = remaining <= 5 && !paused;
  const urgent = remaining <= Math.max(8, timeLimit * 0.25) && !paused;
  const color = paused ? "#b8a99a" : danger ? "#f43f5e" : urgent ? "#fb923c" : "#ea580c";
  const seconds = Math.ceil(remaining);

  const stripClass = [
    "question-screen__timer-strip",
    danger ? "question-screen__timer-strip--danger" : "",
    urgent && !danger ? "question-screen__timer-strip--urgent" : "",
    paused ? "question-screen__timer-strip--paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={stripClass} role="timer" aria-label={`${seconds} seconds left`}>
      <div className="question-screen__timer-strip__bar" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      <span className="question-screen__timer-strip__secs" aria-hidden>
        {paused ? "⏸" : seconds}
      </span>
    </div>
  );
}

// Circular countdown. Counts down locally from `timeLimit` seconds starting at
// `startedAt` (server timestamp), so host + players stay roughly in sync. The
// server remains authoritative for actually closing the question.
//
// When `paused` is true the loop freezes on the current value. On resume the
// server sends a fresh `startedAt` (shifted to exclude the pause) and the effect
// re-runs, so the countdown picks up exactly where it left off.
export default function Timer({ timeLimit, startedAt, sound = false, paused = false, onExpire, size = 128 }) {
  const [remaining, setRemaining] = useState(timeLimit);
  const lastTickRef = useRef(Math.ceil(timeLimit));
  const firedRef = useRef(false);

  useEffect(() => {
    if (paused) return; // freeze — keep whatever `remaining` we have
    firedRef.current = false;
    lastTickRef.current = Math.ceil(timeLimit);
    let raf;
    const start = startedAt || Date.now();

    const loop = () => {
      const elapsed = (Date.now() - start) / 1000;
      const rem = Math.max(0, timeLimit - elapsed);
      setRemaining(rem);

      const whole = Math.ceil(rem);
      if (sound && whole !== lastTickRef.current && whole <= 5 && whole > 0) {
        sfx.tick();
      }
      lastTickRef.current = whole;

      if (rem <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          onExpire?.();
        }
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimit, startedAt, paused]);

  const pct = Math.max(0, Math.min(1, remaining / timeLimit));
  const R = (size / 128) * 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct);
  const seconds = Math.ceil(remaining);
  const danger = remaining <= 5 && !paused;
  const urgent = remaining <= Math.max(8, timeLimit * 0.25) && !paused;
  const cx = size / 2;
  const strokeW = (size / 128) * 12;
  const fontSize = size <= 80 ? "text-3xl" : "text-5xl";

  return (
    <div className={`relative grid place-items-center ${urgent ? "scale-[1.03]" : ""}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={danger ? "animate-pulse" : urgent ? "animate-[pulse_1.8s_ease-in-out_infinite]" : ""}
      >
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(250,246,240,0.12)" strokeWidth={strokeW} />
        <circle
          cx={cx}
          cy={cx}
          r={R}
          fill="none"
          stroke={paused ? "#b8a99a" : danger ? "#f43f5e" : urgent ? "#fb923c" : "#ea580c"}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{
            transition: "stroke-dashoffset 0.1s linear",
            filter: urgent ? "drop-shadow(0 0 6px rgba(244,63,94,0.65))" : "none",
          }}
        />
      </svg>
      <span
        className={`absolute font-display font-bold tabular-nums ${fontSize} ${
          paused ? "text-muted" : danger ? "text-tile-triangle" : "text-paper"
        }`}
      >
        {paused ? "⏸" : seconds}
      </span>
    </div>
  );
}
