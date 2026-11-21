import React from 'react';
import { cn } from '@/lib/utils';
import { controlClass, fieldErrorClass, labelClass } from '@/lib/styles';
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}
const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  required,
  className = '',
  id,
  ...props
}) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={inputId}
        className={labelClass}
      >
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </label>

      <input
        id={inputId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(controlClass, className)}
        {...props}
      />

      {error && (
        <span
          id={`${inputId}-error`}
          className={fieldErrorClass}
        >
          {error}
        </span>
      )}
    </div>
  );
};
export default InputField;
