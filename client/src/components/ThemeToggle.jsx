import { otherTheme, THEMES } from "../lib/themes.js";
import { useTheme } from "../lib/theme.jsx";

function PaletteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3a9 9 0 00-9 8.25c0 3.59 2.12 6.68 5.18 8.09L8 21.5a1 1 0 001.62.78l1.55-1.16A9.04 9.04 0 0012 21a9 9 0 100-18z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="8.25" cy="10.5" r="1.1" fill="currentColor" />
      <circle cx="12" cy="8.25" r="1.1" fill="currentColor" />
      <circle cx="15.75" cy="10.5" r="1.1" fill="currentColor" />
      <circle cx="14.25" cy="14.25" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** Tap to swap between blue and classic themes. */
export default function ThemeToggle() {
  const { themeId, toggleTheme } = useTheme();
  const nextId = otherTheme(themeId);
  const current = THEMES[themeId];
  const next = THEMES[nextId];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="alkheelank-theme-btn"
      title={`${current.label} theme — switch to ${next.label}`}
      aria-label={`Switch theme to ${next.label}`}
    >
      <PaletteIcon />
    </button>
  );
}
