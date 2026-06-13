export const THEME_STORAGE_KEY = "alkheelank-theme";

/** @typedef {"blue" | "classic"} ThemeId */

export const THEMES = {
  blue: {
    id: "blue",
    label: "Blue",
    shortLabel: "Blue",
    emoji: "💙",
    description: "White cards on a bright blue background.",
    metaColor: "#dbeafe",
    qrBg: "#ffffff",
    qrFg: "#1d4ed8",
  },
  classic: {
    id: "classic",
    label: "Classic",
    shortLabel: "Classic",
    emoji: "🔥",
    description: "Orange accents on the original dark charcoal look.",
    metaColor: "#1a1814",
    qrBg: "#faf6f0",
    qrFg: "#ea580c",
  },
};

/** @returns {ThemeId} */
export function readStoredTheme() {
  if (typeof window === "undefined") return "blue";
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return raw === "classic" ? "classic" : "blue";
}

/** @param {ThemeId} id */
export function applyTheme(id) {
  const theme = THEMES[id] ?? THEMES.blue;
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.id === "classic" ? "dark" : "light";

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.metaColor);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    // private browsing — theme still applies for this session
  }
}

/** @param {ThemeId} id */
export function persistTheme(id) {
  applyTheme(id);
}

/** @param {ThemeId} current */
export function otherTheme(current) {
  return current === "blue" ? "classic" : "blue";
}
