"use client";

import { ui } from "@/utils/ui";
import { useState, useRef, useEffect } from 'react';
import { Palette, X, RotateCcw, Check } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { THEME_PRESETS, ThemePreset } from '@/utils/theme';
export default function AppearanceSettings() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const {
    appearance,
    setAppearance,
    resetAppearance
  } = useTheme();
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
  return <div className={ui("appearance-root")} ref={root}>
    <button className={ui("shell-icon-button")} aria-label="Appearance settings" aria-expanded={open} aria-controls="appearance-panel" onClick={() => setOpen(!open)}><Palette size={18} /></button>
    {open && <section id="appearance-panel" className={ui("appearance-panel")} aria-label="Appearance settings">
      <div className={ui("appearance-heading")}><div><strong>Make it yours</strong><p>Personalize your workspace.</p></div><button className={ui("shell-icon-button")} aria-label="Close appearance settings" onClick={() => setOpen(false)}><X size={16} /></button></div>
      <fieldset><legend>Color palette</legend><div className={ui("appearance-presets")}>{(Object.keys(THEME_PRESETS) as ThemePreset[]).map(key => <button key={key} className={ui("appearance-swatch")} aria-pressed={appearance.preset === key} onClick={() => setAppearance({
            preset: key
          })}><span style={{
              background: THEME_PRESETS[key].primary
            }}>{appearance.preset === key && <Check size={16} />}</span>{THEME_PRESETS[key].name}</button>)}</div></fieldset>
      <fieldset><legend>Spacing</legend><div className={ui("appearance-segments")}>{(['comfortable', 'compact'] as const).map(density => <button key={density} aria-pressed={appearance.density === density} onClick={() => setAppearance({
            density
          })}>{density === 'compact' ? 'Compact' : 'Comfortable'}</button>)}</div></fieldset>
      <fieldset><legend>Text size</legend><div className={ui("appearance-segments")}>{(['standard', 'large'] as const).map(textSize => <button key={textSize} aria-pressed={appearance.textSize === textSize} onClick={() => setAppearance({
            textSize
          })}>{textSize === 'large' ? 'Larger' : 'Standard'}</button>)}</div></fieldset>
      <button className={ui("appearance-reset")} onClick={resetAppearance}><RotateCcw size={14} /> Reset to default</button>
      <p className={ui("appearance-note")}>Saved on this browser automatically.</p>
    </section>}
  </div>;
}
