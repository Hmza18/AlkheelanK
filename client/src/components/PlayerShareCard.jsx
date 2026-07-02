import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Avatar from "./characters.jsx";
import GlowCard from "./ui/GlowCard.jsx";
import { Mark } from "./Logo.jsx";
import { BRAND } from "../lib/brand.js";
import { copy } from "../lib/copy.js";
import { spring } from "../lib/motion.js";
import { isPodiumRank } from "../lib/rankDisplay.js";
import { sfx } from "../lib/sound.js";

function pickShareStat({ rank, recap, nick }) {
  if (isPodiumRank(rank)) return copy.share.statPodium;
  if (rank <= 5) return copy.share.statClutch;
  if (recap?.fastestFinger?.nick === nick) return copy.social.fastest;
  if (recap?.biggestComeback?.nick === nick) return copy.social.comeback;
  if (recap?.mostConfidentWrong?.nick === nick) return copy.social.confidentWrong;
  if (rank <= Math.max(3, Math.floor((recap?.totalPlayers ?? 8) / 2))) return copy.share.statMid;
  return copy.share.statLearning;
}

export default function PlayerShareCard({ me, finalRank, recap, quizTitle }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!me || !finalRank) return null;

  const rank = finalRank.rank;
  const score = finalRank.score ?? 0;
  const stat = pickShareStat({ rank, recap, nick: me.nick });
  const shareText = copy.share.copyTemplate(rank, BRAND.domain);
  const podium = isPodiumRank(rank);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      sfx.confirm();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring.bouncy}
        className="relative mx-auto w-full max-w-md"
      >
        <GlowCard intense className="w-full">
          <div className="relative overflow-hidden p-7 landscapePhone:p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mark size={32} />
                <span className="font-display text-lg font-extrabold text-ink-900">{BRAND.name}</span>
              </div>
              <span className="k-badge-live">
                <span className="k-badge-live__dot" />
                Done
              </span>
            </div>

            {quizTitle && <p className="mt-1 truncate text-sm text-muted">{quizTitle}</p>}

            <div className="relative mt-5 flex flex-col items-center overflow-hidden rounded-3xl bg-brand-gradient-soft-x p-6 ring-1 ring-brand-mid/25">
              <div className="pointer-events-none absolute inset-0 bg-brand-gradient-soft-br opacity-60" aria-hidden />
              <Avatar config={me.character} size={72} ring />
              <p className="relative mt-3 truncate font-display text-2xl font-bold text-ink-900">{me.nick}</p>
              <p
                className={`relative mt-1 font-display text-5xl font-extrabold tabular-nums ${
                  podium ? "k-shimmer-text" : "text-brand-mid"
                }`}
              >
                #{rank}
              </p>
              <p className="relative mt-1 text-sm font-semibold text-muted">{score.toLocaleString()} pts</p>
              <p className="relative mt-3 text-center text-sm font-medium text-muted">{stat}</p>
            </div>

            <div className="relative mt-5 flex flex-col gap-2">
              <button type="button" onClick={copyLink} className="alkheelank-btn-primary k-btn-glow w-full">
                {copied ? copy.share.copySuccess : "Copy share text"}
              </button>
              <button type="button" onClick={() => navigate("/host?guest=1")} className="alkheelank-btn-ghost w-full">
                {copy.share.hostCta}
              </button>
              <button type="button" onClick={() => navigate("/")} className="text-sm text-muted hover:text-ink-900">
                {copy.player.playAgain}
              </button>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      <AnimatePresence>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="k-toast"
            role="status"
          >
            {copy.share.copySuccess}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}
