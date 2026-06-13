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
        // Alkheeloot — white cards on a true blue wash, kid-friendly everywhere.
        surface: {
          DEFAULT: "#dbeafe", // blue-100 page wash
          elevated: "#ffffff",
          muted: "#bfdbfe", // blue-200
        },
        ink: {
          900: "#1e3a8a", // blue-900 text
          800: "#1e40af",
          700: "#1d4ed8",
          600: "#2563eb",
          500: "#3b82f6",
        },
        brand: {
          start: "#60a5fa", // blue-400
          mid: "#3b82f6", // blue-500
          end: "#2563eb", // blue-600
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
        tile: "0 8px 0 0 rgba(37, 99, 235, 0.22)",
        "tile-sm": "0 5px 0 0 rgba(37, 99, 235, 0.22)",
        glow: "0 0 40px -12px rgba(59, 130, 246, 0.35)",
        card: "0 4px 20px -8px rgba(37, 99, 235, 0.14)",
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
