export type DateValue = Date | string | number | null | undefined;
const pad = (value: number) => String(value).padStart(2, '0');
/** Date-only API values are local calendar dates, never UTC instants. */
export function parseDate(value: DateValue): Date | null {
  if (value == null || value === '') return null;
  let date: Date;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    )
      return null;
  } else date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
export function formatDate(value: DateValue, short = false): string {
  const date = parseDate(value);
  return date
    ? `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${short ? String(date.getFullYear()).slice(-2) : date.getFullYear()}`
    : '';
}
export function formatTime(value: DateValue): string {
  if (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value))
    return value.length === 5 ? `${value}:00` : value;
  const date = parseDate(value);
  return date
    ? `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    : '';
}
export function formatDateTime(value: DateValue): string {
  return parseDate(value) ? `${formatDate(value, true)} ${formatTime(value)}` : '';
}
export function formatApiDate(value: DateValue): string {
  const date = parseDate(value);
  return date
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : '';
}
