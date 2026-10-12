import { ui } from "@/utils/ui";
import React from "react";
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}
const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  required,
  className = "",
  id,
  ...props
}) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return <div className={ui("cv-input-field")}>
            <label htmlFor={inputId} className={ui("cv-input-label")}>
                {label}
                {required && <span className={ui("cv-required")}>*</span>}
            </label>

            <input id={inputId} required={required} aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : undefined} className={ui(`cv-filter-input ${className}`)} {...props} />

            {error && <span id={`${inputId}-error`} className={ui("cv-input-error")}>{error}</span>}
        </div>;
};
export default InputField;
