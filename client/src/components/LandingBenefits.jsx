import { motion } from "framer-motion";
import GlowCard from "./ui/GlowCard.jsx";
import { copy } from "../lib/copy.js";

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
};

export default function LandingBenefits() {
  const { eyebrow, title, items } = copy.landing.benefits;

  return (
    <div className="mx-auto w-full max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-mid">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h2>

      <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
        {items.map((b, i) => (
          <motion.div key={b.title} variants={item} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
            <GlowCard className="h-full">
              <div className="k-benefit-card p-4 sm:p-5">
                <span className="k-benefit-card__emoji" aria-hidden>{b.emoji}</span>
                <p className="k-benefit-card__old">{b.oldWay}</p>
                <p className="k-benefit-card__title">{b.title}</p>
                <p className="k-benefit-card__body">{b.body}</p>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
