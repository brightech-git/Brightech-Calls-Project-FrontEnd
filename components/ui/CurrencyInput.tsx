'use client';
import { forwardRef } from 'react';
import { formatNumber } from '@/utils/format/number';
interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg';
  maxLength?: number;
  decimalScale?: number;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    {
      value,
      onChange,
      disabled,
      placeholder = '0.00',
      maxLength,
      decimalScale = 2,
      onBlur,
      onKeyDown,
      autoFocus,
    },
    ref,
  ) {
    return (
      <div className="currency-control">
        <span aria-hidden="true">₹</span>
        <input
          ref={ref}
          aria-label="Amount"
          className="control"
          inputMode="decimal"
          value={value}
          onChange={(event) => {
            if (/^-?\d*(\.\d*)?$/.test(event.target.value)) onChange(event.target.value);
          }}
          onBlur={() => {
            onChange(formatNumber(value, decimalScale, false));
            onBlur?.();
          }}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
        />
      </div>
    );
  },
);
