// Kheelan design tokens — mirrors CSS variables in index.css.

export const color = {
  surface: {
    DEFAULT: "#faf8ff",
    elevated: "#ffffff",
    muted: "#f3eeff",
  },
  ink: {
    900: "#1c1033",
    800: "#1e293b",
    700: "#334155",
    600: "#475569",
    500: "#64748b",
  },
  brand: {
    start: "#a78bfa",
    mid: "#7c3aed",
    end: "#6d28d9",
  },
  tile: {
    triangle: "#f43f5e",
    diamond: "#3b82f6",
    circle: "#f59e0b",
    square: "#10b981",
  },
  paper: "#ffffff",
  muted: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#f43f5e",
  focus: "rgba(124, 58, 237, 0.45)",
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
  "3xl": "1.25rem",
  full: "9999px",
};

export const shadow = {
  card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px -12px rgba(15, 23, 42, 0.08)",
  tile: "0 8px 0 0 rgba(0, 0, 0, 0.25)",
  tileSm: "0 5px 0 0 rgba(0, 0, 0, 0.25)",
  glow: "0 4px 28px -8px rgba(124, 58, 237, 0.35)",
};

export const type = {
  display: '"Plus Jakarta Sans", system-ui, sans-serif',
  body: '"Plus Jakarta Sans", system-ui, sans-serif',
  h1: "clamp(2rem, 5vw, 3.25rem)",
  h2: "clamp(1.5rem, 4vw, 2.25rem)",
  h3: "1.25rem",
  bodyLg: "1.125rem",
  body: "1rem",
  sm: "0.875rem",
  xs: "0.75rem",
};

export const state = {
  ring: "ring-2 ring-brand-mid/60 ring-offset-2 ring-offset-surface-elevated",
  hover: "hover:brightness-110",
  press: "active:translate-y-0.5",
  disabled: "opacity-50 cursor-not-allowed",
  selected: "bg-brand-mid/15 ring-brand-mid text-ink-900",
};

export const layout = {
  hostMax: "max-w-6xl",
  hostNarrow: "max-w-5xl",
  playerMax: "max-w-md",
  hostPad: "px-6 py-6",
  playerPad: "px-5 py-6",
};

export const touch = {
  min: "2.75rem",
  comfortable: "3rem",
};

export const safe = {
  top: "env(safe-area-inset-top, 0px)",
  right: "env(safe-area-inset-right, 0px)",
  bottom: "env(safe-area-inset-bottom, 0px)",
  left: "env(safe-area-inset-left, 0px)",
};
