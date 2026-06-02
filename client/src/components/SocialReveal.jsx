import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import { tileStyle } from "../lib/answers.js";

import { copy } from "../lib/copy.js";

import { spring, useReducedMotion, motionSafe } from "../lib/motion.js";

import { sfx } from "../lib/sound.js";

import Avatar from "./characters.jsx";

import SocialMoment from "./SocialMoment.jsx";



const STAGE_MAP = { bars: 0, highlight: 1, avatars: 2 };

const MAX_VISIBLE_AVATARS = 6;



const DEFAULT_TIMING = {

  barMs: 1050,

  highlightMs: 450,

  barStagger: 0.09,

  avatarDelay: 0.11,

};



function easeOutCubic(t) {

  return 1 - (1 - t) ** 3;

}



function CountUp({ value, delay = 0, duration = 0.85, reduced }) {

  const [display, setDisplay] = useState(0);



  useEffect(() => {

    setDisplay(0);

    if (value <= 0) return undefined;

    if (reduced) {

      setDisplay(value);

      return undefined;

    }

    let frame;

    const startAt = performance.now() + delay * 1000;

    const tick = (now) => {

      if (now < startAt) {

        frame = requestAnimationFrame(tick);

        return;

      }

      const p = Math.min(1, (now - startAt) / (duration * 1000));

      setDisplay(Math.round(value * easeOutCubic(p)));

      if (p < 1) frame = requestAnimationFrame(tick);

    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);

  }, [value, delay, duration, reduced]);



  return <span className="tabular-nums">{display}</span>;

}



function CorrectAvatars({ players, show, reduced }) {

  const list = players || [];

  const visible = list.slice(0, MAX_VISIBLE_AVATARS);

  const overflow = list.length - visible.length;



  if (!show) return <div className="mt-3 h-[72px]" aria-hidden />;



  if (list.length === 0) {

    return (

      <motion.p

        initial={{ opacity: 0 }}

        animate={{ opacity: 1 }}

        className="mt-3 min-h-[72px] text-sm font-semibold text-muted"

      >

        {copy.reveal.nobody}

      </motion.p>

    );

  }



  return (

    <div className="mt-3 flex min-h-[72px] flex-wrap items-center justify-center gap-2">

      {visible.map((p, i) => (

        <motion.div

          key={p.id}

          initial={reduced ? false : { scale: 0, y: 28, rotate: -10 }}

          animate={{ scale: 1, y: 0, rotate: 0 }}

          transition={motionSafe(

            { ...spring.bouncy, delay: i * (reduced ? 0 : 0.11) },

            reduced

          )}

          className="flex flex-col items-center gap-0.5"

        >

          <Avatar config={p.character} size={52} ring />

          <span className="max-w-[4.5rem] truncate text-[10px] font-bold text-paper/90">

            {p.nick}

          </span>

        </motion.div>

      ))}

      {overflow > 0 && (

        <motion.span

          initial={reduced ? false : { scale: 0, opacity: 0 }}

          animate={{ scale: 1, opacity: 1 }}

          className="rounded-full bg-ink-800/90 px-3 py-2 text-sm font-extrabold text-paper ring-2 ring-brand-mid/50"

        >

          +{overflow} more

        </motion.span>

      )}

    </div>

  );

}



function RevealColumn({

  index,

  type,

  count,

  maxCount,

  isCorrect,

  stage,

  correctPlayers,

  timing,

  reduced,

}) {

  const s = tileStyle(type, index);

  const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

  const dim = stage < STAGE_MAP.highlight && !isCorrect;

  const pop = stage >= STAGE_MAP.highlight && isCorrect;

  const showAvatars = stage >= STAGE_MAP.avatars;



  return (

    <motion.div

      layout

      className="flex flex-col items-center"

      animate={{

        scale: pop ? 1.04 : dim ? 0.94 : 1,

        opacity: dim ? 0.38 : 1,

      }}

      transition={motionSafe(spring.soft, reduced)}

    >

      <div className="relative flex h-48 w-full items-end justify-center sm:h-52">

        {pop && !reduced && (

          <motion.span

            className="pointer-events-none absolute bottom-2 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-brand-mid/30"

            initial={{ scale: 0.6, opacity: 0 }}

            animate={{ scale: [0.9, 1.35, 1.1], opacity: [0.5, 0.2, 0.35] }}

            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}

            aria-hidden

          />

        )}

        <motion.div

          className="relative z-10 w-[78%] max-w-[120px] rounded-t-2xl shadow-tile-sm ring-1 ring-paper/15"

          style={{ backgroundColor: s.color }}

          initial={{ height: reduced ? `${Math.max(count > 0 ? 10 : 0, barPct)}%` : 0 }}

          animate={{ height: `${Math.max(count > 0 ? 10 : 0, barPct)}%` }}

          transition={motionSafe(

            { type: "spring", stiffness: 90, damping: 18, delay: index * timing.barStagger },

            reduced

          )}

        />

      </div>



      <motion.div

        className={`relative z-10 mt-3 flex w-full max-w-[200px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-lg font-bold text-paper shadow-tile ${

          pop ? "ring-4 ring-paper shadow-glow" : ""

        }`}

        style={{ backgroundColor: s.color }}

        animate={pop && !reduced ? { y: [0, -4, 0] } : { y: 0 }}

        transition={pop ? { duration: 0.55, ease: "easeOut" } : undefined}

      >

        <span className="text-2xl">{s.glyph}</span>

        <CountUp

          value={count}

          delay={index * timing.barStagger}

          duration={reduced ? 0 : 0.9}

          reduced={reduced}

        />

        {pop && (

          <motion.span

            initial={reduced ? false : { scale: 0, rotate: -20 }}

            animate={{ scale: 1, rotate: 0 }}

            transition={motionSafe(spring.snappy, reduced)}

            className="text-2xl"

          >

            ✓

          </motion.span>

        )}

      </motion.div>



      {isCorrect ? (

        <CorrectAvatars players={correctPlayers} show={showAvatars} reduced={reduced} />

      ) : (

        <div className="mt-3 h-[72px]" aria-hidden />

      )}

    </motion.div>

  );

}



