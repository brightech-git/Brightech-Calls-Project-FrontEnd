"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { COLORS, FONT } from "@/utils/theme";
import { dmSans, inter } from "@/utils/fonts";

interface ThemeContextType {
  colors: typeof COLORS;
  font: typeof FONT;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Primary/secondary drive the global background and text color; kept in
  // sync here so utils/theme.ts remains the single source of truth.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--bg", COLORS.primary);
    root.setProperty("--text-main", COLORS.secondary);
    root.setProperty("--primary", COLORS.primary);
    root.setProperty("--secondary", COLORS.secondary);
    root.setProperty("--font-sans", `var(${dmSans.variable}), var(${inter.variable}), sans-serif`);
  }, []);

  const value = useMemo(() => ({ colors: COLORS, font: FONT }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
