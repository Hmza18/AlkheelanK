import { motion } from "framer-motion";

/** Floating +points badge — Marc Lou juice on correct answers. */
export default function PointsPop({ show, points = 850, className = "" }) {
  if (!show) return null;

  return (
    <motion.div
      className={`k-points-pop ${className}`}
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: -28 }}
      exit={{ opacity: 0, y: -48 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
    >
      +{points.toLocaleString()} pts
    </motion.div>
  );
}
