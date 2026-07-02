import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth.jsx";
import Logo from "../components/Logo.jsx";
import PinInput from "../components/PinInput.jsx";
import LandingDemo from "../components/LandingDemo.jsx";
import LandingBenefits from "../components/LandingBenefits.jsx";
import LandingQuotes from "../components/LandingQuotes.jsx";
import LandingPricing from "../components/LandingPricing.jsx";
import LandingFinalCta from "../components/LandingFinalCta.jsx";
import GlowCard from "../components/ui/GlowCard.jsx";
import SocialProofBar from "../components/ui/SocialProofBar.jsx";
import LandingFaq from "../components/LandingFaq.jsx";
import AttentionPopups from "../components/AttentionPopups.jsx";
import SettingsPanel from "../components/SettingsPanel.jsx";
import { useTrialCheckout } from "../lib/useTrialCheckout.js";
import { BRAND } from "../lib/brand.js";
import { copy } from "../lib/copy.js";
import { isCompletePin, sanitizePin } from "../lib/pin.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
};

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(null);

  const goPlay = () => {
    const clean = sanitizePin(pin);
    if (!isCompletePin(clean)) {
      setPinError(copy.player.pinStep);
      return;
    }
    setPinError(null);
    navigate(`/join?pin=${clean}`);
  };

  const { goTrial } = useTrialCheckout(user);

  return (
    <div className="alkheelank-screen-fill alkheelank-safe-x alkheelank-safe-bottom relative mx-auto w-full max-w-5xl overflow-x-hidden px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] landscapePhone:py-4">
      <div className="k-hero-spotlight" aria-hidden />

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center overflow-visible text-center"
      >
        <motion.div variants={item} className="mb-4">
          <span className="k-free-badge">{copy.landing.heroBadge}</span>
        </motion.div>

        <motion.div variants={item} className="mb-5">
          <Logo size="lg" />
        </motion.div>

        <motion.h1
          variants={item}
          className="k-shimmer-text k-hero-headline max-w-2xl px-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
        >
          {copy.landing.headline}
        </motion.h1>

        <motion.p variants={item} className="mt-3 max-w-xl text-base text-muted sm:text-lg">
          {copy.landing.subhead}
        </motion.p>

        <motion.div variants={item} className="mt-7 overflow-visible">
          <button
            type="button"
            onClick={() => goTrial()}
            className="alkheelank-btn-primary k-btn-glow px-10 text-lg sm:px-14 sm:text-xl"
          >
            {copy.landing.hostCta}
          </button>
          <p className="mt-2 text-sm font-semibold text-brand-mid">{copy.landing.hostCtaSub}</p>
          <SocialProofBar />
          <p className="mt-3 text-xs text-muted">{copy.landing.socialProof}</p>
        </motion.div>

        <motion.div variants={item} className="mt-8 w-full max-w-lg px-1">
          <LandingDemo />
        </motion.div>

        <motion.div variants={item} className="mt-14 flex w-full justify-center">
          <LandingBenefits />
        </motion.div>

        <motion.div variants={item} className="mt-14 flex w-full justify-center">
          <LandingQuotes />
        </motion.div>

        <motion.div variants={item} className="mt-14 flex w-full justify-center">
          <LandingPricing onSubscribe={goTrial} />
        </motion.div>

        <motion.div variants={item} className="mt-10 w-full max-w-md">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">{copy.landing.joinTitle}</p>
          <GlowCard>
            <div className="p-5">
              <PinInput
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  if (pinError) setPinError(null);
                }}
              />
              {pinError && (
                <p className="mt-3 rounded-xl bg-tile-triangle/15 px-4 py-2 text-center text-sm font-semibold text-tile-triangle">
                  {pinError}
                </p>
              )}
              <button type="button" onClick={goPlay} className="alkheelank-btn-ghost mt-4 w-full">
                {copy.landing.joinCta}
              </button>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div variants={item} className="mt-14 flex w-full justify-center">
          <LandingFaq onHost={() => goTrial()} />
        </motion.div>

        <motion.div variants={item} className="mt-14 flex w-full justify-center">
          <LandingFinalCta onHost={() => goTrial()} />
        </motion.div>

        <motion.p variants={item} className="mt-8 text-xs font-semibold uppercase tracking-widest text-muted">
          {copy.landing.trustLine}
        </motion.p>
      </motion.section>

      <footer className="relative z-10 mt-16 border-t border-edge pt-8 text-center text-xs text-muted">
        <p>{BRAND.name} · {copy.landing.footer}</p>
      </footer>

      <AttentionPopups onHost={() => goTrial()} />
      <SettingsPanel corner="bottom-left" />
    </div>
  );
}
