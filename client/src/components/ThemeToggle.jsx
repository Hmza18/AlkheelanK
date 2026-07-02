import { AnimatePresence, motion } from "framer-motion";
import { otherTheme, THEMES } from "../lib/themes.js";
import { useTheme } from "../lib/theme.jsx";

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.85" />
      <path
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        d="M12 2.75v2.25M12 19v2.25M2.75 12h2.25M19 12h2.25M5.4 5.4l1.6 1.6M17 17l1.6 1.6M5.4 18.6l1.6-1.6M17 7l1.6-1.6"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.4 14.9A8.5 8.5 0 1110.4 3.1 7.1 7.1 0 0020.4 14.9z"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Inline sun/moon toggle — lives in Settings, not fixed on screen. */
export default function ThemeToggle() {
  const { themeId, toggleTheme } = useTheme();
  const isLight = themeId === "light";
  const next = THEMES[otherTheme(themeId)];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`alkheelank-theme-btn ${isLight ? "alkheelank-theme-btn--day" : "alkheelank-theme-btn--night"}`}
      title={`${THEMES[themeId].label} — switch to ${next.label}`}
      aria-label={`Switch theme to ${next.label}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={themeId}
          className="alkheelank-theme-btn__glyph"
          initial={{ opacity: 0, rotate: -28, scale: 0.75 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 28, scale: 0.75 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {isLight ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
