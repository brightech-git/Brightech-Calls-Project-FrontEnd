// Display settings: how dense and how large the UI is. Kept apart from the
// colour preset, the same way the reference apps keep light/dark mode apart.
// Applied as data attributes on <html>; app/globals.css maps them to tokens.

export type Density = 'compact' | 'comfortable';
export type TextSize = 'standard' | 'large';

export interface DisplaySettings {
  density: Density;
  textSize: TextSize;
}

export const DEFAULT_DISPLAY: DisplaySettings = { density: 'compact', textSize: 'standard' };

/** Calls-only key (the reference apps use `theme-mode`). */
export const THEME_DISPLAY_STORAGE_KEY = 'calls-theme-display';

export function parseDisplay(raw: string | null): DisplaySettings {
  try {
    const value = JSON.parse(raw || 'null') ?? {};
    return {
      density: value.density === 'comfortable' ? 'comfortable' : 'compact',
      textSize: value.textSize === 'large' ? 'large' : 'standard',
    };
  } catch {
    return DEFAULT_DISPLAY;
  }
}

export function applyDisplay(display: DisplaySettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.density = display.density;
  root.dataset.textSize = display.textSize;
}
