# Frontend design system

The Calls frontend follows the Saving Scheme frontend: Tailwind CSS v4 for all styling, Poppins as the only font, and one folder per screen under `src/module`.

## Look and feel

- White background (`--bg`, `--surface`), black text (`--text-main`), light grey borders (`--border`).
- Poppins from Google Fonts, loaded once in `app/layout.tsx` with `next/font` in weights 400 (regular), 600 (semibold) and 700 (bold). It is exposed as `--font-poppins` and as Tailwind's `font-sans`. `font-medium` maps to 600, so no weight is synthesised.
- Compact by default: 32px controls, 6px table row padding, 12px page spacing.

## Theme system (`src/theme`)

Same structure as the Saving Scheme and Smith frontends:

| File | Role |
| --- | --- |
| `tokens.ts` | `COLORS`, `FONT`, `RADIUS`, `SPACING`, `SHADOW` as CSS variable references |
| `presets.ts` | Colour presets (Ocean, Graphite, Forest, Violet, Ember), apply, persist and reset |
| `display.ts` | Spacing (compact / comfortable) and text size (standard / large) |
| `theme-context.tsx` | `ThemeProvider`, `useTheme()` and `ThemeScript` (applies saved settings before first paint) |
| `theme-studio-context.tsx` | `ThemeStudioProvider`, `useThemeStudio()`: preset, custom colours, reset |
| `theme-studio-dock.tsx` | The palette button in the top bar and its slide-out Theme studio panel |
| `index.ts` | Public exports; import from `@/src/theme` |

Settings are saved per browser under Calls-only keys, so they never clash with the other apps: `calls-theme-preset` (colours) and `calls-theme-display` (spacing and text size). Both sync across open tabs. The older `calls-appearance` key is read once and migrated.

## Styling rules

- Write Tailwind utilities directly in `className`. Do not add component CSS to `app/globals.css`; it only holds the Tailwind import, theme tokens and a small base layer.
- Compose conditional classes with `cn()` from `lib/utils.ts` (clsx + tailwind-merge).
- Reuse the class sets in `lib/styles.ts` for repeated controls: `controlClass` (inputs and selects), `buttonClass` with `buttonVariants`, `iconButtonClass`, `cardClass`, `labelClass`, `fieldErrorClass`, `statusTones`.
- Theme tokens available as utilities: `bg-brand`, `bg-brand-soft`, `text-ink`, `text-muted`, `border-line`, `border-line-strong`, `h-control`, `py-row`, `p-page`.
- Chakra UI still provides some behaviour (dialogs, drawers, popovers, comboboxes). Its styles live in cascade layers (`chakra-*`) declared before Tailwind's `components` and `utilities` layers, so Tailwind classes win without `!important`. Chakra fonts point at Poppins (`lib/chakra-system.ts`).

## Folder structure

Same layout as the Saving Scheme frontend. A screen gets its api, hooks and types only from its own module, or from another module's `index.ts`. There are no separate `services/`, `hooks/<Screen>` or `types/<Screen>` folders.

```
app/                        routes only; each page.tsx re-exports a screen from its module index
src/module/<screen>/
  api/<screen>.api.ts       axios calls for the screen
  hook/use-<screen>.ts      react-query hooks ('use client')
  type/<screen>.types.ts    types, schemas and screen config
  component/<screen>-page.tsx
  index.ts                  public exports of the module
src/components/             shared UI (tables, form fields, dialogs, sidebar, top bar)
src/config/                 menu config, menu labels, page titles
src/context/                page header and sidebar contexts
src/theme/                  tokens, presets, theme providers and theme studio
src/utils/                  pure helpers (formatting, validation, call status)
src/types/                  shared form types and ambient declarations
lib/api/                    axios instance, API response and pagination types, errors, config
lib/                        query client, session, cn(), class sets
hooks/                      shared hooks that belong to no screen (dialog focus)
```

Menu access (`useAccessibleMenu`) lives in the auth module: `src/module/auth/hook/use-accessible-menu.ts`.

## Navigation and feedback

- Search pages in the top bar, or press Ctrl/Cmd K. Only accessible menu pages are included.
- Phones get a navigation drawer; on desktop the sidebar can collapse to icons, with flyout submenus.
- Active query failures show a retry notice while keeping the form mounted.
- Custom dialogs use `data-workspace-dialog`, `role="dialog"`, `aria-modal="true"` and a `data-dialog-close` button; `useDialogFocus` handles focus, Tab containment, Escape and focus restoration.

## Validation

Run `npm run build` for TypeScript validation and the static export, and `npm run test:foundations` for the API, session and formatting checks. See `docs/modernization.md` for the API, caching and formatting contracts.
