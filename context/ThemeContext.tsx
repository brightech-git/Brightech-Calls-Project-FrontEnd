"use client";
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { APPEARANCE_KEY, Appearance, COLORS, DEFAULT_APPEARANCE, FONT, THEME_PRESETS } from '@/utils/theme';
const EVENT = 'calls-appearance-change';
let sessionValue: string | null = null;
function snapshot() { try { return localStorage.getItem(APPEARANCE_KEY) ?? sessionValue; } catch { return sessionValue; } }
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback); window.addEventListener('storage', callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); };
}
function parse(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? '{}');
    return { preset: Object.hasOwn(THEME_PRESETS, value.preset) ? value.preset : 'ocean', density: value.density === 'compact' ? 'compact' : 'comfortable', textSize: value.textSize === 'large' ? 'large' : 'standard' };
  } catch { return DEFAULT_APPEARANCE; }
}
function apply(value: Appearance) {
  const root = document.documentElement; const palette = THEME_PRESETS[value.preset];
  root.style.setProperty('--primary', palette.primary); root.style.setProperty('--secondary', palette.secondary); root.style.setProperty('--sidebar', palette.sidebar);
  root.dataset.density = value.density; root.dataset.textSize = value.textSize;
}
interface ThemeContextType {
  colors: typeof COLORS; font: typeof FONT; appearance: Appearance;
  setAppearance: (next: Partial<Appearance>) => void; resetAppearance: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null); const appearance = parse(raw);
  useEffect(() => { apply(parse(raw)); }, [raw]);
  const save = (next: Appearance) => {
    sessionValue = JSON.stringify(next);
    try { localStorage.setItem(APPEARANCE_KEY, sessionValue); } catch { /* Settings still work for this session. */ }
    apply(next); window.dispatchEvent(new Event(EVENT));
  };
  return <ThemeContext.Provider value={{ colors: COLORS, font: FONT, appearance, setAppearance: (next) => save({ ...appearance, ...next }), resetAppearance: () => save(DEFAULT_APPEARANCE) }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error('useTheme must be used within a ThemeProvider'); return context; }
