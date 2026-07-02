import ModalShell from "./ModalShell.jsx";

/** Full-screen confrontation modal — Marc Lou “honest question” energy. */
export default function RealityModal({ open, popup, onCta, onDismiss }) {
  if (!open || !popup) return null;

  return (
    <ModalShell
      onBackdropClick={onDismiss}
      ariaLabelledby="k-reality-title"
      size="lg"
      zIndex={88}
      panelClassName="k-modal-panel--center"
    >
      {popup.emoji && <span className="k-modal__emoji">{popup.emoji}</span>}

      <p className="k-modal__eyebrow">{popup.eyebrow || "Before you scroll away"}</p>
      <h2 id="k-reality-title" className="k-modal__title k-shimmer-text">
        {popup.headline}
      </h2>
      {popup.body && <p className="k-modal__body">{popup.body}</p>}

      <div className="k-modal__actions">
        {popup.cta && (
          <button type="button" onClick={onCta} className="alkheelank-btn-primary k-btn-glow w-full">
            {popup.cta}
          </button>
        )}
        {popup.dismissLabel && (
          <button type="button" onClick={onDismiss} className="k-modal__dismiss">
            {popup.dismissLabel}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
