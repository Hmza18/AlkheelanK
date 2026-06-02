import { useEffect, useRef, useState } from "react";
import { sfx } from "../lib/sound.js";

// Circular countdown. Counts down locally from `timeLimit` seconds starting at
// `startedAt` (server timestamp), so host + players stay roughly in sync. The
// server remains authoritative for actually closing the question.
//
// When `paused` is true the loop freezes on the current value. On resume the
// server sends a fresh `startedAt` (shifted to exclude the pause) and the effect
// re-runs, so the countdown picks up exactly where it left off.
export default function Timer({ timeLimit, startedAt, sound = false, paused = false, onExpire }) {
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
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct);
  const seconds = Math.ceil(remaining);
  const danger = remaining <= 5 && !paused;
  const urgent = remaining <= Math.max(8, timeLimit * 0.25) && !paused;

  return (
    <div className={`relative grid place-items-center ${urgent ? "scale-[1.03]" : ""}`}>
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        className={danger ? "animate-pulse" : urgent ? "animate-[pulse_1.8s_ease-in-out_infinite]" : ""}
      >
        <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={paused ? "#a6a8d8" : danger ? "#f43f5e" : urgent ? "#fb923c" : "#c026d3"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{
            transition: "stroke-dashoffset 0.1s linear",
            filter: urgent ? "drop-shadow(0 0 6px rgba(244,63,94,0.65))" : "none",
          }}
        />
      </svg>
      <span
        className={`absolute font-display text-5xl font-bold tabular-nums ${
          paused ? "text-muted" : danger ? "text-tile-triangle" : "text-paper"
        }`}
      >
        {paused ? "⏸" : seconds}
      </span>
    </div>
  );
}
