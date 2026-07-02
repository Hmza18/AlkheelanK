import { motion } from "framer-motion";
import GlowCard from "./GlowCard.jsx";
import { spring } from "../../lib/motion.js";

/** Centered modal shell — gradient border, top stripe, soft glow (Marc Lou / indie SaaS). */
export default function ModalShell({
  onBackdropClick,
  children,
  role = "dialog",
  ariaLabelledby,
  ariaDescribedby,
  ariaLabel,
  intense = true,
  size = "lg",
  align = "center",
  className = "",
  panelClassName = "",
  zIndex = 88,
}) {
  const sizeClass =
    size === "sm" ? "k-modal-shell--sm" : size === "md" ? "k-modal-shell--md" : "k-modal-shell--lg";
  const alignClass = align === "top" ? "k-modal-backdrop--top" : "";

  return (
    <motion.div
      className={`k-modal-backdrop ${alignClass}`}
      style={{ zIndex }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onBackdropClick}
    >
      <motion.div
        className={`k-modal-shell ${sizeClass}`}
        initial={{ opacity: 0, scale: 0.9, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={spring.bouncy}
        onClick={(e) => e.stopPropagation()}
      >
        <GlowCard intense={intense} className={`k-modal-glow-wrap ${className}`}>
          <div
            className={`k-modal-panel ${panelClassName}`}
            role={role}
            aria-labelledby={ariaLabelledby}
            aria-describedby={ariaDescribedby}
            aria-label={ariaLabel}
          >
            <div className="k-modal-panel__stripe" aria-hidden />
            <div className="k-modal-panel__glow" aria-hidden />
            {children}
          </div>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}
