import { THEMES } from "../lib/themes.js";
import { useTheme } from "../lib/theme.jsx";

/** Floating theme picker — blue (new) vs classic (orange + charcoal). */
export default function ThemeToggle() {
  const { themeId, setTheme } = useTheme();

  return (
    <div
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 flex items-center gap-1 rounded-2xl bg-surface-elevated/95 p-1 shadow-card ring-1 ring-edge backdrop-blur"
      role="group"
      aria-label="Color theme"
    >
      {Object.values(THEMES).map((theme) => {
        const active = themeId === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            aria-pressed={active}
            title={theme.description}
            onClick={() => setTheme(theme.id)}
            className={`min-h-touch rounded-xl px-3 py-2 text-xs font-bold transition sm:px-3.5 sm:text-sm ${
              active
                ? theme.id === "classic"
                  ? "bg-gradient-to-r from-brand-start to-brand-mid text-white shadow-glow"
                  : "bg-gradient-to-r from-brand-start via-brand-mid to-brand-end text-white shadow-glow"
                : "text-muted hover:bg-surface-muted hover:text-ink-900"
            }`}
          >
            <span className="mr-1" aria-hidden="true">
              {theme.emoji}
            </span>
            {theme.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
