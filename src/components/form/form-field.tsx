'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { fieldErrorClass, labelClass } from '@/lib/styles';

/** Label, error and hint shared by every form input. All optional. */
export interface FieldMeta {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  /** Extra classes on the outer wrapper (grid span, width). */
  wrapperClassName?: string;
  /** Label to the left of the control instead of above it. */
  inline?: boolean;
}

export const helpId = (id: string) => `${id}-help`;

/** Wraps a control with its label, and its error or hint below. */
export function FormField({
  id,
  label,
  error,
  hint,
  required,
  wrapperClassName,
  inline,
  labelAs = 'label',
  children,
}: FieldMeta & { id: string; labelAs?: 'label' | 'span'; children: ReactNode }) {
  if (!label && !error && !hint) return <>{children}</>;
  const Label = labelAs;
  return (
    <div
      className={cn(
        'grid min-w-0 content-start gap-1',
        inline &&
          'grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 max-sm:grid-cols-[96px_minmax(0,1fr)] [&>*:not(:first-child)]:col-start-2',
        wrapperClassName,
      )}
    >
      {label && (
        <Label
          {...(labelAs === 'label' ? { htmlFor: id } : {})}
          id={`${id}-label`}
          className={labelClass}
        >
          {label}
          {required && (
            <span
              className="text-red-600"
              aria-hidden="true"
            >
              {' '}
              *
            </span>
          )}
        </Label>
      )}
      {children}
      {error ? (
        <span
          id={helpId(id)}
          role="alert"
          className={fieldErrorClass}
        >
          {error}
        </span>
      ) : hint ? (
        <span
          id={helpId(id)}
          className="text-[11px] text-muted"
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/** Two-column field grid that drops to one column on phones. */
export function FormGrid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-x-4 gap-y-3',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-2 max-sm:grid-cols-1',
        columns === 3 && 'grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A titled group of fields inside a form. */
export function FormSection({
  title,
  children,
  columns = 2,
}: {
  title: ReactNode;
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <section className="grid gap-3">
      <h3 className="border-b border-line pb-1.5 text-[11px] font-semibold tracking-widest text-muted uppercase">
        {title}
      </h3>
      <FormGrid columns={columns}>{children}</FormGrid>
    </section>
  );
}
