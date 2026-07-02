import { motion } from "framer-motion";
import ModalShell from "./ModalShell.jsx";
import { spring } from "../../lib/motion.js";

/** Centered modal popup with glow ring — wins, demo complete, milestones. */
export default function CelebrationPopup({
  open,
  emoji,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  if (!open) return null;

  return (
    <ModalShell
      ariaLabelledby="k-popup-title"
      size="lg"
      zIndex={80}
      panelClassName="k-modal-panel--center"
    >
      {emoji && (
        <motion.span
          className="k-modal__emoji"
          initial={{ scale: 0.5, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: 0.05 }}
        >
          {emoji}
        </motion.span>
      )}
      <h2 id="k-popup-title" className="k-modal__title k-shimmer-text">
        {title}
      </h2>
      {body && <p className="k-modal__body">{body}</p>}
      <div className="k-modal__actions">
        {primaryLabel && (
          <button type="button" onClick={onPrimary} className="alkheelank-btn-primary k-btn-glow w-full">
            {primaryLabel}
          </button>
        )}
        {secondaryLabel && (
          <button type="button" onClick={onSecondary} className="alkheelank-btn-ghost w-full">
            {secondaryLabel}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
