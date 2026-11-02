# Frontend modernization

The Jewellery Savings Scheme frontend at `D:/ash/NextJsProjects/savingscheme` was inspected as the reference. Calls keeps its current Next.js 16 / React 19 / Chakra 3 stack and existing backend contracts. No backend code or reference-project files were modified.

## Structure

- `app/`: route entries, layouts and providers.
- `features/project-links/`: complete feature example: schema, types, services, queries/mutations and screen. The route is a single export.
- `lib/api/`: base URL/timeouts, normalized errors and explicit response unwrapping.
- `lib/auth/`: browser-safe session reads/writes and cleanup.
- `lib/query/`: shared QueryClient policy, session cache isolation, reusable list/mutation hooks and call-query invalidation.
- `components/common/`: shared controls, overlays and data states; barrel exports the existing configurable DataTable and toast API.
- `components/form/FormFields.tsx`: typed field configuration integrated with React Hook Form. The owning form supplies a Zod resolver.
- `utils/format/`: pure numeric/date/display helpers. Compatibility exports keep legacy consumers working.
- `utils/validation.ts`: shared validation and flag conversion helpers.
- `utils/theme.ts`, `context/ThemeContext.tsx`, `app/globals.css`: semantic tokens, palettes, density and type size.
- Existing `services/`, `hooks/`, `types/` and specialized grid components remain compatible. Project Links services/hooks re-export the feature modules. Other feature screens are not yet all relocated into feature folders.

## API and session behavior

All existing services use the same Axios instance. `NEXT_PUBLIC_API_URL` configures the API; fallback remains `http://localhost:8111/api/v1`. Environment values are public build-time configuration, never secrets.

The request interceptor attaches the current user/token and any available company context synchronously. It no longer performs a blocking `/company` request. Normal company queries populate optional cached company headers; the supplied backend does not use those headers for database routing. Deployments that require company selection should load/select it explicitly before enabling dependent queries.

FormData clears the JSON header so the browser sets the multipart boundary. Cancellation remains cancellation. API failures (including `success: false` with HTTP 200) become `ApiError` with message/statusCode/errors and compatible `response` access. `getApiErrorMessage` handles unknown failures. Raw response bodies retain their original shapes so existing service adapters do not break.

Authenticated 401 responses clear the current session; late responses from a previous token do not sign out a newer session. Login, logout and storage changes clear/cancel query caches when account identity changes. Registration does not overwrite the signed-in administrator's token. The existing localStorage token contract is retained because the backend does not expose cookie authentication or token refresh; do not invent a refresh request.

Queries stay fresh for 30 seconds and in inactive cache for 5 minutes. Window focus does not trigger automatic refetch storms. Transient failures retry once; 4xx failures and mutations do not automatically retry. Services receive AbortSignal where supported (Project Links); remaining legacy services can adopt cancellation through `useApiList` incrementally. Use `useApiMutation` for simple mutations, and explicit feature hooks for detail-cache updates/removal.

Project Links mutations finish when the write succeeds and refresh lists in the background. Errors remain visible and retryable. Call mutations invalidate bookings, ticket details/history, personal queues and dashboard totals.

## Shared controls

`components/common` provides TextField, NumberField, TextareaField, BarcodeField, SelectField, MultiSelectField, AsyncSelectField, DateField, TimeField, Button, AppDialog, AppDrawer, ConfirmDialog, DataTable, Loader, Skeleton, EmptyState, ErrorState, Notification and useToast.

Fields share labels, required indicators, accessible error/help associations, disabled styling and forwarded refs where applicable. Barcode Enter invokes `onScan` without submitting a form. Number inputs preserve numeric values instead of passing formatted strings into calculations. Async selects debounce searches, cancel obsolete queries and retain a selected option across searches; include parent/client scope in their query keys. Native multi-select supports Ctrl/Cmd or keyboard selection.

DataTable retains client pagination, sorting, search, selection, bulk-action slots and expansion. Sorting is keyboard accessible; selection controls are labelled. Tables scroll horizontally inside their container rather than widening the app. Server pagination cannot be claimed for Project Links until its backend exposes a paged response.

