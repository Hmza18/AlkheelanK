import { useEffect, useState } from "react";

function isPortraitViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(orientation: portrait)").matches;
}

/** Block portrait during live play — Alkheeloot is landscape-first on phones. */
export default function OrientationGate({ active, children }) {
  const [portrait, setPortrait] = useState(isPortraitViewport);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const sync = () => setPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  if (active && portrait) {
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink-900 px-6 text-center"
        role="alert"
      >
        <div className="animate-[float_2.4s_ease-in-out_infinite] text-7xl" aria-hidden>
          📱
        </div>
        <h2 className="mt-6 font-display text-3xl font-bold text-paper">Rotate your phone</h2>
        <p className="mt-3 max-w-xs text-muted">
          Alkheeloot is built for landscape — turn your device sideways to play.
        </p>
      </div>
    );
  }

  return children;
}
