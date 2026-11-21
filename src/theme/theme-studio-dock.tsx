'use client';

import * as React from 'react';
import { Check, Palette, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonClass, labelClass } from '@/lib/styles';
import { useTheme } from './theme-context';
import { useThemeStudio, THEME_PRESETS, type PresetColorKey } from './theme-studio-context';
import type { Density, TextSize } from './display';

const CUSTOM_COLOR_FIELDS: { key: PresetColorKey; label: string; hint: string }[] = [
  { key: 'primary', label: 'Primary action', hint: 'Buttons, active menu items, links' },
  { key: 'secondary', label: 'Secondary', hint: 'Charts and highlights' },
  { key: 'accent', label: 'Accent surface', hint: 'Selected rows and soft badges' },
  { key: 'sidebar', label: 'Brand panel', hint: 'Sign-in screen background' },
];

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-md bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded px-2 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink',
            value === o.value && 'bg-white text-brand shadow-sm hover:text-brand',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Theme studio: a top-bar trigger and a slide-out panel to pick a preset,
 * hand-pick colours, and change spacing and text size. Same layout as the
 * Saving Scheme and Smith theme studios, built on the Calls class sets.
 * Everything is saved per browser under the `calls-theme-*` keys.
 */
export function ThemeStudioDock() {
  const [open, setOpen] = React.useState(false);
  const { density, textSize, setDisplay, resetDisplay } = useTheme();
  const { preset, setPreset, setPresetColor, resetPreset } = useThemeStudio();
  const presets = Object.values(THEME_PRESETS);

  return (
    <>
      <button
        type="button"
        aria-label="Open theme settings"
        title="Theme settings"
        onClick={() => setOpen(true)}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand-soft hover:text-brand"
      >
        <Palette size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[1400] flex justify-end">
          <button
            type="button"
            aria-label="Close theme settings"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside
            data-workspace-dialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-studio-title"
            className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <h2 id="theme-studio-title" className="text-base font-semibold text-ink">
                  Theme studio
                </h2>
                <p className="text-xs text-muted">
                  Pick a palette, tune colours, and set spacing. Saved on this browser.
                </p>
              </div>
              <button
                type="button"
                data-dialog-close
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-gray-100 hover:text-ink"
              >
                <X size={16} />
              </button>
            </header>

            <div className="grid flex-1 content-start gap-5 overflow-y-auto p-4">
              <section className="grid gap-2">
                <span className={labelClass}>Spacing</span>
                <Segmented<Density>
                  value={density}
                  onChange={(v) => setDisplay({ density: v })}
                  options={[
                    { value: 'compact', label: 'Compact' },
                    { value: 'comfortable', label: 'Comfortable' },
                  ]}
                />
              </section>

              <section className="grid gap-2">
                <span className={labelClass}>Text size</span>
                <Segmented<TextSize>
                  value={textSize}
                  onChange={(v) => setDisplay({ textSize: v })}
                  options={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'large', label: 'Larger' },
                  ]}
                />
              </section>

              <section className="grid gap-2">
                <span className={labelClass}>Theme presets</span>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((item) => {
                    const isActive = preset.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setPreset(item)}
                        className={cn(
                          'relative grid gap-1.5 rounded-lg border p-2.5 text-left transition-colors',
                          isActive ? 'border-brand bg-brand-soft' : 'border-line hover:bg-gray-50',
                        )}
                      >
                        <span className="flex gap-1">
                          {[item.primary, item.secondary, item.sidebar].map((c) => (
                            <i
                              key={c}
                              className="size-4 rounded-full border border-black/10"
                              style={{ background: c }}
                            />
                          ))}
                        </span>
                        <span className="text-[13px] font-semibold text-ink">{item.name}</span>
                        <span className="text-[11px] leading-snug text-muted">
                          {item.description}
                        </span>
                        {isActive && (
                          <Check size={14} className="absolute top-2 right-2 text-brand" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-2">
                <span className={labelClass}>
                  Custom colours
                  {preset.id === 'custom' && (
                    <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand">
                      In use
                    </span>
                  )}
                </span>
                {CUSTOM_COLOR_FIELDS.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line px-2.5 py-2"
                  >
                    <span className="grid">
                      <span className="text-[13px] font-semibold text-ink">{field.label}</span>
                      <span className="text-[11px] text-muted">{field.hint}</span>
                    </span>
                    <input
                      type="color"
                      value={preset[field.key]}
                      onChange={(e) => setPresetColor(field.key, e.target.value)}
                      className="size-8 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0.5"
                    />
                  </label>
                ))}
              </section>
            </div>

            <footer className="border-t border-line p-4">
              <button
                type="button"
                onClick={() => {
                  resetPreset();
                  resetDisplay();
                }}
                className={cn(buttonClass, 'w-full')}
              >
                <RotateCcw size={14} /> Reset to default
              </button>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
