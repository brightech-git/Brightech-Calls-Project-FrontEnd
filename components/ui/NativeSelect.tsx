"use client";

/**
 * NativeSelect — the browser's own <select> for short fixed lists
 * (Yes / No, Active / Inactive, a few statuses). No search and no typing.
 * Use ComboBox for long or loaded lists, or when "Add new" is needed.
 *
 * Leave out the placeholder when one option must always be picked: the select
 * then always holds a value. Enter moves to the next field in the form.
 */

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { focusNextField } from "./focusNextField";

export type NativeSelectValue = string | number;
export interface NativeSelectOption {
  label: string;
  value: NativeSelectValue;
}

/** Active / inactive flag as stored by the backend. */
export const ACTIVE_OPTIONS: NativeSelectOption[] = [
  { label: "Active", value: "Y" },
  { label: "Inactive", value: "N" },
];

/** Plain yes / no flag. */
export const YES_NO_OPTIONS: NativeSelectOption[] = [
  { label: "Yes", value: "Y" },
  { label: "No", value: "N" },
];

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "children"> & {
  value: NativeSelectValue | null | undefined;
  options: NativeSelectOption[];
  /** Called with the option's own value (number stays number). "" for the placeholder row. */
  onChange: (value: NativeSelectValue | "") => void;
  placeholder?: string;
  invalid?: boolean;
};

export const NativeSelect = forwardRef<HTMLSelectElement, Props>(function NativeSelect(
  { value, options, onChange, placeholder, invalid, className = "", onKeyDown, ...rest },
  ref,
) {
  const current = value == null ? "" : String(value);
  // A value the list does not know (old data) is still shown instead of silently becoming the first option.
  const unknown = current !== "" && !options.some((o) => String(o.value) === current);

  return (
    <div className="ns-root">
      <select
        ref={ref}
        value={current}
        aria-invalid={invalid || undefined}
        className={`ns-field ${className}`}
        onChange={(e) => {
          const picked = options.find((o) => String(o.value) === e.target.value);
          onChange(picked ? picked.value : e.target.value);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === "Enter") {
            e.preventDefault();
            focusNextField(e.currentTarget);
          }
        }}
        {...rest}
      >
        {(placeholder !== undefined || current === "") && (
          <option value="" disabled={rest.required}>{placeholder ?? ""}</option>
        )}
        {unknown && <option value={current}>{current}</option>}
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden className="ns-chevron" />
    </div>
  );
});

export default NativeSelect;
