import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Shape from "../components/Shape.jsx";
import { ANSWERS } from "../lib/answers.js";
import { useAuth } from "../lib/auth.jsx";
import BuiltByHamza from "../components/BuiltByHamza.jsx";
import { formatPinInput, isCompletePin, sanitizePin } from "../lib/pin.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
};

const STEPS = [
  { shape: "triangle", color: ANSWERS[0].color, title: "Join with a PIN", body: "Open the link, type the 6-digit game PIN." },
  { shape: "diamond", color: ANSWERS[1].color, title: "Pick your character", body: "Choose a face and make it yours." },
  { shape: "circle", color: ANSWERS[2].color, title: "Tap to answer", body: "Faster correct answers score more." },
  { shape: "square", color: ANSWERS[3].color, title: "Climb the leaderboard", body: "Race to the top, then the podium." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pin, setPin] = useState("");

  const goPlay = (e) => {
    e.preventDefault();
    const clean = sanitizePin(pin);
    if (!isCompletePin(clean)) return;
    navigate(`/join?pin=${clean}`);
  };

  return (
    <div className="alkheelank-screen-fill alkheelank-safe-x alkheelank-safe-bottom relative mx-auto w-full max-w-5xl overflow-x-hidden px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] landscapePhone:py-4 landscapePhone:pt-[max(1rem,env(safe-area-inset-top))]">
      <FloatingShapes />

      {/* Hero */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center"
      >
        <motion.h1
          variants={item}
          className="font-display text-5xl font-extrabold tracking-tight alkheelank-gradient-text sm:text-7xl"
        >
          Alkheeloot
        </motion.h1>

        <motion.h2
          variants={item}
          className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-5xl"
        >
          Fast-tap trivia for
          <br className="hidden sm:block" /> your <span className="alkheelank-gradient-text">living room</span>.
        </motion.h2>

        <motion.p variants={item} className="mt-4 max-w-md text-lg font-semibold text-muted">
          Host it on the big screen, everyone plays from their phones. Same rush you know — our own game.
        </motion.p>

        {/* Primary actions */}
        <motion.div variants={item} className="mt-10 w-full max-w-md">
          <form onSubmit={goPlay} className="alkheelank-card p-6">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-muted">
              Join a game
            </label>
            <input
              className="alkheelank-input pin-display"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Game PIN"
              maxLength={7}
              value={formatPinInput(pin)}
              onChange={(e) => setPin(sanitizePin(e.target.value))}
              autoFocus
            />
            <button type="submit" className="alkheelank-btn-primary mt-4 w-full text-xl">
              Join a game →
            </button>
          </form>

          <div className="my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-surface-muted/60" />
            <span className="text-sm font-semibold uppercase tracking-widest text-muted">or</span>
            <div className="h-px flex-1 bg-surface-muted/60" />
          </div>

          <button onClick={() => navigate("/host")} className="alkheelank-btn-ghost w-full text-lg">
            {user ? "🖥️ Go to your dashboard" : "🖥️ Host a game"}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            {user ? "Pick up where you left off." : "Sign in to save quizzes — or host as a guest."}
          </p>
        </motion.div>
      </motion.section>

      {/* How it works */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
        className="relative z-10 mt-20"
      >
        <motion.h2 variants={item} className="text-center font-display text-2xl font-bold text-muted">
          How it works
        </motion.h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              variants={item}
              className="alkheelank-card relative flex flex-col items-center p-6 text-center"
            >
              <span
                className="grid h-16 w-16 place-items-center rounded-2xl"
                style={{ backgroundColor: `${s.color}22` }}
              >
                <Shape type={s.shape} size={32} color={s.color} />
              </span>
              <span className="mt-3 text-xs font-bold uppercase tracking-widest text-muted">
                Step {i + 1}
              </span>
              <h3 className="mt-1 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <BuiltByHamza className="relative z-10 mt-16" />
    </div>
  );
}

// Decorative, slowly drifting answer shapes — pure vibe, ignores pointer events.
function FloatingShapes() {
  const deco = [
    { type: "triangle", color: ANSWERS[0].color, top: "12%", left: "6%", size: 46, delay: 0 },
    { type: "diamond", color: ANSWERS[1].color, top: "22%", right: "8%", size: 54, delay: 0.6 },
    { type: "circle", color: ANSWERS[2].color, top: "62%", left: "4%", size: 40, delay: 1.1 },
    { type: "square", color: ANSWERS[3].color, top: "70%", right: "6%", size: 50, delay: 0.3 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {deco.map((d, i) => (
        <motion.div
          key={i}
          className="absolute opacity-20"
          style={{ top: d.top, left: d.left, right: d.right }}
          animate={{ y: [0, -16, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: d.delay }}
        >
          <Shape type={d.type} size={d.size} color={d.color} />
        </motion.div>
      ))}
    </div>
  );
}
