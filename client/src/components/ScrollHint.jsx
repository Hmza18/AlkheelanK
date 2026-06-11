import { useEffect, useRef, useState } from "react";

/**
 * Subtle "scroll down" arrow for short landscape viewports. Render it INSIDE a
 * scroll container; it measures the nearest scrollable ancestor (falling back
 * to the document) and shows only when there is actually content below the
 * fold. Fades out after a couple of seconds or on first scroll. Hidden outside
 * phone landscape via CSS (.alkheelank-scroll-hint).
 */
export default function ScrollHint() {
  const probeRef = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;

    // Nearest ancestor that can actually scroll vertically.
    let el = probe.parentElement;
    while (el && el !== document.body) {
      const { overflowY } = getComputedStyle(el);
      if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight + 8) break;
      el = el.parentElement;
    }
    const doc = document.scrollingElement;
    const target = el && el !== document.body ? el : doc.scrollHeight > doc.clientHeight + 8 ? doc : null;
    if (!target) return;

    setShow(true);
    const hide = () => setShow(false);
    const t = setTimeout(hide, 2200);
    const scrollEl = target === doc ? window : target;
    scrollEl.addEventListener("scroll", hide, { once: true, passive: true });
    return () => {
      clearTimeout(t);
      scrollEl.removeEventListener("scroll", hide);
    };
  }, []);

  return (
    <span ref={probeRef} aria-hidden>
      {show && <span className="alkheelank-scroll-hint">▼</span>}
    </span>
  );
}