Chakra-backed dialogs and drawers supply focus trapping, Escape handling, portals and focus restoration. Legacy custom dialogs retain their existing focus hook. Pending confirmations cannot be dismissed. Toasts announce feedback and fit narrow screens.

## Formatting contract

| Function | Output / default |
| --- | --- |
| `formatDate(value)` | dd-MM-yyyy |
| `formatDate(value, true)` | dd-MM-yy |
| `formatDateTime(value)` | dd-MM-yy HH:mm:ss |
| `formatTime(value)` | HH:mm:ss |
| `formatApiDate(value)` | yyyy-MM-dd |
| `formatNumber(value)` | 2 decimals, en-IN grouping |
| `formatCurrency(value)` | INR, 2 decimals; configurable currency |
| `formatWeight(value, precision)` | 3 decimals by default |

Date-only strings preserve calendar dates in the local timezone. Zoned timestamps display in the user's browser timezone. Invalid or missing values display empty strings, never Invalid Date or NaN. Callers may show an em dash as a placeholder.

Formatting returns strings for display only. `toNumber`, `calculateWeight` and `roundNumber` are separate operations; calculations do not round automatically. `calculateWeight` validates non-negative weights/deductions. Business rounding is an explicit boundary. These helpers use JavaScript numbers, not arbitrary-precision decimal accounting; no jewellery accounting workflows were introduced into Calls.

## Theme and responsiveness

Appearance settings offer Graphite, Ocean, Forest, Violet and Ember plus compact/comfortable density and standard/larger text. Settings persist and synchronize across tabs. Use semantic tokens for new code; do not put hex colors in feature components. Status tokens, spacing, shadows, radii and control sizes live centrally. Legacy specialized components still have some historical literal colors.

One global Segoe UI / Arial font stack replaces the build-time Google Fonts dependency and supports real regular/medium/semibold/bold weights. Shared forms use two columns on wider screens and one column below 640px. Toolbars/filters wrap, dialogs stay within the viewport, navigation keeps its mobile drawer, and tables scroll within the content region. Reduced-motion preferences are respected.

## Checks and local fixture

- `node scripts/test-foundations.cjs`: formatting/precision, validation, session lifecycle, request headers, absence of company waterfall, multipart, application errors, HTTP 401, retries and cancellation.
- `npx tsc --noEmit`: TypeScript.
- `npm run build -- --webpack`: production static export when the local Turbopack subprocess fails. The normal build command remains unchanged.
- Targeted ESLint on `lib`, `features/project-links`, `components/common`, new formatting/validation and shared controls.
- `node scripts/preview-fixture.cjs` starts a test-only in-memory API on 8112; run `next dev --webpack --port 3110` with `NEXT_PUBLIC_API_URL=http://localhost:8112/api/v1` to inspect without touching backend records. This fixture is not imported by the application or production build.

## Backend limits

No new endpoint is required for the shared frontend foundation. The updated Project Links GET now uses one joined DTO query for links, clients and project types; the previous per-record lookups are removed. The endpoint still returns an array of all matching records, and its field names remain compatible with the frontend. Booking page sizes must be between 1 and 200; the local booking table collects all pages in batches of 200 so filtering and exports are not truncated. These are source-level findings, not live latency measurements.

The updated bookings controller enforces the client ID resolved from the token. The frontend keeps its explicit client filter as well. A `/staff` controller and cookie/refresh-token APIs are still absent in the inspected backend. Backend validation errors expose field messages in `data` with code `VALIDATION_FAILED`; the shared error adapter preserves that code and the field map, and Project Links displays server field errors next to the corresponding controls.

## Formatting

Prettier is installed as a project dev dependency. Run `npm run format` to format frontend source and `npm run format:check` to check it. Configuration uses two-space indentation, a 90-character print width, semicolons, and multiline JSX attributes. Generated output, dependencies, private tool directories and the lockfile are excluded.
