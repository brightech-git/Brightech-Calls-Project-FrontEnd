'use client';

import * as React from 'react';
import {
  applyThemePreset,
  clearThemePresetOverrides,
  DEFAULT_THEME_PRESET,
  getInitialThemePreset,
  LEGACY_APPEARANCE_KEY,
  persistThemePreset,
  THEME_PRESET_STORAGE_KEY,
  THEME_PRESETS,
  type ActiveThemePreset,
} from './presets';

export type PresetColorKey = 'primary' | 'secondary' | 'accent' | 'sidebar';

interface ThemeStudioContextValue {
  preset: ActiveThemePreset;
  /** Switch to one of the named THEME_PRESETS. */
  setPreset: (preset: ActiveThemePreset) => void;
  /** Hand-pick one colour on top of the active preset; marks it "custom". */
  setPresetColor: (key: PresetColorKey, value: string) => void;
  resetPreset: () => void;
}

const ThemeStudioContext = React.createContext<ThemeStudioContextValue | null>(null);

export function ThemeStudioProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer so there is no extra render; ThemeScript has already
  // painted these colours, the effect below only keeps React and the DOM in step.
  const [preset, setPresetState] = React.useState<ActiveThemePreset>(() =>
    typeof window === 'undefined' ? DEFAULT_THEME_PRESET : getInitialThemePreset(),
  );

  React.useEffect(() => {
    applyThemePreset(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount; setters apply later changes
  }, []);

  const save = React.useCallback((next: ActiveThemePreset) => {
    applyThemePreset(next);
    persistThemePreset(next);
    try {
      window.localStorage.removeItem(LEGACY_APPEARANCE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setPreset = React.useCallback(
    (next: ActiveThemePreset) => {
      setPresetState(next);
      save(next);
    },
    [save],
  );

  const setPresetColor = React.useCallback(
    (key: PresetColorKey, value: string) => {
      setPresetState((current) => {
        const next: ActiveThemePreset = {
          ...current,
          id: 'custom',
          name: 'Custom',
          description: 'Your own hand-picked colours.',
          [key]: value,
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  const resetPreset = React.useCallback(() => {
    clearThemePresetOverrides();
    setPresetState(DEFAULT_THEME_PRESET);
    save(DEFAULT_THEME_PRESET);
  }, [save]);

  // Cross-tab sync: another Calls tab changing the preset updates this one.
  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_PRESET_STORAGE_KEY) return;
      const next = getInitialThemePreset();
      setPresetState(next);
      applyThemePreset(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = React.useMemo<ThemeStudioContextValue>(
    () => ({ preset, setPreset, setPresetColor, resetPreset }),
    [preset, setPreset, setPresetColor, resetPreset],
  );

  return <ThemeStudioContext.Provider value={value}>{children}</ThemeStudioContext.Provider>;
}

export function useThemeStudio(): ThemeStudioContextValue {
  const ctx = React.useContext(ThemeStudioContext);
  if (!ctx) throw new Error('useThemeStudio() must be used within a <ThemeStudioProvider>');
  return ctx;
}

export { THEME_PRESETS };
