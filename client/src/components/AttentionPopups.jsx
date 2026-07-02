import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AttentionToast from "./ui/AttentionToast.jsx";
import RealityModal from "./ui/RealityModal.jsx";
import { getAttentionPopupsForCycle, ATTENTION_LOOP_GAP_MS } from "../lib/attentionPopups.js";
import { useReducedMotion } from "../lib/motion.js";

/**
 * Sequenced landing popups — loops forever while the landing page is open.
 * No session storage: dismiss/CTA never permanently blocks future popups.
 */
export default function AttentionPopups({ enabled = true, onHost }) {
  const reduced = useReducedMotion();
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [progress, setProgress] = useState(1);
  const timersRef = useRef([]);
  const rafRef = useRef(null);
  const cycleRef = useRef(0);
  const poolCycleRef = useRef(0);
  const [cycleKey, setCycleKey] = useState(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
    setProgress(1);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleCta = useCallback(() => {
    dismissToast();
    setModal(null);
    onHost?.();
  }, [dismissToast, onHost]);

  const dismissModal = useCallback(() => {
    setModal(null);
  }, []);

  const startProgress = useCallback(
    (displayMs) => {
      if (reduced || !displayMs) return;
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        const remaining = Math.max(0, 1 - elapsed / displayMs);
        setProgress(remaining);
        if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [reduced]
  );

  const showPopup = useCallback(
    (popup) => {
      if (popup.type === "modal") {
        setToast(null);
        setModal(popup);
        return;
      }

      setModal(null);
      setToast(popup);
      startProgress(popup.displayMs ?? 8000);

      if (popup.displayMs) {
        const auto = setTimeout(() => {
          setToast((current) => (current?.id === popup.id ? null : current));
          setProgress(1);
        }, popup.displayMs);
        timersRef.current.push(auto);
      }
    },
    [startProgress]
  );

  const scheduleCycle = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const cycleId = ++cycleRef.current;
    const delayScale = reduced ? 1.4 : 1;
    const popups = getAttentionPopupsForCycle(poolCycleRef.current).filter(
      (p) => !reduced || p.type !== "toast" || p.tone !== "social"
    );

    popups.forEach((popup) => {
      const timer = setTimeout(() => {
        if (cycleId !== cycleRef.current) return;
        showPopup(popup);
      }, popup.delayMs * delayScale);
      timersRef.current.push(timer);
    });

    const last = popups[popups.length - 1];
    const loopAfter = (last.delayMs + ATTENTION_LOOP_GAP_MS) * delayScale;
    const loopTimer = setTimeout(() => {
      if (cycleId !== cycleRef.current) return;
      setToast(null);
      setModal(null);
      setProgress(1);
      poolCycleRef.current += 1;
      setCycleKey((k) => k + 1);
      scheduleCycle();
    }, loopAfter);
    timersRef.current.push(loopTimer);
  }, [reduced, showPopup]);

  useEffect(() => {
    if (!enabled) return undefined;

    scheduleCycle();
    return () => {
      cycleRef.current += 1;
      clearTimers();
    };
  }, [enabled, scheduleCycle, clearTimers]);

  return (
    <>
      <AnimatePresence mode="wait">
        {toast && (
          <AttentionToast
            key={`${toast.id}-${cycleKey}`}
            popup={toast}
            progress={progress}
            onCta={handleCta}
            onDismiss={dismissToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <RealityModal
            key={`${modal.id}-${cycleKey}`}
            open
            popup={modal}
            onCta={handleCta}
            onDismiss={dismissModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}
