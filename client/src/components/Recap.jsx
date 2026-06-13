import { motion } from "framer-motion";

import Avatar from "./characters.jsx";

import { copy } from "../lib/copy.js";

import { spring } from "../lib/motion.js";



export default function Recap({ recap, title, standings = [] }) {

  const top = standings.slice(0, 5);

  const stats = [

    recap?.fastestFinger && {

      emoji: "⚡",

      label: copy.social.fastest,

      person: recap.fastestFinger,

      value: `${(recap.fastestFinger.timeMs / 1000).toFixed(2)}s`,

      tint: "#3b82f6",

    },

    recap?.biggestComeback && {

      emoji: "🚀",

      label: copy.social.comeback,

      person: recap.biggestComeback,

      value: `+${recap.biggestComeback.gained} spot${recap.biggestComeback.gained === 1 ? "" : "s"}`,

      tint: "#22c55e",

    },

    recap?.mostConfidentWrong && {

      emoji: "😅",

      label: copy.social.confidentWrong,

      person: recap.mostConfidentWrong,

      value: `${(recap.mostConfidentWrong.timeMs / 1000).toFixed(2)}s`,

      tint: "#f43f5e",

    },

  ].filter(Boolean);



  return (

    <motion.div

      initial={{ opacity: 0, scale: 0.96, y: 16 }}

      animate={{ opacity: 1, scale: 1, y: 0 }}

      transition={spring.soft}

      className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] bg-surface-elevated p-7 shadow-2xl ring-1 ring-edge landscapePhone:max-h-[calc(100dvh-2rem)] landscapePhone:overflow-y-auto landscapePhone:p-4 landscapePhone:rounded-3xl"

    >

      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" />



      <div className="flex items-center justify-between">

        <span className="alkheelank-heading text-xl alkheelank-gradient-text">Alkheeloot</span>

        <span className="alkheelank-label rounded-full bg-surface-muted px-3 py-1 normal-case">Party recap</span>

      </div>

      <p className="mt-1 truncate text-sm text-muted">{title}</p>



      {recap?.winner && (

        <div className="mt-5 flex items-center gap-4 rounded-3xl bg-brand-gradient-soft-x p-4 ring-1 ring-edge">

          <div className="relative">

            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</span>

            <Avatar config={recap.winner.character} size={64} ring />

          </div>

          <div className="min-w-0">

            <p className="alkheelank-label normal-case text-brand-end">Champion</p>

            <p className="truncate alkheelank-heading text-2xl">{recap.winner.nick}</p>

            <p className="text-sm text-muted">{recap.winner.score.toLocaleString()} pts</p>

          </div>

        </div>

      )}



      {stats.length > 0 && (

        <div className="mt-4 space-y-2.5">

          {stats.map((s) => (

            <div

              key={s.label}

              className="flex items-center gap-3 rounded-2xl bg-surface-muted p-3 ring-1 ring-edge"

            >

              <span

                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl"

                style={{ backgroundColor: `${s.tint}22` }}

              >

                {s.emoji}

              </span>

              <div className="min-w-0 flex-1">

                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: s.tint }}>

                  {s.label}

                </p>

                <p className="truncate font-bold text-ink-900">{s.person.nick}</p>

              </div>

              <Avatar config={s.person.character} size={32} />

              <span className="shrink-0 alkheelank-heading text-lg tabular-nums">{s.value}</span>

            </div>

          ))}

        </div>

      )}



      {top.length > 0 && (

        <div className="mt-5">

          <p className="alkheelank-label mb-2">Top five</p>

          <div className="space-y-1.5">

            {top.map((p, i) => (

              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2">

                <span className="w-5 text-center font-display font-bold text-muted">

                  {["🥇", "🥈", "🥉"][i] || i + 1}

                </span>

                <Avatar config={p.character} size={28} />

                <span className="min-w-0 flex-1 truncate font-semibold text-ink-900">{p.nick}</span>

                <span className="shrink-0 font-display font-bold tabular-nums text-ink-900">

                  {p.score.toLocaleString()}

                </span>

              </div>

            ))}

          </div>

        </div>

      )}



      <div className="mt-5 flex items-center justify-between border-t border-edge pt-4 text-xs text-muted">

        <span>

          {recap?.totalPlayers ?? top.length} player{(recap?.totalPlayers ?? top.length) === 1 ? "" : "s"} ·{" "}

          {recap?.totalQuestions ?? "—"} rounds

        </span>

        <span className="font-semibold" aria-hidden>▲ ◆ ● ■</span>

      </div>

    </motion.div>

  );

}


