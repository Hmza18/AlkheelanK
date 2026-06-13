import { motion } from "framer-motion";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onCancel}
        className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-surface-elevated p-7 shadow-2xl ring-1 ring-blue-200"
        role="alertdialog"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <h2 id="confirm-modal-title" className="font-display text-2xl font-bold">
          {title}
        </h2>
        <p id="confirm-modal-message" className="mt-2 text-muted">
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className={destructive ? "alkheelank-btn-primary !bg-tile-triangle" : "alkheelank-btn-primary flex-1"}
          >
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel} className="alkheelank-btn-ghost flex-1">
            {cancelLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
