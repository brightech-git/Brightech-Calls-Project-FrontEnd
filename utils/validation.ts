import { z } from 'zod';
import { parseDate } from '@/utils/format/date';
export const requiredText = (label: string, maxLength = 250) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} must be at most ${maxLength} characters`);
export const positiveId = (label: string) =>
  z.number().int().positive(`Select ${label.toLowerCase()}`);
export const optionalUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, 'Enter a valid http or https URL');
export const apiDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use yyyy-MM-dd')
  .refine((value) => parseDate(value) !== null, 'Enter a valid date');
export const optionalEmail = z.union([
  z.literal(''),
  z.email('Enter a valid email address'),
]);
export const barcodeSchema = z
  .string()
  .trim()
  .min(1, 'Scan or enter a barcode')
  .max(128, 'Barcode is too long');
export function toFlag(value: boolean): 'Y' | 'N' {
  return value ? 'Y' : 'N';
}
export function fromFlag(value: unknown): boolean {
  return value === true || String(value).toUpperCase() === 'Y';
}
