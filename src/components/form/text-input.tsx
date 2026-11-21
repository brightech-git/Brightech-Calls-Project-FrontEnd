'use client';

import {
  forwardRef,
  useId,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { controlClass } from '@/lib/styles';
import { FormField, helpId, type FieldMeta } from './form-field';

/**
 * text     free text (upper-cased when `uppercase`)
 * number   whole numbers only
 * decimal  numbers with up to `decimals` places, padded on blur
 * mobile   10 digits · pincode 6 digits · tel digits, + and spaces
 * gst      15 upper-case letters and digits · pan 10 upper-case letters and digits
 * email    no spaces, lower-cased
 */
export type TextInputType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'email'
  | 'mobile'
  | 'tel'
  | 'pincode'
  | 'gst'
  | 'pan'
  | 'search'
  | 'url';

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'min' | 'max' | 'size' | 'prefix'
>;

export interface TextInputProps extends FieldMeta, NativeProps {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: TextInputType;
  /** Upper-case text as it is typed. */
  uppercase?: boolean;
  /** Places after the point for `decimal`. Default 2. */
  decimals?: number;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  /** Classes for the <input> itself. `className` is kept for the same purpose. */
  inputClassName?: string;
}

const FIXED_LENGTH: Partial<Record<TextInputType, number>> = {
  mobile: 10,
  pincode: 6,
  gst: 15,
  pan: 10,
};

const NUMERIC: TextInputType[] = ['number', 'decimal'];

/** Cleans a typed value for its type. Exported for tests and table cells. */
export function sanitize(
  raw: string,
  type: TextInputType,
  opts: { uppercase?: boolean; decimals?: number; allowNegative?: boolean } = {},
) {
  let v = raw;
  switch (type) {
    case 'number': {
      const neg = opts.allowNegative && v.trimStart().startsWith('-');
      v = (neg ? '-' : '') + v.replace(/\D/g, '');
      break;
    }
    case 'decimal': {
      const neg = opts.allowNegative && v.trimStart().startsWith('-');
      const [whole, ...rest] = v.replace(/[^\d.]/g, '').split('.');
      const places = opts.decimals ?? 2;
      v =
        (neg ? '-' : '') +
        whole +
        (rest.length && places > 0 ? '.' + rest.join('').slice(0, places) : '');
      break;
    }
    case 'mobile':
    case 'pincode':
      v = v.replace(/\D/g, '');
      break;
    case 'tel':
      v = v.replace(/[^\d+\s-]/g, '');
      break;
    case 'gst':
    case 'pan':
      v = v.replace(/[^a-z0-9]/gi, '').toUpperCase();
      break;
    case 'email':
      v = v.replace(/\s/g, '').toLowerCase();
      break;
    default:
      if (opts.uppercase) v = v.toUpperCase();
  }
  const limit = FIXED_LENGTH[type];
  return limit ? v.slice(0, limit) : v;
}

/** Clamps and pads a numeric value when the field is left. */
export function finalize(
  value: string,
  type: TextInputType,
  opts: { decimals?: number; min?: number; max?: number } = {},
) {
  if (!NUMERIC.includes(type) || value === '' || value === '-')
    return value === '-' ? '' : value;
  let n = Number(value);
  if (!Number.isFinite(n)) return '';
  if (opts.min !== undefined) n = Math.max(opts.min, n);
  if (opts.max !== undefined) n = Math.min(opts.max, n);
  return type === 'decimal' ? n.toFixed(opts.decimals ?? 2) : String(Math.trunc(n));
}

/** One text box for text, whole numbers, decimals, phone, email, GST and PAN. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    error,
    hint,
    required,
    wrapperClassName,
    inline,
    value,
    onChange,
    type = 'text',
    uppercase,
    decimals,
    min,
    max,
    allowNegative,
    id,
    className,
    inputClassName,
    onBlur,
    maxLength,
    ...rest
  },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  const numeric = NUMERIC.includes(type);
  const opts = { uppercase, decimals, allowNegative, min, max };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.target;
    const before = el.value;
    const caret = el.selectionStart ?? before.length;
    let next = sanitize(before, type, opts);
    if (maxLength && maxLength > 0) next = next.slice(0, maxLength);
    if (next !== before) {
      // Keep the caret where it was, less any characters that were dropped.
      const dropped = before.length - next.length;
      el.value = next;
      const pos = Math.max(0, caret - Math.max(0, dropped));
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* some input types do not support selection */
      }
    }
    onChange(next);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const cleaned = finalize(event.target.value.trim(), type, opts);
    if (cleaned !== String(value ?? '')) onChange(cleaned);
    onBlur?.(event);
  };

  const inputMode = numeric
    ? type === 'decimal'
      ? 'decimal'
      : 'numeric'
    : type === 'mobile' || type === 'pincode' || type === 'tel'
      ? 'tel'
      : type === 'email'
        ? 'email'
        : type === 'search'
          ? 'search'
          : type === 'url'
            ? 'url'
            : 'text';

  return (
    <FormField
      id={fieldId}
      {...{ label, error, hint, required, wrapperClassName, inline }}
    >
      <input
        {...rest}
        ref={ref}
        id={fieldId}
        type={type === 'email' ? 'email' : type === 'search' ? 'search' : 'text'}
        inputMode={inputMode}
        autoComplete={rest.autoComplete ?? 'off'}
        value={value ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={maxLength ?? FIXED_LENGTH[type]}
        required={required}
        aria-required={required || undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? helpId(fieldId) : undefined}
        className={cn(
          controlClass,
          numeric && 'text-right tabular-nums',
          (uppercase || type === 'gst' || type === 'pan') &&
            'uppercase placeholder:normal-case',
          className,
          inputClassName,
        )}
      />
    </FormField>
  );
});

/** Whole numbers. Shorthand for <TextInput type="number" />. */
export const NumberInput = forwardRef<HTMLInputElement, Omit<TextInputProps, 'type'>>(
  function NumberInput(props, ref) {
    return (
      <TextInput
        {...props}
        ref={ref}
        type="number"
      />
    );
  },
);

/** Decimals, padded to `decimals` places on blur. */
export const DecimalInput = forwardRef<HTMLInputElement, Omit<TextInputProps, 'type'>>(
  function DecimalInput(props, ref) {
    return (
      <TextInput
        {...props}
        ref={ref}
        type="decimal"
      />
    );
  },
);
