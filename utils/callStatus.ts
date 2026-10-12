export function describeCallStatus(value: unknown) {
  const status = String(value ?? '').trim().toUpperCase().replace(/[ _-]/g, '');
  if (['P', 'PENDING', 'O', 'OPEN'].includes(status)) return { label: status === 'P' || status === 'PENDING' ? 'Pending' : 'Open', group: 'open', tone: 'open' } as const;
  if (['I', 'INPROGRESS', 'PROCESS', 'PROCESSING'].includes(status)) return { label: 'In progress', group: 'progress', tone: 'progress' } as const;
  if (['C', 'COMPLETED', 'CLOSED'].includes(status)) return { label: 'Completed', group: 'complete', tone: 'complete' } as const;
  if (['X', 'CANCELLED', 'CANCELED'].includes(status)) return { label: 'Cancelled', group: 'cancelled', tone: 'cancelled' } as const;
  return { label: status ? String(value) : 'Unspecified', group: 'other', tone: 'neutral' } as const;
}
