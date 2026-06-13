import { motion } from "framer-motion";
import ScrollHint from "./ScrollHint.jsx";

export default function DoublePointsWarning({ warning, variant = "player" }) {
  const shellClass =
    variant === "host"
      ? "host-phase-fill alkheelank-screen-host flex items-center justify-center overflow-hidden text-center landscapePhone:py-2"
      : "alkheelank-screen-player player-phase-fill flex items-center overflow-hidden text-center landscapePhone:py-2";

  return (
    <div className={shellClass}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="alkheelank-card relative mx-auto w-full max-w-lg overflow-hidden p-8 landscapePhone:p-5"
      >
        <motion.div
          initial={{ scale: 0.4, rotate: -10 }}
          animate={{ scale: [0.4, 1.18, 1], rotate: [-10, 4, 0] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-brand-mid/25 text-6xl ring-2 ring-brand-mid landscapePhone:h-16 landscapePhone:w-16 landscapePhone:text-4xl"
        >
          ⚡
        </motion.div>
        <p className="mt-6 alkheelank-label text-brand-mid landscapePhone:mt-3">Get ready</p>
        <h2 className="mt-2 alkheelank-heading text-4xl alkheelank-gradient-text landscapePhone:text-2xl">
          Double points question!
        </h2>
        <p className="mt-3 text-lg font-semibold text-muted landscapePhone:mt-2 landscapePhone:text-sm">
          Round {(warning?.index ?? 0) + 1}
          {warning?.total ? ` of ${warning.total}` : ""} is worth 2×.
        </p>
        <p className="mt-5 animate-pulse text-sm font-bold uppercase tracking-widest text-muted landscapePhone:mt-3 landscapePhone:text-xs">
          Eyes up — question loading next
        </p>
        <ScrollHint />
      </motion.div>
    </div>
  );
}
