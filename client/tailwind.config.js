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
        raw: "(orientation: landscape) and (max-height: 32rem)",
      },
    },
    extend: {
      colors: {
        // Alkheeloot identity — warm "living-room" charcoal with an amber→orange→coral
        // brand gradient. Cozy family game night, not a neon arcade.
        ink: {
          900: "#1a1814", // deepest background (warm charcoal, not pure black)
          800: "#242019",
          700: "#2e2922",
          600: "#3d362c",
          500: "#4a4133",
        },
        brand: {
          start: "#d97706", // amber-600
          mid: "#ea580c", // orange-600
          end: "#e11d48", // coral / rose-600 (accent pop)
        },
        // Answer tile palette — four distinct, refined (non-neon) hues.
        tile: {
          triangle: "#f43f5e", // rose
          diamond: "#0ea5e9", // sky
          circle: "#f59e0b", // amber
          square: "#10b981", // emerald
        },
        paper: "#faf6f0", // warm off-white text (not pure white)
        muted: "#b8a99a",
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
        tile: "0 8px 0 0 rgba(0,0,0,0.25)",
        "tile-sm": "0 5px 0 0 rgba(0,0,0,0.25)",
        glow: "0 0 44px -12px rgba(217,119,6,0.45)",
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
