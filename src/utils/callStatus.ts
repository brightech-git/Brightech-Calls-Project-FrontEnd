/**
 * Call statuses, one place for every screen (dashboard, calls booking, call history,
 * status updates). Codes: P = Pending (red), I = In processing (yellow),
 * C = Completed (green). Older rows that say OPEN / PROCESS / CLOSED map to the same three.
 */
export type CallStatusCode = 'P' | 'I' | 'C';

export const CALL_STATUS_OPTIONS: { label: string; value: CallStatusCode }[] = [
  { label: 'Pending', value: 'P' },
  { label: 'In processing', value: 'I' },
  { label: 'Completed', value: 'C' },
];

/** Colour classes for each status group, so every page shows the same colours. */
export const CALL_STATUS_STYLE = {
  open: {
    badge: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    solid: 'bg-red-500',
    text: 'text-red-700',
  },
  progress: {
    badge: 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-300',
    solid: 'bg-yellow-400',
    text: 'text-yellow-700',
  },
  complete: {
    badge: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
    solid: 'bg-green-500',
    text: 'text-green-700',
  },
  cancelled: {
    badge: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
    solid: 'bg-gray-400',
    text: 'text-gray-600',
  },
  other: {
    badge: 'bg-gray-100 text-ink ring-1 ring-inset ring-gray-200',
    solid: 'bg-gray-400',
    text: 'text-ink',
  },
} as const;

export function describeCallStatus(value: unknown) {
  const status = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[ _-]/g, '');
  if (['P', 'PENDING', 'O', 'OPEN'].includes(status))
    return { code: 'P', label: 'Pending', group: 'open', tone: 'open' } as const;
  if (['I', 'INPROGRESS', 'INPROCESSING', 'PROCESS', 'PROCESSING'].includes(status))
    return {
      code: 'I',
      label: 'In processing',
      group: 'progress',
      tone: 'progress',
    } as const;
  if (['C', 'COMPLETE', 'COMPLETED', 'CLOSED', 'RESOLVED', 'RESOLVE'].includes(status))
    return {
      code: 'C',
      label: 'Completed',
      group: 'complete',
      tone: 'complete',
    } as const;
  if (['X', 'CANCELLED', 'CANCELED'].includes(status))
    return {
      code: null,
      label: 'Cancelled',
      group: 'cancelled',
      tone: 'cancelled',
    } as const;
  return {
    code: null,
    label: status ? String(value) : 'Unspecified',
    group: 'other',
    tone: 'neutral',
  } as const;
}

/** The colour classes for a status value. */
export const callStatusStyle = (value: unknown) =>
  CALL_STATUS_STYLE[describeCallStatus(value).group];
