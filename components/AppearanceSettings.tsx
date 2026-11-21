'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette, X, RotateCcw, Check } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { THEME_PRESETS, ThemePreset } from '@/utils/theme';
export default function AppearanceSettings() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { appearance, setAppearance, resetAppearance } = useTheme();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div
      className="relative"
      ref={root}
    >
      <button
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border-0 bg-slate-50 text-muted transition-colors hover:bg-brand-soft hover:text-brand"
        aria-label="Appearance settings"
        aria-expanded={open}
        aria-controls="appearance-panel"
        onClick={() => setOpen(!open)}
      >
        <Palette size={18} />
      </button>
      {open && (
        <section
          id="appearance-panel"
          className="absolute top-[calc(100%+12px)] right-0 w-80 max-w-[calc(100vw-32px)] rounded-lg border border-line bg-white p-4 shadow-lg [&_fieldset]:my-5 [&_legend]:mb-2.5 [&_legend]:text-xs [&_legend]:text-muted"
          aria-label="Appearance settings"
        >
          <div className="flex items-start justify-between gap-3 [&_strong]:text-lg [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted">
            <div>
              <strong>Make it yours</strong>
              <p>Personalize your workspace.</p>
            </div>
            <button
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border-0 bg-slate-50 text-muted transition-colors hover:bg-brand-soft hover:text-brand"
              aria-label="Close appearance settings"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <fieldset>
            <legend>Color palette</legend>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((key) => (
                <button
                  key={key}
                  className="grid justify-items-center gap-2 rounded-lg border border-line bg-white px-1 py-2 text-xs text-muted aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand [&>span]:grid [&>span]:size-7 [&>span]:place-items-center [&>span]:rounded-full [&>span]:text-white"
                  aria-pressed={appearance.preset === key}
                  onClick={() =>
                    setAppearance({
                      preset: key,
                    })
                  }
                >
                  <span
                    style={{
                      background: THEME_PRESETS[key].primary,
                    }}
                  >
                    {appearance.preset === key && <Check size={16} />}
                  </span>
                  {THEME_PRESETS[key].name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Spacing</legend>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 [&>button]:flex-1 [&>button]:rounded-lg [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-2 [&>button]:text-xs [&>button]:text-muted [&>button[aria-pressed=true]]:bg-white [&>button[aria-pressed=true]]:text-brand [&>button[aria-pressed=true]]:shadow-sm">
              {(['comfortable', 'compact'] as const).map((density) => (
                <button
                  key={density}
                  aria-pressed={appearance.density === density}
                  onClick={() =>
                    setAppearance({
                      density,
                    })
                  }
                >
                  {density === 'compact' ? 'Compact' : 'Comfortable'}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Text size</legend>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 [&>button]:flex-1 [&>button]:rounded-lg [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-2 [&>button]:text-xs [&>button]:text-muted [&>button[aria-pressed=true]]:bg-white [&>button[aria-pressed=true]]:text-brand [&>button[aria-pressed=true]]:shadow-sm">
              {(['standard', 'large'] as const).map((textSize) => (
                <button
                  key={textSize}
                  aria-pressed={appearance.textSize === textSize}
                  onClick={() =>
                    setAppearance({
                      textSize,
                    })
                  }
                >
                  {textSize === 'large' ? 'Larger' : 'Standard'}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            className="flex items-center gap-2 border-0 bg-transparent py-1 text-xs text-muted hover:text-brand"
            onClick={resetAppearance}
          >
            <RotateCcw size={14} /> Reset to default
          </button>
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Saved on this browser automatically.</p>
        </section>
      )}
    </div>
  );
}
