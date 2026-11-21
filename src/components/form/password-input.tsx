'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClass } from '@/lib/styles';
import { FormField, helpId, type FieldMeta } from './form-field';

export interface PasswordInputProps
  extends
    FieldMeta,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string | null | undefined;
  onChange: (value: string) => void;
  /** Show a strength bar under the box. */
  showStrength?: boolean;
}

function strength(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

const STRENGTH = [
  { label: 'Too short', tone: 'bg-red-500' },
  { label: 'Weak', tone: 'bg-red-500' },
  { label: 'Fair', tone: 'bg-amber-500' },
  { label: 'Good', tone: 'bg-emerald-500' },
  { label: 'Strong', tone: 'bg-emerald-600' },
];

/** Password box with a show / hide toggle. The toggle is skipped by Tab and Enter. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label,
      error,
      hint,
      required,
      wrapperClassName,
      inline,
      value,
      onChange,
      showStrength,
      id,
      className,
      autoComplete = 'new-password',
      ...rest
    },
    ref,
  ) {
    const generated = useId();
    const fieldId = id ?? generated;
    const [visible, setVisible] = useState(false);
    const score = strength(value ?? '');
    return (
      <FormField
        id={fieldId}
        {...{ label, error, hint, required, wrapperClassName, inline }}
      >
        <div className="relative min-w-0">
          <input
            {...rest}
            ref={ref}
            id={fieldId}
            type={visible ? 'text' : 'password'}
            autoComplete={autoComplete}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            aria-required={required || undefined}
            aria-invalid={!!error || undefined}
            aria-describedby={error || hint ? helpId(fieldId) : undefined}
            className={cn(controlClass, 'pr-9', className)}
          />
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setVisible((v) => !v)}
            disabled={rest.disabled}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute top-1/2 right-1 grid size-7 -translate-y-1/2 place-items-center rounded text-muted hover:text-ink"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {showStrength && value ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    i <= score ? STRENGTH[score].tone : 'bg-gray-200',
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted">{STRENGTH[score].label}</span>
          </div>
        ) : null}
      </FormField>
    );
  },
);
