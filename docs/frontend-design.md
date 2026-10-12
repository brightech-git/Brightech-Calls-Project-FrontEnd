# Frontend design system

The Calls frontend uses a shared business-workspace design inspired by the existing saving-scheme theme presets and the Payroll page reference. Backend code and API routes are unchanged.

## Appearance

Use the palette button at the top right of the workspace. Choose Ocean, Forest, Violet, or Ember; comfortable or compact spacing; standard or larger text. Settings are saved per browser under `calls-appearance` and synchronized across tabs.

- `utils/theme.ts`: semantic color and typography tokens; named presets.
- `context/ThemeContext.tsx`: validates, persists, and applies appearance settings.
- `app/globals.css`: Tailwind v4 import, semantic `@theme` tokens, appearance variables, and base typography.
- `utils/ui.ts`: statically discoverable Tailwind utilities shared by the shell, forms, tables, sign-in, dashboard, and role screens. Semantic marker classes remain for navigation and focus hooks.
- `utils/fonts.ts`: Poppins Regular font loading through Next.js.
- `config/pageConfig.ts`: titles, descriptions, and breadcrumb groups for every workspace route.

Prefer semantic colors from `COLORS`, type sizes from `FONT`, and CSS variables such as `--control-height`, `--row-padding`, and `--page-space` over hardcoded values. The revised interface uses light work surfaces and a white navigation panel. Poppins Regular (400) is self-hosted by Next.js; hierarchy uses size, spacing, and color rather than synthetic bold weights.

Use Tailwind utilities such as `bg-brand`, `text-ink`, `border-line`, `h-control`, and `p-page` for new styling. The PostCSS integration uses `@tailwindcss/postcss`. Component stylesheets and inline JSX style blocks were replaced with utilities. Runtime-dependent values, third-party widget styling, and exported print-document styles remain where necessary. Existing Chakra components retain their behavior; important Tailwind utilities take precedence over their generated styles.

## Shared record forms

Existing form implementations keep their data and submit handlers. Their shared classes are `workspace-modal-overlay`, `workspace-modal`, and `workspace-form-grid`. A custom dialog has `data-workspace-dialog`, `role="dialog"`, `aria-modal="true"`, and an accessible name. Its close button has `data-dialog-close` and an accessible label. `useDialogFocus` handles initial focus, Tab containment, Escape, and focus restoration.

## Navigation and feedback

- Search pages in the top bar, or press Ctrl/Cmd K. Only accessible menu pages are included.
- A phone-sized viewport uses a navigation drawer; desktop navigation can collapse.
- Collapsed desktop groups open accessible submenu flyouts without expanding the sidebar. Escape and outside clicks dismiss them; selecting a page closes the flyout. The shared sidebar context persists collapse state under `sidebar-collapsed`.
- Active query failures show a retry notice while keeping the form mounted.
- Unexpected route errors show a recovery view using the installed Next.js `unstable_retry` API.
- Account data and query caches are cleared on logout. Login refreshes menu permissions.

## Validation

Run `npm run build` for TypeScript validation and static export. Existing lint debt remains in older components; the new shell, appearance, session, error, and dashboard components have targeted lint checks. Browser checks use isolated local API fixtures, never saved into source or used to modify backend records. Test data is not part of the shipped frontend.

The frontend still depends on the API availability and authorization behavior of the existing backend. This design pass does not add endpoints for legacy staff/operator/user-role features.
