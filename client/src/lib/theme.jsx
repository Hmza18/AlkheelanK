import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, otherTheme, readStoredTheme, THEMES } from "./themes.js";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  const setTheme = (id) => {
    applyTheme(id);
    setThemeId(id);
  };

  const value = useMemo(
    () => ({
      themeId,
      theme: THEMES[themeId],
      setTheme,
      toggleTheme: () => setTheme(otherTheme(themeId)),
    }),
    [themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
