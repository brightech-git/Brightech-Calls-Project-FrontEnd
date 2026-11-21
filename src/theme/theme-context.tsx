'use client';

import * as React from 'react';
import {
  applyDisplay,
  DEFAULT_DISPLAY,
  parseDisplay,
  THEME_DISPLAY_STORAGE_KEY,
  type DisplaySettings,
} from './display';
import {
  DEFAULT_THEME_PRESET,
  LEGACY_APPEARANCE_KEY,
  PRESET_VARS,
  THEME_PRESET_STORAGE_KEY,
  THEME_PRESETS,
} from './presets';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from './tokens';

interface ThemeContextValue extends DisplaySettings {
  colors: typeof COLORS;
  font: typeof FONT;
  radius: typeof RADIUS;
  spacing: typeof SPACING;
  shadow: typeof SHADOW;
  setDisplay: (next: Partial<DisplaySettings>) => void;
  resetDisplay: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function readStoredDisplay(): DisplaySettings {
  try {
    // Fall back to the earlier single `calls-appearance` key once.
    const raw =
      window.localStorage.getItem(THEME_DISPLAY_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_APPEARANCE_KEY);
    return parseDisplay(raw);
  } catch {
    return DEFAULT_DISPLAY;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // ThemeScript has already set the data attributes before paint, and the
  // app renders client-side only, so the lazy initializer matches the DOM.
  const [display, setDisplayState] = React.useState<DisplaySettings>(() =>
    typeof window === 'undefined' ? DEFAULT_DISPLAY : readStoredDisplay(),
  );

  React.useEffect(() => {
    applyDisplay(display);
  }, [display]);

  const save = React.useCallback((next: DisplaySettings) => {
    setDisplayState(next);
    applyDisplay(next);
    try {
      window.localStorage.setItem(THEME_DISPLAY_STORAGE_KEY, JSON.stringify(next));
      window.localStorage.removeItem(LEGACY_APPEARANCE_KEY);
    } catch {
      /* Keep the setting for this session. */
    }
  }, []);

  const setDisplay = React.useCallback(
    (next: Partial<DisplaySettings>) => save({ ...display, ...next }),
    [display, save],
  );

  const resetDisplay = React.useCallback(() => save(DEFAULT_DISPLAY), [save]);

  // Cross-tab sync, like the reference apps.
  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_DISPLAY_STORAGE_KEY) return;
      const next = parseDisplay(event.newValue);
      setDisplayState(next);
      applyDisplay(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      ...display,
      colors: COLORS,
      font: FONT,
      radius: RADIUS,
      spacing: SPACING,
      shadow: SHADOW,
      setDisplay,
      resetDisplay,
    }),
    [display, setDisplay, resetDisplay],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be used within a <ThemeProvider>');
  return ctx;
}

/** Inline script for <head>: applies the saved display settings and preset
 *  colours before the first paint, so there is no flash of the default theme. */
export function ThemeScript() {
  const script = `
    (function () {
      try {
        var root = document.documentElement;
        var legacy = JSON.parse(localStorage.getItem(${JSON.stringify(LEGACY_APPEARANCE_KEY)}) || "null") || {};
        var d = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_DISPLAY_STORAGE_KEY)}) || "null") || legacy;
        root.dataset.density = d.density === "comfortable" ? "comfortable" : "compact";
        root.dataset.textSize = d.textSize === "large" ? "large" : "standard";
        var presets = ${JSON.stringify(THEME_PRESETS)};
        var p = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_PRESET_STORAGE_KEY)}) || "null") || presets[legacy.preset];
        if (p && p.primary) {
          var base = presets[p.id] || ${JSON.stringify(DEFAULT_THEME_PRESET)};
          var vars = ${JSON.stringify(PRESET_VARS)};
          for (var k in vars) root.style.setProperty(vars[k], p[k] || base[k]);
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
