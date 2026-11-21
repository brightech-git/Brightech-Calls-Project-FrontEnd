'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClass } from '@/lib/styles';
import { FormField, helpId, type FieldMeta } from './form-field';

export interface Option<V extends string = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps
  extends FieldMeta, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  options: Option[];
  /** First, empty option. Pass false to leave it out. */
  placeholder?: string | false;
}

/** Native select for short, fixed lists. Use ComboBox when the list is long. */
export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  function SelectInput(
    {
      label,
      error,
      hint,
      required,
      wrapperClassName,
      inline,
      value,
      onChange,
      options,
      placeholder = 'Select…',
      id,
      className,
      ...rest
    },
    ref,
  ) {
    const generated = useId();
    const fieldId = id ?? generated;
    return (
      <FormField
        id={fieldId}
        {...{ label, error, hint, required, wrapperClassName, inline }}
      >
        <div className="relative min-w-0">
          <select
            {...rest}
            ref={ref}
            id={fieldId}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            aria-required={required || undefined}
            aria-invalid={!!error || undefined}
            aria-describedby={error || hint ? helpId(fieldId) : undefined}
            className={cn(controlClass, 'appearance-none pr-8', className)}
          >
            {placeholder !== false && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option
                key={o.value}
                value={o.value}
                disabled={o.disabled}
              >
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted"
          />
        </div>
      </FormField>
    );
  },
);
