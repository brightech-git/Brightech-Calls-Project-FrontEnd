'use client';

import { forwardRef, useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FormField, helpId, type FieldMeta } from './form-field';
import type { Option } from './select-input';

// ── Checkbox ─────────────────────────────────────────────────────────────────

export interface CheckboxProps<T = boolean> {
  /** Checked when value === trueValue. */
  value: T | null | undefined;
  onChange: (value: T) => void;
  trueValue?: T;
  falseValue?: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  name?: string;
  error?: string;
  className?: string;
}

/**
 * A single tick box. Works with booleans or with 'Y' / 'N' style values:
 * <Checkbox value={v} trueValue="Y" falseValue="N" … />. Space ticks, Enter moves on.
 */
function CheckboxInner<T = boolean>(
  {
    value,
    onChange,
    trueValue = true as T,
    falseValue = false as T,
    label,
    description,
    disabled,
    id,
    name,
    error,
    className,
  }: CheckboxProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className={cn('grid gap-1', className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          'inline-flex w-fit cursor-pointer items-start gap-2 text-[13px] text-ink',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <input
          ref={ref}
          id={fieldId}
          name={name}
          type="checkbox"
          checked={value === trueValue}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? trueValue : falseValue)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? helpId(fieldId) : undefined}
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-line-strong accent-brand"
        />
        <span className="grid">
          <span className="font-medium">{label}</span>
          {description && <span className="text-[11px] text-muted">{description}</span>}
        </span>
      </label>
      {error && (
        <span
          id={helpId(fieldId)}
          role="alert"
          className="text-[11px] text-red-600"
        >
          {error}
        </span>
      )}
    </div>
  );
}

export const Checkbox = forwardRef(CheckboxInner) as <T = boolean>(
  props: CheckboxProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => ReturnType<typeof CheckboxInner>;

// ── Checkbox group ───────────────────────────────────────────────────────────

export interface CheckboxGroupProps extends FieldMeta {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  disabled?: boolean;
  inline?: boolean;
  id?: string;
}

/** Several tick boxes for one multi-value field. */
export function CheckboxGroup({
  value,
  onChange,
  options,
  disabled,
  inline = true,
  id,
  ...meta
}: CheckboxGroupProps) {
  const generated = useId();
  const groupId = id ?? generated;
  const picked = new Set(value);
  return (
    <FormField
      id={groupId}
      labelAs="span"
      {...meta}
    >
      <div
        role="group"
        aria-labelledby={meta.label ? `${groupId}-label` : undefined}
        className={cn('flex gap-x-4 gap-y-1.5', inline ? 'flex-wrap' : 'flex-col')}
      >
        {options.map((o) => (
          <Checkbox
            key={o.value}
            label={o.label}
            value={picked.has(o.value)}
            disabled={disabled || o.disabled}
            onChange={(on) =>
              onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))
            }
          />
        ))}
      </div>
    </FormField>
  );
}

// ── Radio group ──────────────────────────────────────────────────────────────

export interface RadioGroupProps extends FieldMeta {
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: Option[];
  name?: string;
  disabled?: boolean;
  /** Side by side (default) or stacked. */
  inline?: boolean;
  /** Draw the options as a segmented button row. */
  variant?: 'radio' | 'segmented';
  id?: string;
}

/**
 * One choice from a few. Arrow keys move between options (native radio
 * behaviour); Enter moves to the next field.
 */
export function RadioGroup({
  value,
  onChange,
  options,
  name,
  disabled,
  inline = true,
  variant = 'radio',
  id,
  ...meta
}: RadioGroupProps) {
  const generated = useId();
  const groupId = id ?? generated;
  const groupName = name ?? groupId;
  return (
    <FormField
      id={groupId}
      labelAs="span"
      {...meta}
    >
      <div
        role="radiogroup"
        aria-labelledby={meta.label ? `${groupId}-label` : undefined}
        aria-required={meta.required || undefined}
        aria-invalid={!!meta.error || undefined}
        className={cn(
          variant === 'segmented'
            ? 'inline-flex h-control w-fit overflow-hidden rounded-md border border-line-strong'
            : cn(
                'flex gap-x-4 gap-y-1.5',
                inline ? 'min-h-control flex-wrap items-center' : 'flex-col',
              ),
        )}
      >
        {options.map((o) => {
          const checked = String(value ?? '') === o.value;
          const off = disabled || o.disabled;
          return (
            <label
              key={o.value}
              className={cn(
                'relative inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink',
                variant === 'segmented' &&
                  'border-l border-line-strong px-3 font-medium first:border-l-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30 has-[:focus-visible]:ring-inset',
                variant === 'segmented' && checked && 'bg-brand text-white',
                off && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={o.value}
                checked={checked}
                disabled={off}
                onChange={() => onChange(o.value)}
                className={cn(
                  'size-4 cursor-pointer accent-brand',
                  variant === 'segmented' && 'absolute size-px opacity-0',
                )}
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </FormField>
  );
}

// ── Switch ───────────────────────────────────────────────────────────────────

export interface SwitchFieldProps<T = boolean> extends FieldMeta {
  value: T | null | undefined;
  onChange: (value: T) => void;
  trueValue?: T;
  falseValue?: T;
  /** Text beside the switch for each state. */
  labels?: { on: string; off: string };
  disabled?: boolean;
  id?: string;
}

/** On / off toggle. Space or click flips it; Enter moves to the next field. */
export function SwitchField<T = boolean>({
  value,
  onChange,
  trueValue = true as T,
  falseValue = false as T,
  labels = { on: 'Yes', off: 'No' },
  disabled,
  id,
  // A switch always has a value, so it never shows the required mark.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  required: _required,
  ...meta
}: SwitchFieldProps<T>) {
  const generated = useId();
  const fieldId = id ?? generated;
  const on = value === trueValue;
  return (
    <FormField
      id={fieldId}
      {...meta}
    >
      <button
        id={fieldId}
        type="button"
        role="switch"
        aria-checked={on}
        data-enter-field
        disabled={disabled}
        onClick={() => onChange(on ? falseValue : trueValue)}
        className="group inline-flex h-control w-fit items-center gap-2 rounded-md text-[13px] font-medium text-ink outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          aria-hidden
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-brand/30 group-focus-visible:ring-offset-1',
            on ? 'bg-brand' : 'bg-gray-300',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform',
              on && 'translate-x-4',
            )}
          />
        </span>
        <span className={on ? 'text-ink' : 'text-muted'}>
          {on ? labels.on : labels.off}
        </span>
      </button>
    </FormField>
  );
}
