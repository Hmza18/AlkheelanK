import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SEEN_KEY = "alkheelank.landscapeTipSeen";

/**
 * One-time, non-blocking toast the first time the user flips to phone
 * landscape outside of live play. Dismissed on tap; never shown again
 * (localStorage flag).
 */
export default function OrientationTip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* private mode — just skip the persistence */
    }
    if (seen) return;

    const mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const onChange = () => {
      if (!mq.matches) return;
      setShow(true);
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          onClick={() => setShow(false)}
          className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[70] -translate-x-1/2 rounded-2xl bg-ink-700/95 px-4 py-2.5 text-sm font-semibold text-paper shadow-2xl ring-1 ring-white/15 backdrop-blur"
        >
          <span dir="rtl">تلميح: الشاشة الرأسية أفضل للعبة</span>
          <span className="mx-2 text-muted">·</span>
          <span>Tip: Portrait mode works best</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