function stageFromReveal(reveal) {

  const n = reveal?.revealStage ?? 0;

  if (n >= 2) return "avatars";

  if (n >= 1) return "highlight";

  return "bars";

}



export default function SocialReveal({

  question,

  image,

  reveal,

  onStandings,

  externalStage,

}) {

  const reduced = useReducedMotion();

  const timing = reveal?.timing || DEFAULT_TIMING;

  const [localStage, setLocalStage] = useState("bars");

  const stage = externalStage ?? localStage;

  const stageNum = STAGE_MAP[stage] ?? 0;

  const isTF = question.type === "tf";

  const maxCount = Math.max(1, ...reveal.counts);

  const correctPlayers = reveal.correctPlayers || [];



  useEffect(() => {

    if (externalStage != null) return undefined;

    setLocalStage("bars");

    const barMs = reduced ? 80 : timing.barMs;

    const highlightMs = reduced ? 40 : timing.highlightMs;

    const t1 = setTimeout(() => setLocalStage("highlight"), barMs);

    const t2 = setTimeout(() => {

      setLocalStage("avatars");

      if (reveal.highlight) sfx.moment();

    }, barMs + highlightMs);

    return () => {

      clearTimeout(t1);

      clearTimeout(t2);

    };

  }, [reveal.index, timing.barMs, timing.highlightMs, externalStage, reduced, reveal.highlight]);



  useEffect(() => {

    if (externalStage) setLocalStage(externalStage);

  }, [externalStage]);



  const showMoment = stageNum >= STAGE_MAP.highlight && reveal.highlight;



  return (

    <div className="alkheelank-screen-host mx-auto flex min-h-[90vh] flex-col items-center">

      <header className="w-full max-w-3xl text-center">

        {image && (

          <img

            src={image}

            alt=""

            className="mx-auto mb-4 hidden h-20 w-20 rounded-xl object-cover ring-1 ring-white/10 sm:block"

          />

        )}

        <h1 className="alkheelank-heading text-3xl sm:text-5xl">{question.question}</h1>

        {reveal.doublePoints && (

          <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-brand-mid/25 px-5 py-2 text-lg font-extrabold text-paper ring-1 ring-brand-mid">

            ⚡ {copy.reveal.doublePoints}

          </div>

        )}

      </header>



      <SocialMoment highlight={reveal.highlight} show={showMoment} />



      <div

        className={`mt-8 w-full max-w-3xl ${

          isTF ? "grid grid-cols-2 gap-6 sm:gap-8" : "grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6"

        }`}

      >

        {question.answers.map((_, i) => (

          <RevealColumn

            key={i}

            index={i}

            type={question.type}

            count={reveal.counts[i]}

            maxCount={maxCount}

            isCorrect={i === reveal.correctIndex}

            stage={stageNum}

            correctPlayers={i === reveal.correctIndex ? correctPlayers : null}

            timing={timing}

            reduced={reduced}

          />

        ))}

      </div>



      {reveal.mode === "teams" && reveal.teamStandings?.length > 0 && (

        <div className="mt-8 w-full max-w-2xl">

          <h3 className="alkheelank-heading mb-3 text-center text-2xl text-muted">Team scores</h3>

          <div className="grid gap-2 sm:grid-cols-2">

            {reveal.teamStandings.map((t) => (

              <div

                key={t.id}

                className="rounded-xl bg-ink-700/70 px-4 py-3 ring-1 ring-white/10"

              >

                <div className="flex items-center justify-between">

                  <span className="font-bold" style={{ color: t.color }}>

                    {t.rank}. {t.name}

                  </span>

                  <span className="font-display text-2xl tabular-nums">

                    {t.score.toLocaleString()}

                  </span>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}



      <div className="sticky bottom-6 mt-auto flex w-full max-w-3xl justify-center pt-10">

        <button type="button" onClick={onStandings} className="alkheelank-btn-primary px-16 text-2xl">

          {copy.reveal.standingsCta} →

        </button>

      </div>

    </div>

  );

}



/** Map server revealStage (0–2) to stage name for synced skips. */

export function revealStageName(revealStage) {

  if (revealStage >= 2) return "avatars";

  if (revealStage >= 1) return "highlight";

  return "bars";

}


