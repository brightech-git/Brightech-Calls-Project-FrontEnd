/**
 * Shared Tailwind class sets. Keep these literal so Tailwind can scan them.
 * Components compose them with `cn()` from `@/lib/utils`.
 */
export const controlClass =
  'h-control z-[10] w-full min-w-0 rounded-md border border-line-strong bg-white px-1.5 text-[11px] text-ink outline-none transition-colors placeholder:text-muted hover:border-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-muted aria-invalid:border-red-600';

export const buttonClass =
  'inline-flex h-control items-center justify-center gap-1.5 rounded-md border border-line bg-white px-3 text-[12px] font-semibold whitespace-nowrap text-ink transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

export const buttonVariants = {
  secondary: '',
  primary: 'border-brand bg-brand text-white hover:bg-brand-hover',
  danger: 'border-red-600 bg-red-600 text-white hover:bg-red-700',
  ghost: 'border-transparent bg-transparent hover:bg-gray-100',
} as const;

export const iconButtonClass =
  'inline-flex size-7 items-center justify-center rounded-md border border-line bg-white text-ink transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50';

export const cardClass = 'rounded-lg border border-line bg-white';

export const labelClass = 'text-xs font-semibold text-ink';

export const fieldErrorClass = 'text-[11px] text-red-600';

export const statusTones = {
  blue: 'bg-brand-soft text-brand',
  amber: 'bg-amber-50 text-amber-700',
  violet: 'bg-violet-50 text-violet-700',
  green: 'bg-emerald-50 text-emerald-700',
  open: 'bg-red-50 text-red-700',
  progress: 'bg-yellow-50 text-yellow-800',
  complete: 'bg-green-50 text-green-700',
  cancelled: 'bg-rose-50 text-rose-700',
  neutral: 'bg-gray-100 text-ink',
} as const;

export type StatusTone = keyof typeof statusTones;
