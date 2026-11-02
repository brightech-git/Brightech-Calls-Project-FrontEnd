'use client';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import {
  TextField,
  TextareaField,
  NumberField,
  BarcodeField,
  SelectField,
  MultiSelectField,
  DateField,
  TimeField,
  type SelectOption,
} from '@/components/common/fields';
export type FormFieldConfig<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  type?:
    | 'text'
    | 'password'
    | 'number'
    | 'textarea'
    | 'barcode'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'time';
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  placeholder?: string;
  options?: SelectOption[];
  precision?: number;
  min?: number;
  max?: number;
  fullWidth?: boolean;
};
/** Schema validation comes from the form's zodResolver. Values retain their domain type. */
export function FormFields<T extends FieldValues>({
  fields,
  control,
  disabled,
}: {
  fields: FormFieldConfig<T>[];
  control: Control<T>;
  disabled?: boolean;
}) {
  return (
    <div className="form-grid">
      {fields.map((config) => (
        <div
          className={config.fullWidth ? 'field-full' : undefined}
          key={config.name}
        >
          <Controller
            name={config.name}
            control={control}
            render={({ field, fieldState }) => {
              const common = {
                label: config.label,
                hint: config.hint,
                error: fieldState.error?.message,
                required: config.required,
                disabled: disabled || config.disabled,
              };
              const stringValue =
                typeof field.value === 'string' || typeof field.value === 'number'
                  ? String(field.value)
                  : '';
              switch (config.type) {
                case 'select':
                  return (
                    <SelectField
                      {...field}
                      {...common}
                      value={stringValue}
                      options={config.options ?? []}
                      placeholder={config.placeholder}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  );
                case 'multiselect':
                  return (
                    <MultiSelectField
                      {...common}
                      value={Array.isArray(field.value) ? field.value : []}
                      options={config.options ?? []}
                      onChange={field.onChange}
                    />
                  );
                case 'number':
                  return (
                    <NumberField
                      {...field}
                      {...common}
                      value={stringValue}
                      min={config.min}
                      max={config.max}
                      precision={config.precision}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ''
                            ? undefined
                            : event.target.valueAsNumber,
                        )
                      }
                    />
                  );
                case 'textarea':
                  return (
                    <TextareaField
                      {...field}
                      {...common}
                      value={stringValue}
                      placeholder={config.placeholder}
                      rows={3}
                    />
                  );
                case 'barcode':
                  return (
                    <BarcodeField
                      {...field}
                      {...common}
                      value={stringValue}
                      placeholder={config.placeholder}
                    />
                  );
                case 'date':
                  return (
                    <DateField
                      {...common}
                      value={stringValue}
                      onChange={field.onChange}
                    />
                  );
                case 'time':
                  return (
                    <TimeField
                      {...field}
                      {...common}
                      value={stringValue}
                    />
                  );
                default:
                  return (
                    <TextField
                      {...field}
                      {...common}
                      value={stringValue}
                      type={config.type ?? 'text'}
                      placeholder={config.placeholder}
                    />
                  );
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
