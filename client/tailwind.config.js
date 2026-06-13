/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      landscapePhone: {
        raw: "(orientation: landscape) and (max-height: 36rem)",
      },
    },
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--alkheelank-surface)",
          elevated: "var(--alkheelank-surface-elevated)",
          muted: "var(--alkheelank-surface-muted)",
        },
        ink: {
          900: "var(--alkheelank-ink-900)",
          800: "var(--alkheelank-ink-800)",
          700: "var(--alkheelank-ink-700)",
          600: "var(--alkheelank-ink-600)",
          500: "var(--alkheelank-ink-500)",
        },
        brand: {
          start: "rgb(var(--alkheelank-rgb-brand-start) / <alpha-value>)",
          mid: "rgb(var(--alkheelank-rgb-brand-mid) / <alpha-value>)",
          end: "rgb(var(--alkheelank-rgb-brand-end) / <alpha-value>)",
        },
        tile: {
          triangle: "#f43f5e",
          diamond: "#3b82f6",
          circle: "#f59e0b",
          square: "#10b981",
        },
        paper: "var(--alkheelank-paper)",
        muted: "rgb(var(--alkheelank-rgb-muted) / <alpha-value>)",
        edge: {
          DEFAULT: "var(--alkheelank-ring)",
          scrim: "var(--alkheelank-overlay)",
        },
        success: "#10b981",
        warning: "#f59e0b",
        error: "#f43f5e",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        touch: "2.75rem",
        "touch-lg": "3rem",
      },
      minHeight: {
        screen: "100dvh",
        touch: "2.75rem",
        "touch-lg": "3rem",
      },
      minWidth: {
        touch: "2.75rem",
        "touch-lg": "3rem",
      },
      borderRadius: {
        card: "1.75rem",
      },
      transitionDuration: {
        fast: "220ms",
        normal: "350ms",
      },
      fontFamily: {
        display: ['"Fredoka"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        tile: "0 8px 0 0 rgba(0, 0, 0, 0.25)",
        "tile-sm": "0 5px 0 0 rgba(0, 0, 0, 0.25)",
        glow: "var(--alkheelank-shadow-glow)",
        card: "var(--alkheelank-shadow-card)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.35s cubic-bezier(0.18,0.89,0.32,1.28) both",
        float: "float 6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
