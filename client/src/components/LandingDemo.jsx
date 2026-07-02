import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth.jsx";
import AnswerTile from "./AnswerTile.jsx";
import GlowCard from "./ui/GlowCard.jsx";
import CelebrationPopup from "./ui/CelebrationPopup.jsx";
import PointsPop from "./ui/PointsPop.jsx";
import { sfx } from "../lib/sound.js";
import { copy } from "../lib/copy.js";

const DEMO = {
  question: "Which planet is known as the Red Planet?",
  answers: ["Venus", "Mars", "Jupiter", "Saturn"],
  correct: 1,
};

export default function LandingDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [picked, setPicked] = useState(null);
  const [showPoints, setShowPoints] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const goHost = () => navigate(user ? "/host" : "/host?guest=1");

  const pick = (index) => {
    if (picked !== null) return;
    setPicked(index);
    const isCorrect = index === DEMO.correct;
    if (isCorrect) {
      sfx.correct();
      setShowPoints(true);
    } else {
      sfx.wrong();
    }
    setTimeout(() => {
      setShowPopup(true);
    }, isCorrect ? 750 : 500);
  };

  const correct = picked === DEMO.correct;

  return (
    <>
      <GlowCard intense className="relative w-full">
        <div className="relative overflow-hidden p-5 text-left sm:p-6">
          <PointsPop show={showPoints && correct} points={920} />
          <p className="text-xs font-bold uppercase tracking-widest text-brand-mid">{copy.landing.demoLabel}</p>
          <h3 className="mt-2 font-display text-lg font-bold text-ink-900 sm:text-xl">{DEMO.question}</h3>

          <div className="landing-demo__answers mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEMO.answers.map((text, i) => (
              <AnswerTile
                key={text}
                index={i}
                text={text}
                kahoot
                disabled={picked !== null}
                selected={picked === i}
                revealed={picked !== null}
                correct={i === DEMO.correct}
                onClick={() => pick(i)}
              />
            ))}
          </div>

          <AnimatePresence>
            {picked !== null && !showPopup && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 text-center text-sm font-bold ${correct ? "text-tile-square" : "text-tile-triangle"}`}
              >
                {correct ? copy.landing.demoCorrect : copy.landing.demoWrong}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </GlowCard>

      <CelebrationPopup
        open={showPopup}
        emoji={correct ? "🎯" : "💫"}
        title={correct ? copy.landing.demoPopupTitle : copy.landing.demoPopupWrongTitle}
        body={copy.landing.demoPopupBody}
        primaryLabel={copy.landing.demoCta}
        onPrimary={goHost}
        secondaryLabel={copy.landing.demoTryAgain}
        onSecondary={() => {
          setPicked(null);
          setShowPoints(false);
          setShowPopup(false);
        }}
      />
    </>
  );
}
