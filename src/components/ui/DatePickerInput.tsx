'use client';
import { cn } from '@/lib/utils';
import { controlClass } from '@/lib/styles';
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatApiDate, formatTime, parseDate } from '@/src/utils/format/date';
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
          dateFormat={
            dateFormat ?? (showTimeSelect ? 'dd-MM-yyyy hh:mm aa' : 'dd-MM-yyyy')
          }
          showTimeSelect={showTimeSelect}
          timeFormat="hh:mm aa"
          placeholderText={placeholder}
          disabled={disabled}
          minDate={parseDate(minDate) ?? undefined}
          maxDate={parseDate(maxDate) ?? undefined}
          className={cn(controlClass, className)}
          onBlur={onBlur}
          onKeyDown={(event) =>
            onKeyDown?.(event as React.KeyboardEvent<HTMLInputElement>)
          }
          customInput={<input ref={ref} />}
          // The calendar renders in a body-level portal above tables, sticky headers
          // and modals, so it is never clipped or hidden behind them.
          portalId="calls-date-portal"
          popperClassName="z-[1600]!"
          popperPlacement="bottom-start"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          
        />
      </div>
    );
  },
);
