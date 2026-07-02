import ModalShell from "./ui/ModalShell.jsx";

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}) {
  return (
    <ModalShell
      onBackdropClick={onCancel}
      role="alertdialog"
      ariaLabelledby="confirm-modal-title"
      ariaDescribedby="confirm-modal-message"
      size="md"
      zIndex={90}
      panelClassName="k-modal-panel--left"
    >
      <p className="k-modal__eyebrow">Are you sure?</p>
      <h2 id="confirm-modal-title" className="k-modal__title">
        {title}
      </h2>
      <p id="confirm-modal-message" className="k-modal__body">
        {message}
      </p>
      <div className="k-modal__actions k-modal__actions--row">
        <button type="button" onClick={onCancel} className="alkheelank-btn-ghost flex-1">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={
            destructive
              ? "alkheelank-btn-primary !bg-tile-triangle flex-1"
              : "alkheelank-btn-primary k-btn-glow flex-1"
          }
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
