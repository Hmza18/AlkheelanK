// Alkheeloot design tokens — white + blue theme.

export const color = {
  surface: {
    DEFAULT: "#dbeafe",
    elevated: "#ffffff",
    muted: "#bfdbfe",
  },
  ink: {
    900: "#1e3a8a",
    800: "#1e40af",
    700: "#1d4ed8",
    600: "#2563eb",
    500: "#3b82f6",
  },
  brand: {
    start: "#60a5fa",
    mid: "#3b82f6",
    end: "#2563eb",
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
  focus: "rgba(59, 130, 246, 0.45)",
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
  card: "0 4px 20px -8px rgba(37, 99, 235, 0.14)",
  tile: "0 8px 0 0 rgba(37, 99, 235, 0.22)",
  tileSm: "0 5px 0 0 rgba(37, 99, 235, 0.22)",
  glow: "0 0 40px -12px rgba(59, 130, 246, 0.35)",
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
