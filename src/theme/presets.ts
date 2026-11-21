// Theme presets, following the Saving Scheme and Smith frontends' theme
// studio. A preset only sets brand colours; spacing and text size are display
// settings (see display.ts). Applying a preset writes CSS variables on <html>,
// so Tailwind classes, Chakra parts and the COLORS tokens all re-colour.

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  /** Buttons, active nav items, links, focus outlines. */
  primary: string;
  /** Paired with `primary` for highlights and charts. */
  secondary: string;
  /** Selected rows, badges and other soft highlight surfaces. */
  accent: string;
  /** Dark brand panel (sign-in screen). */
  sidebar: string;
};

/** Either one of THEME_PRESETS, or `{ ...preset, id: 'custom' }` once a
 *  colour has been hand-picked in the theme studio. */
export type ActiveThemePreset = ThemePreset;

export const THEME_PRESETS: Record<string, ThemePreset> = {
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calm blue actions on a clean white workspace.',
    primary: '#2859d8',
    secondary: '#0e7490',
    accent: '#eef2fc',
    sidebar: '#111e38',
  },
  graphite: {
    id: 'graphite',
    name: 'Graphite',
    description: 'Neutral slate for a quiet, low-colour look.',
    primary: '#334155',
    secondary: '#64748b',
    accent: '#f1f5f9',
    sidebar: '#17202e',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Grounded green highlights for calm workflows.',
    primary: '#087f5b',
    secondary: '#0e7490',
    accent: '#ecf7f3',
    sidebar: '#102c29',
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    description: 'Violet and indigo for a sharper feel.',
    primary: '#7040c8',
    secondary: '#2563eb',
    accent: '#f3effb',
    sidebar: '#201a38',
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    description: 'Warm rose actions with amber tones.',
    primary: '#b93c60',
    secondary: '#b45309',
    accent: '#fbf0f3',
    sidebar: '#321d2b',
  },
};

export const DEFAULT_THEME_PRESET = THEME_PRESETS.ocean;

/** Calls-only key, so it never collides with the other Brightech apps
 *  (they use `theme-studio-preset`) when served from the same origin. */
export const THEME_PRESET_STORAGE_KEY = 'calls-theme-preset';

/** Earlier single-key appearance setting; read once and migrated. */
export const LEGACY_APPEARANCE_KEY = 'calls-appearance';

/** CSS variable each preset field writes to. */
export const PRESET_VARS = {
  primary: '--primary',
  secondary: '--secondary',
  accent: '--primary-light',
  sidebar: '--sidebar-brand',
} as const satisfies Partial<Record<keyof ThemePreset, string>>;

function readLegacyPreset(): ActiveThemePreset | null {
  try {
    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_APPEARANCE_KEY) || 'null');
    return legacy?.preset && THEME_PRESETS[legacy.preset] ? THEME_PRESETS[legacy.preset] : null;
  } catch {
    return null;
  }
}

export function getInitialThemePreset(): ActiveThemePreset {
  try {
    const stored = window.localStorage.getItem(THEME_PRESET_STORAGE_KEY);
    if (!stored) return readLegacyPreset() ?? DEFAULT_THEME_PRESET;
    const parsed = JSON.parse(stored) as Partial<ActiveThemePreset>;
    const base = (parsed.id && THEME_PRESETS[parsed.id]) || DEFAULT_THEME_PRESET;
    return { ...base, ...parsed } as ActiveThemePreset;
  } catch {
    return DEFAULT_THEME_PRESET;
  }
}

export function persistThemePreset(preset: ActiveThemePreset) {
  try {
    window.localStorage.setItem(THEME_PRESET_STORAGE_KEY, JSON.stringify(preset));
  } catch {
    // Storage unavailable (private mode): the preset still applies for this session.
  }
}

export function applyThemePreset(preset: ActiveThemePreset) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  (Object.keys(PRESET_VARS) as (keyof typeof PRESET_VARS)[]).forEach((key) =>
    root.setProperty(PRESET_VARS[key], preset[key]),
  );
}

/** Removes the inline overrides so the base tokens in globals.css apply. */
export function clearThemePresetOverrides() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  Object.values(PRESET_VARS).forEach((prop) => root.removeProperty(prop));
}
