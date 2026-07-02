import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlowCard from "./ui/GlowCard.jsx";
import { copy } from "../lib/copy.js";
import { spring } from "../lib/motion.js";

function FaqItem({ item, open, onToggle }) {
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className={`k-faq-item ${open ? "k-faq-item--open" : ""}`}>
      <button
        type="button"
        id={buttonId}
        className="k-faq-item__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="k-faq-item__question">{item.q}</span>
        <span className="k-faq-item__icon" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.soft}
            className="k-faq-item__panel"
          >
            <p className="k-faq-item__answer">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingFaq({ onHost }) {
  const [openId, setOpenId] = useState(copy.landing.faq.items[0]?.id ?? null);
  const { title, subtitle, items, cta } = copy.landing.faq;

  return (
    <div className="mx-auto w-full max-w-2xl text-left">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-muted">{subtitle}</p>
      <h2 className="mt-2 text-center font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h2>

      <GlowCard className="mt-6 w-full">
        <div className="k-faq-list p-2 sm:p-3">
          {items.map((item) => (
            <FaqItem
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
            />
          ))}
        </div>
      </GlowCard>

      {cta && onHost && (
        <div className="mt-6 text-center">
          <button type="button" onClick={onHost} className="alkheelank-btn-primary k-btn-glow px-8">
            {cta}
          </button>
        </div>
      )}
    </div>
  );
}
