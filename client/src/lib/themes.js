import { BRAND, readStorage } from "./brand.js";

export const THEME_STORAGE_KEY = `${BRAND.storagePrefix}.theme`;
const LEGACY_THEME_KEY = "alkheelank-theme";

/** @typedef {"light" | "dark"} ThemeId */

export const THEMES = {
  light: {
    id: "light",
    label: "Light",
    shortLabel: "Light",
    emoji: "☀️",
    description: "Clean surfaces for bright rooms and projectors.",
    metaColor: "#faf8ff",
  },
  dark: {
    id: "dark",
    label: "Dark",
    shortLabel: "Dark",
    emoji: "🌙",
    description: "Low-glare look for TVs and evening sessions.",
    metaColor: "#0e0a1f",
  },
};

/** @returns {ThemeId} */
export function readStoredTheme() {
  if (typeof window === "undefined") return "dark";
  const raw =
    readStorage(THEME_STORAGE_KEY, { legacyKey: LEGACY_THEME_KEY }) ??
    localStorage.getItem(LEGACY_THEME_KEY);
  if (raw === "light" || raw === "blue") return "light";
  if (raw === "dark" || raw === "classic") return "dark";
  return "dark";
}

/** @param {ThemeId} id */
export function applyTheme(id) {
  const theme = THEMES[id] ?? THEMES.light;
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.id === "dark" ? "dark" : "light";

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.metaColor);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    /* private browsing */
  }
}

/** @param {ThemeId} id */
export function persistTheme(id) {
  applyTheme(id);
}

/** @param {ThemeId} current */
export function otherTheme(current) {
  return current === "light" ? "dark" : "light";
}
