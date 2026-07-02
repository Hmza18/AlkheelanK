import { motion } from "framer-motion";
import Avatar from "./characters.jsx";
import { copy } from "../lib/copy.js";

export default function LandingQuotes() {
  const { eyebrow, title, items } = copy.landing.quotes;

  return (
    <div className="mx-auto w-full max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h2>

      <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
        {items.map((q, i) => (
          <motion.blockquote
            key={q.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 320, damping: 26 }}
            className="k-quote-card"
          >
            <p className="k-quote-card__text">"{q.text}"</p>
            <footer className="k-quote-card__footer">
              <Avatar config={q.avatar} size={32} ring />
              <div>
                <cite className="k-quote-card__name not-italic">{q.name}</cite>
                <p className="k-quote-card__role">{q.role}</p>
              </div>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </div>
  );
}
