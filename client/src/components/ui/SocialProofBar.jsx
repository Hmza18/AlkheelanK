import { motion } from "framer-motion";
import Avatar from "../characters.jsx";
import { copy } from "../../lib/copy.js";

const DEMO_AVATARS = [
  { base: "fox", accessory: "shades", color: "#f43f5e" },
  { base: "bunny", accessory: "crown", color: "#3b82f6" },
  { base: "robot", accessory: "wizard", color: "#10b981" },
  { base: "owl", accessory: "halo", color: "#f59e0b" },
  { base: "dragon", accessory: "horns", color: "#7c3aed" },
];

export default function SocialProofBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 26 }}
      className="k-social-proof"
    >
      <div className="k-social-proof__avatars" aria-hidden>
        {DEMO_AVATARS.map((config, i) => (
          <span key={config.base} className="k-social-proof__avatar" style={{ zIndex: DEMO_AVATARS.length - i }}>
            <Avatar config={config} size={34} ring />
          </span>
        ))}
      </div>
      <div className="k-social-proof__text">
        <span className="k-badge-live">
          <span className="k-badge-live__dot" />
          Live
        </span>
        <span className="text-sm font-semibold text-ink-900">{copy.landing.socialStat}</span>
      </div>
    </motion.div>
  );
}
