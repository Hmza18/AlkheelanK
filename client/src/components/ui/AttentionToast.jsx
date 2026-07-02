import { motion } from "framer-motion";
import { spring } from "../../lib/motion.js";

export default function AttentionToast({ popup, onCta, onDismiss, progress = 1 }) {
  if (!popup) return null;

  const headlineClass =
    popup.tone === "urgency" ? "k-attention-toast__headline k-shimmer-text" : "k-attention-toast__headline";

  return (
    <motion.aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, x: -28, y: 12, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -16, scale: 0.96 }}
      transition={spring.bouncy}
      className={`k-attention-toast k-attention-toast--${popup.tone}`}
    >
      <button type="button" className="k-attention-toast__close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>

      <div className="k-attention-toast__row">
        {popup.live ? (
          <span className="k-attention-toast__live" aria-hidden>
            <span className="k-badge-live__dot" />
            Live
          </span>
        ) : (
          popup.emoji && (
            <span className="k-attention-toast__emoji" aria-hidden>
              {popup.emoji}
            </span>
          )
        )}
        <div className="k-attention-toast__copy">
          {popup.eyebrow && <p className="k-attention-toast__eyebrow">{popup.eyebrow}</p>}
          <p className={headlineClass}>{popup.headline}</p>
          {popup.body && <p className="k-attention-toast__body">{popup.body}</p>}
        </div>
      </div>

      {popup.cta && (
        <button type="button" onClick={onCta} className="k-attention-toast__cta">
          {popup.cta}
        </button>
      )}

      <span
        className="k-attention-toast__timer"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />
    </motion.aside>
  );
}
