'use client';
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatApiDate, formatTime, parseDate } from '@/utils/format/date';
interface DatePickerInputProps {
  className?: string;
  value?: string | null;
  onChange: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
  dateFormat?: string;
  maxDate?: Date | string;
  minDate?: Date | string;
  showTimeSelect?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  maxWidth?: string;
  isRoot?: boolean;
  onDateSelect?: () => void;
}
export const DatePickerInput = React.forwardRef<HTMLInputElement, DatePickerInputProps>(
  function DatePickerInput(
    {
      className = '',
      value,
      onChange,
      disabled,
      placeholder = 'dd-MM-yyyy',
      dateFormat,
      maxDate,
      minDate,
      showTimeSelect = false,
      onBlur,
      onKeyDown,
      defaultValue,
      maxWidth = '200px',
      onDateSelect,
    },
    ref,
  ) {
    return (
      <div style={{ width: '100%', maxWidth }}>
        <DatePicker
          selected={parseDate(value === undefined ? defaultValue : value)}
          onChange={(date: Date | null) => {
            onChange(
              date
                ? `${formatApiDate(date)}${showTimeSelect ? `T${formatTime(date)}` : ''}`
                : '',
            );
            onDateSelect?.();
          }}
          dateFormat={dateFormat ?? (showTimeSelect ? 'dd-MM-yy HH:mm:ss' : 'dd-MM-yyyy')}
          showTimeSelect={showTimeSelect}
          timeFormat="HH:mm"
          placeholderText={placeholder}
          disabled={disabled}
          minDate={parseDate(minDate) ?? undefined}
          maxDate={parseDate(maxDate) ?? undefined}
          className={`control ${className}`}
          onBlur={onBlur}
          onKeyDown={(event) =>
            onKeyDown?.(event as React.KeyboardEvent<HTMLInputElement>)
          }
          customInput={<input ref={ref} />}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
    );
  },
);
