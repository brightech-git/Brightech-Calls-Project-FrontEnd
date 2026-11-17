'use client';
import {
  forwardRef,
  useId,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react';
import { formatApiDate, parseDate } from '@/utils/format/date';
import { decimalPlaces } from '@/utils/format/number';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
export interface FieldMeta {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}
export function Field({
  label,
  error,
  hint,
  required,
  id,
  children,
}: FieldMeta & { id: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? (
        <span
          className="field-error"
          id={`${id}-help`}
          role="alert"
        >
          {error}
        </span>
      ) : hint ? (
        <span
          className="field-hint"
          id={`${id}-help`}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}
export type TextFieldProps = FieldMeta & InputHTMLAttributes<HTMLInputElement>;
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, required, id, className = '', ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field
      {...{ label, error, hint, required }}
      id={fieldId}
    >
      <input
        {...props}
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-help` : undefined}
        className={`control ${className}`}
      />
    </Field>
  );
});
export const NumberField = forwardRef<
  HTMLInputElement,
  TextFieldProps & { precision?: number }
>(function NumberField({ precision = 2, ...props }, ref) {
  return (
    <TextField
      {...props}
      ref={ref}
      type="number"
      inputMode="decimal"
      step={props.step ?? 10 ** -decimalPlaces(precision)}
    />
  );
});
export const BarcodeField = forwardRef<
  HTMLInputElement,
  TextFieldProps & { onScan?: (value: string) => void }
>(function BarcodeField({ onScan, onKeyDown, ...props }, ref) {
  return (
    <TextField
      {...props}
      ref={ref}
      type="text"
      autoComplete="off"
      spellCheck={false}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && event.key === 'Enter') {
          event.preventDefault();
          onScan?.(event.currentTarget.value.trim());
        }
      }}
    />
  );
});
export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  FieldMeta & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextareaField(
  { label, error, hint, required, id, className = '', ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field
      {...{ label, error, hint, required }}
      id={fieldId}
    >
      <textarea
        {...props}
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-help` : undefined}
        className={`control ${className}`}
      />
    </Field>
  );
});
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export const SelectField = forwardRef<
  HTMLSelectElement,
  FieldMeta &
    SelectHTMLAttributes<HTMLSelectElement> & {
      options: SelectOption[];
      placeholder?: string;
    }
>(function SelectField(
  {
    label,
    error,
    hint,
    required,
    id,
    options,
    placeholder = 'Select…',
    className = '',
    ...props
  },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field
      {...{ label, error, hint, required }}
      id={fieldId}
    >
      <select
        {...props}
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-help` : undefined}
        className={`control ${className}`}
      >
        {!props.multiple && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option
            key={option.value}
            {...option}
          >
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
});
export function MultiSelectField(
  props: Omit<
    React.ComponentProps<typeof SelectField>,
    'multiple' | 'onChange' | 'value'
  > & { value: string[]; onChange: (value: string[]) => void },
) {
  return (
    <SelectField
      {...props}
      multiple
      onChange={(event) =>
        props.onChange(Array.from(event.target.selectedOptions, (option) => option.value))
      }
    />
  );
}
export function DateField({
  value,
  onChange,
  label,
  error,
  hint,
  required,
  disabled,
  min,
  max,
}: FieldMeta & {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
}) {
  const id = useId();
  return (
    <Field
      {...{ label, error, hint, required }}
      id={id}
    >
      <DatePicker
        id={id}
        selected={parseDate(value)}
        onChange={(date: Date | null) => onChange(formatApiDate(date))}
        dateFormat="dd-MM-yyyy"
        placeholderText="dd-MM-yyyy"
        disabled={disabled}
        required={required}
        minDate={parseDate(min) ?? undefined}
        maxDate={parseDate(max) ?? undefined}
        className="control"
        ariaInvalid={error ? 'true' : 'false'}
        ariaDescribedBy={error || hint ? `${id}-help` : undefined}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        isClearable={!required && !disabled}
      />
    </Field>
  );
}
export function TimeField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      type="time"
      step="1"
    />
  );
}
