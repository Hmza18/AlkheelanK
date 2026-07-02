import { motion } from "framer-motion";

import GlowCard from "./ui/GlowCard.jsx";

import ScrollHint from "./ScrollHint.jsx";



export default function DoublePointsWarning({ warning, variant = "player" }) {

  const shellClass =

    variant === "host"

      ? "host-phase-fill alkheelank-screen-host flex items-center justify-center overflow-hidden text-center landscapePhone:py-2"

      : "alkheelank-screen-player player-phase-fill flex items-center overflow-hidden text-center landscapePhone:py-2";



  return (

    <div className={`${shellClass} relative`}>

      <motion.div

        initial={{ opacity: 0.55 }}

        animate={{ opacity: 0 }}

        transition={{ duration: 1 }}

        className="pointer-events-none absolute inset-0 bg-brand-mid/25"

        aria-hidden

      />

      <motion.div

        initial={{ opacity: 0, scale: 0.88, y: 24 }}

        animate={{ opacity: 1, scale: 1, y: 0 }}

        transition={{ type: "spring", stiffness: 300, damping: 22 }}

        className="relative mx-auto w-full max-w-lg px-4"

      >

        <GlowCard intense>

          <div className="relative overflow-hidden p-8 landscapePhone:p-5">

            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-mid/20 blur-2xl" aria-hidden />

            <motion.div

              initial={{ scale: 0.4, rotate: -10 }}

              animate={{ scale: [0.4, 1.18, 1], rotate: [-10, 4, 0] }}

              transition={{ duration: 0.7, ease: "easeOut" }}

              className="relative mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-brand-gradient text-6xl shadow-glow ring-2 ring-brand-mid/40 landscapePhone:h-16 landscapePhone:w-16 landscapePhone:text-4xl"

            >

              ⚡

            </motion.div>

            <p className="relative mt-6 alkheelank-label text-brand-mid landscapePhone:mt-3">Get ready</p>

            <h2 className="relative mt-2 alkheelank-heading text-4xl alkheelank-gradient-text landscapePhone:text-2xl">

              Double points question!

            </h2>

            <p className="relative mt-3 text-lg font-semibold text-muted landscapePhone:mt-2 landscapePhone:text-sm">

              Round {(warning?.index ?? 0) + 1}

              {warning?.total ? ` of ${warning.total}` : ""} is worth 2×.

            </p>

            <p className="relative mt-5 animate-pulse text-sm font-bold uppercase tracking-widest text-muted landscapePhone:mt-3 landscapePhone:text-xs">

              Eyes up — question loading next

            </p>

            <ScrollHint />

          </div>

        </GlowCard>

      </motion.div>

    </div>

  );

}


