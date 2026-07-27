import React from "react";
import './InputField.css';
interface InputFieldProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
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
    const inputId =
        id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="cv-input-field">
            <label htmlFor={inputId} className="cv-input-label">
                {label}
                {required && <span className="cv-required">*</span>}
            </label>

            <input
                id={inputId}
                className={`cv-filter-input ${className}`}
                {...props}
            />

            {error && <span className="cv-input-error">{error}</span>}
        </div>
    );
};

export default InputField;