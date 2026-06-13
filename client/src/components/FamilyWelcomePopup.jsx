import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HAMZA_INSTAGRAM_URL } from "../lib/credits.js";

const STORAGE_KEY = "alkheelank-family-welcome-seen";

export default function FamilyWelcomePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-edge-scrim backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            key="card"
            role="dialog"
            aria-modal="true"
            aria-label="Welcome message"
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-3xl bg-surface-elevated p-7 ring-1 ring-edge shadow-card"
            initial={{ opacity: 0, scale: 0.88, y: "-44%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.92, y: "-44%" }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
          >
            {/* Heart icon */}
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-start via-brand-mid to-brand-end text-3xl shadow-glow">
              🏠
            </div>

            <h2 className="font-display text-2xl font-extrabold leading-snug">
              Made for{" "}
              <span className="alkheelank-gradient-text">our family</span>
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              This game was built entirely for us — your entertainment, your laughs, your wins. And yes,{" "}
              <span className="font-semibold text-ink-900">it works completely fine!</span> 😄
            </p>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              Got feedback or ideas? I'd love to hear them:
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <a
                href="tel:+97339559928"
                className="flex items-center gap-3 rounded-xl bg-surface-muted px-4 py-3 ring-1 ring-edge transition hover:bg-surface-elevated"
              >
                <span className="text-xl">📞</span>
                <span className="text-sm font-semibold text-ink-900">+973 3955 9928</span>
              </a>

              <a
                href={HAMZA_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-surface-muted px-4 py-3 ring-1 ring-edge transition hover:bg-surface-elevated"
              >
                <span className="text-xl">📸</span>
                <span className="text-sm font-semibold text-ink-900">@hamzamahari</span>
              </a>
            </div>

            <div className="mt-4 rounded-xl bg-surface-muted/60 px-4 py-3 ring-1 ring-edge">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Tips & support</p>
              <p className="mt-1 text-sm text-ink-900">
                Feel free to send a tip via{" "}
                <span className="font-bold alkheelank-gradient-text">Benefit Pay</span>{" "}
                — same number above 💛
              </p>
            </div>

            <button
              onClick={dismiss}
              className="alkheelank-btn-primary mt-5 w-full text-base"
            >
              Let's play! 🎉
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
