export type NumericValue = number | string | null | undefined;
export const DEFAULT_DECIMALS = 2;
export const WEIGHT_DECIMALS = 3;
export function toNumber(value: NumericValue): number | null {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  // Accept plain decimal values only; do not silently treat malformed grouping as money.
  if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))
    return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}
export function decimalPlaces(precision: number) {
  return Math.min(
    12,
    Math.max(0, Math.trunc(Number.isFinite(precision) ? precision : DEFAULT_DECIMALS)),
  );
}
export function formatNumber(
  value: NumericValue,
  precision = DEFAULT_DECIMALS,
  grouping = true,
): string {
  const number = toNumber(value);
  const decimals = decimalPlaces(precision);
  return number === null
    ? ''
    : new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouping,
      }).format(number);
}
export const formatWeight = (value: NumericValue, precision = WEIGHT_DECIMALS) =>
  formatNumber(value, precision);
export function formatCurrency(
  value: NumericValue,
  currency = 'INR',
  precision = DEFAULT_DECIMALS,
): string {
  const number = toNumber(value);
  const decimals = decimalPlaces(precision);
  return number === null
    ? ''
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(number);
}
/** Round only at a business boundary; display formatting must never enter calculations. */
export function roundNumber(value: number, precision = DEFAULT_DECIMALS): number {
  if (!Number.isFinite(value)) throw new RangeError('A finite number is required.');
  const scale = 10 ** decimalPlaces(precision);
  return (
    (Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * scale)) / scale
  );
}
/** Full numeric precision; caller decides the business rounding boundary. */
export function calculateWeight(gross: number, deduction = 0): number {
  if (
    !Number.isFinite(gross) ||
    !Number.isFinite(deduction) ||
    gross < 0 ||
    deduction < 0 ||
    deduction > gross
  )
    throw new RangeError('Weight and deduction must be valid non-negative values.');
  return gross - deduction;
}
