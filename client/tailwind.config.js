/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // AlkheelanK identity — deep "midnight arcade" indigo with a violet→fuchsia
        // brand gradient. Distinct from Kahoot's purple/magenta brand.
        ink: {
          900: "#0e0f2e", // deepest background (not pure black)
          800: "#15163d",
          700: "#1d1e52",
          600: "#262a6b",
          500: "#343a86",
        },
        brand: {
          start: "#7c3aed", // violet-600
          mid: "#c026d3", // fuchsia-600
          end: "#f43f5e", // rose-500
        },
        // Answer tile palette — four distinct, refined (non-neon) hues.
        tile: {
          triangle: "#f43f5e", // rose
          diamond: "#0ea5e9", // sky
          circle: "#f59e0b", // amber
          square: "#10b981", // emerald
        },
        paper: "#f5f6ff", // off-white text (not pure white)
        muted: "#a6a8d8",
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
        glow: "0 0 60px -10px rgba(192,38,211,0.6)",
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
