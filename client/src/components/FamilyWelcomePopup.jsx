import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import ModalShell from "./ui/ModalShell.jsx";
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
        <ModalShell
          onBackdropClick={dismiss}
          ariaLabel="Welcome message"
          size="lg"
          zIndex={92}
          panelClassName="k-modal-panel--left"
        >
          <div className="k-modal__icon-badge">🏠</div>

          <h2 className="k-modal__title">
            Made for <span className="k-shimmer-text">our family</span>
          </h2>

          <p className="k-modal__body">
            This game was built entirely for us — your entertainment, your laughs, your wins. And yes,{" "}
            <span className="font-semibold text-ink-900">it works completely fine!</span> 😄
          </p>

          <p className="k-modal__body">Got feedback or ideas? I'd love to hear them:</p>

          <div className="k-modal__link-stack">
            <a href="tel:+97339559928" className="k-modal__link-row">
              <span className="k-modal__link-emoji">📞</span>
              <span className="k-modal__link-label">+973 3955 9928</span>
            </a>

            <a
              href={HAMZA_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="k-modal__link-row"
            >
              <span className="k-modal__link-emoji">📸</span>
              <span className="k-modal__link-label">@hamzamahari</span>
            </a>
          </div>

          <div className="k-modal__callout">
            <p className="k-modal__eyebrow">Tips & support</p>
            <p className="k-modal__callout-text">
              Feel free to send a tip via <span className="k-shimmer-text font-bold">Benefit Pay</span> — same
              number above 💛
            </p>
          </div>

          <div className="k-modal__actions">
            <button type="button" onClick={dismiss} className="alkheelank-btn-primary k-btn-glow w-full">
              Let's play! 🎉
            </button>
          </div>
        </ModalShell>
      )}
    </AnimatePresence>
  );
}
