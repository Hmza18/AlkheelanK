// AlkheelanK design tokens — single source for spacing, motion, semantic colors, and UI rhythm.
// Tailwind mirrors these in tailwind.config.js; components import here for JS-driven styles.

export const color = {
  ink: {
    900: "#0e0f2e",
    800: "#15163d",
    700: "#1d1e52",
    600: "#262a6b",
    500: "#343a86",
  },
  brand: {
    start: "#7c3aed",
    mid: "#c026d3",
    end: "#f43f5e",
  },
  tile: {
    triangle: "#f43f5e",
    diamond: "#0ea5e9",
    circle: "#f59e0b",
    square: "#10b981",
  },
  paper: "#f5f6ff",
  muted: "#a6a8d8",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#f43f5e",
  focus: "rgba(192, 38, 211, 0.55)",
};

export const space = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
};

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.75rem",
  full: "9999px",
};

export const shadow = {
  card: "0 8px 32px -8px rgba(14, 15, 46, 0.65)",
  tile: "0 8px 0 0 rgba(0,0,0,0.25)",
  tileSm: "0 5px 0 0 rgba(0,0,0,0.25)",
  glow: "0 0 60px -10px rgba(192,38,211,0.6)",
};

export const type = {
  display: '"Fredoka", system-ui, sans-serif',
  body: '"Inter", system-ui, sans-serif',
  h1: "clamp(2rem, 5vw, 3.25rem)",
  h2: "clamp(1.5rem, 4vw, 2.25rem)",
  h3: "1.25rem",
  bodyLg: "1.125rem",
  body: "1rem",
  sm: "0.875rem",
  xs: "0.75rem",
};

export const state = {
  ring: "ring-2 ring-brand-mid/60 ring-offset-2 ring-offset-ink-900",
  hover: "hover:brightness-110",
  press: "active:translate-y-0.5",
  disabled: "opacity-50 cursor-not-allowed",
  selected: "bg-brand-mid/25 ring-brand-mid text-paper",
};

export const layout = {
  hostMax: "max-w-6xl",
  hostNarrow: "max-w-5xl",
  playerMax: "max-w-md",
  hostPad: "px-6 py-6",
  playerPad: "px-5 py-6",
};
