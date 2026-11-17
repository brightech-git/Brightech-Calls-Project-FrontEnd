# Frontend design system

The Calls frontend follows the Saving Scheme frontend: Tailwind CSS v4 for all styling, Poppins as the only font, and one folder per screen under `src/module`.

## Look and feel

- White background (`--bg`, `--surface`), black text (`--text-main`), light grey borders (`--border`).
- Poppins from Google Fonts, loaded once in `app/layout.tsx` with `next/font` in weights 400 (regular), 600 (semibold) and 700 (bold). It is exposed as `--font-poppins` and as Tailwind's `font-sans`. `font-medium` maps to 600, so no weight is synthesised.
- Compact by default: 32px controls, 6px table row padding, 12px page spacing. The palette button in the top bar can switch to comfortable spacing, larger text, or another accent preset (saved per browser under `calls-appearance`).

## Styling rules

- Write Tailwind utilities directly in `className`. Do not add component CSS to `app/globals.css`; it only holds the Tailwind import, theme tokens and a small base layer.
- Compose conditional classes with `cn()` from `lib/utils.ts` (clsx + tailwind-merge).
- Reuse the class sets in `lib/styles.ts` for repeated controls: `controlClass` (inputs and selects), `buttonClass` with `buttonVariants`, `iconButtonClass`, `cardClass`, `labelClass`, `fieldErrorClass`, `statusTones`.
- Theme tokens available as utilities: `bg-brand`, `bg-brand-soft`, `text-ink`, `text-muted`, `border-line`, `border-line-strong`, `h-control`, `py-row`, `p-page`.
- Chakra UI still provides some behaviour (dialogs, drawers, popovers, comboboxes). Its styles live in cascade layers (`chakra-*`) declared before Tailwind's `components` and `utilities` layers, so Tailwind classes win without `!important`. Chakra fonts point at Poppins (`lib/chakra-system.ts`).

## Folder structure

```
app/                      routes only; each page.tsx re-exports a module screen
src/module/<screen>/
  api/<screen>.api.ts     axios calls for the screen
  hook/use-<screen>.ts    react-query hooks
  type/<screen>.types.ts  types, schemas and screen config
  component/<screen>-page.tsx
  index.ts                public exports of the module
components/               shared UI (table, form fields, dialogs, sidebar, top bar)
lib/                      api client helpers, query client, session, cn(), class sets
utils/                    pure helpers (formatting, validation, theme tokens)
hooks/                    shared hooks (menu access, dialog focus)
types/                    shared types (API response, pagination, form)
config/                   menu and page titles
```

## Navigation and feedback

- Search pages in the top bar, or press Ctrl/Cmd K. Only accessible menu pages are included.
- Phones get a navigation drawer; on desktop the sidebar can collapse to icons, with flyout submenus.
- Active query failures show a retry notice while keeping the form mounted.
- Custom dialogs use `data-workspace-dialog`, `role="dialog"`, `aria-modal="true"` and a `data-dialog-close` button; `useDialogFocus` handles focus, Tab containment, Escape and focus restoration.

## Validation

Run `npm run build` for TypeScript validation and the static export, and `npm run test:foundations` for the API, session and formatting checks. See `docs/modernization.md` for the API, caching and formatting contracts.
