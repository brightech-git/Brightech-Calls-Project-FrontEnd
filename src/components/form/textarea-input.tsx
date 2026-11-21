'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { controlClass } from '@/lib/styles';
import { FormField, helpId, type FieldMeta } from './form-field';
import { moveToNextField } from './enter-navigation';

export interface TextAreaInputProps
  extends
    FieldMeta,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string | null | undefined;
  onChange: (value: string) => void;
  uppercase?: boolean;
}

/**
 * Multi-line text. Enter adds a line; Ctrl+Enter moves to the next field,
 * so long notes can still be typed without leaving the keyboard.
 */
export const TextAreaInput = forwardRef<HTMLTextAreaElement, TextAreaInputProps>(
  function TextAreaInput(
    {
      label,
      error,
      hint,
      required,
      wrapperClassName,
      inline,
      value,
      onChange,
      uppercase,
      id,
      className,
      rows = 3,
      onKeyDown,
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
        <textarea
          {...rest}
          ref={ref}
          id={fieldId}
          rows={rows}
          value={value ?? ''}
          onChange={(e) =>
            onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)
          }
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented || e.key !== 'Enter' || !(e.ctrlKey || e.metaKey))
              return;
            e.preventDefault();
            moveToNextField(e.currentTarget);
          }}
          required={required}
          aria-required={required || undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? helpId(fieldId) : undefined}
          className={cn(
            controlClass,
            'h-auto py-1.5 leading-snug',
            uppercase && 'uppercase',
            className,
          )}
        />
      </FormField>
    );
  },
);
