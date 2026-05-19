"use client";

/**
 * FormField.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A single, config-driven field component that renders every input type your
 * project needs.  Drop it inside any React Hook Form <form> and pass a field
 * descriptor from your config array.
 *
 * Supported types:
 *  text | email | password | number | tel | url
 *  textarea
 *  select (single)
 *  multi-select  (native <select multiple> wrapped in Chakra)
 *  checkbox      (single boolean)
 *  checkbox-group (multiple values)
 *  radio-group
 *  switch
 *  date | time | datetime-local
 *  file
 *  color (color-picker input)
 *  range (slider)
 *  hidden
 *
 * Usage:
 *   <FormField field={fieldConfig} control={control} errors={errors} />
 */

import {
  Box,
  Field,
  Input,
  Textarea,
  NativeSelect,
  Checkbox,
  RadioGroup,
  Switch,
  Text,
  HStack,
  VStack,
  Badge,
  Icon,
} from "@chakra-ui/react";
import {
  Controller,
  Control,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";
import { Eye, EyeOff, Upload } from "lucide-react";
import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "multi-select"
  | "checkbox"
  | "checkbox-group"
  | "radio-group"
  | "switch"
  | "date"
  | "time"
  | "datetime-local"
  | "file"
  | "color"
  | "range"
  | "hidden";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface FieldConfig<T extends FieldValues = FieldValues> {
  name: Path<T>;
  label?: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  // select / multi-select / checkbox-group / radio-group
  options?: SelectOption[];

  // textarea
  rows?: number;

  // file
  accept?: string;
  multiple?: boolean;

  // range
  min?: number;
  max?: number;
  step?: number;

  // layout — how many grid columns to span (1 or 2)
  colSpan?: 1 | 2;

  // horizontal label:value layout
  inline?: boolean;
  labelWidth?: string;
  inputWidth?: string;

  // input behaviour
  capitalize?: boolean;
  tabIndex?: number;
}

interface FormFieldProps<T extends FieldValues> {
  field: FieldConfig<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  inline?: boolean;
}

// ─── Styles (reused) ──────────────────────────────────────────────────────────

const inputStyles = {
  bg: "#ffffff",
  border: "1px solid",
  borderColor: "#d1d5db",
  borderRadius: "6px",
  color: "#111827",
  fontSize: "12px",
  _placeholder: { color: "#9ca3af" },
  _hover: { borderColor: "#9ca3af", bg: "#ffffff" },
  _focus: {
    borderColor: "#6b7280",
    boxShadow: "0 0 0 2px rgba(107,114,128,0.15)",
    bg: "#ffffff",
    outline: "none",
  },
  _disabled: { opacity: 0.4, cursor: "not-allowed" },
  _readOnly: { bg: "#f0fdf4", color: "#15803d", cursor: "default", borderColor: "#bbf7d0" },
  _invalid: { borderColor: "#f87171", boxShadow: "0 0 0 2px rgba(248,113,113,0.18)" },
  height: "30px",
  px: "8px",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#374151",
  letterSpacing: "0.02em",
  mb: "3px",
};

const helperStyle = {
  fontSize: "10px",
  color: "#6b7280",
  mt: "2px",
};

const errorStyle = {
  fontSize: "10px",
  color: "#ef4444",
  mt: "2px",
};

// ─── Helper: get nested error message ─────────────────────────────────────────

function getErrorMessage(errors: FieldErrors, name: string): string | undefined {
  const parts = name.split(".");
  let cur: unknown = errors;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur && typeof cur === "object" && "message" in cur) {
    return (cur as { message?: string }).message;
  }
  return undefined;
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

/** Text-like inputs: text, email, number, tel, url, date, time, datetime-local, color */
function TextInput({
  field,
  value,
  onChange,
  onBlur,
  invalid,
  tabIndex,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
  onBlur: () => void;
  invalid: boolean;
  tabIndex?: number;
}) {
  const [showPw, setShowPw] = useState(false);
  const type =
    field.type === "password" ? (showPw ? "text" : "password") : field.type;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest("form");
      if (!form) return;
      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([tabindex="-1"])'
        )
      );
      const idx = focusable.indexOf(e.target as HTMLElement);
      if (idx >= 0 && idx < focusable.length - 1) focusable[idx + 1].focus();
    }
  };

  if (field.type === "color") {
    return (
      <HStack gap="10px" align="center">
        <input
          type="color"
          value={(value as string) ?? "#4f8ef7"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={field.disabled}
          style={{
            width: 38, height: 38, borderRadius: 8,
            border: "0.5px solid rgba(255,255,255,0.15)",
            background: "transparent", cursor: "pointer", padding: 2,
          }}
        />
        <Text fontSize="13px" color="#6b7280">{(value as string) ?? "#4f8ef7"}</Text>
      </HStack>
    );
  }

  return (
    <Box position="relative">
      {field.readOnly ? (
        <input
          type={type}
          value={(value as string) ?? ""}
          readOnly
          tabIndex={-1}
          style={{
            width: "100%",
            height: "30px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "6px",
            color: "#15803d",
            fontSize: "12px",
            padding: "0 8px",
            cursor: "default",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <Input
          type={type}
          value={(value as string) ?? ""}
          onChange={(e) => {
            if (field.type === "number") {
              onChange(e.target.value === "" ? "" : Number(e.target.value));
              return;
            }
            let v = field.type === "tel"
              ? e.target.value.replace(/\D/g, "").slice(0, 10)
              : field.capitalize
              ? e.target.value.toUpperCase()
              : e.target.value;
            onChange(v);
          }}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder}
          disabled={field.disabled}
          aria-invalid={invalid}
          tabIndex={tabIndex ?? field.tabIndex}
          {...inputStyles}
          pr={field.type === "password" ? "40px" : inputStyles.px}
        />
      )}
      
      {field.type === "password" && !field.readOnly && (
        <button
          type="button"
          onClick={() => setShowPw((p) => !p)}
          tabIndex={-1}
          style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", background: "none",
            border: "none", cursor: "pointer", color: "#9ca3af",
            display: "flex", alignItems: "center",
          }}
        >
          <Icon as={showPw ? EyeOff : Eye} boxSize="14px" />
        </button>
      )}
    </Box>
  );
}

/** Range / Slider */
function RangeInput({
  field,
  value,
  onChange,
  onBlur,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
  onBlur: () => void;
}) {
  const numVal = Number(value ?? field.min ?? 0);
  return (
    <HStack gap="12px" align="center">
      <input
        type="range"
        min={field.min ?? 0}
        max={field.max ?? 100}
        step={field.step ?? 1}
        value={numVal}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(Number(e.target.value))
        }
        onBlur={onBlur}
        disabled={field.disabled}
        style={{ flex: 1, accentColor: "#4f8ef7", cursor: "pointer" }}
      />
      <Badge
        px="10px"
        py="3px"
        borderRadius="6px"
        bg="rgba(79,142,247,0.15)"
        color="#7fb3ff"
        fontSize="12px"
        fontWeight="600"
        minW="40px"
        textAlign="center"
      >
        {numVal}
      </Badge>
    </HStack>
  );
}

/** Textarea */
function TextareaInput({
  field,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
  onBlur: () => void;
  invalid: boolean;
}) {
  return (
    <Textarea
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      readOnly={field.readOnly}
      rows={field.rows ?? 3}
      aria-invalid={invalid}
      resize="vertical"
      {...inputStyles}
      height="auto"
      py="8px"
    />
  );
}

/** Select */
function SelectInput({
  field,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
  onBlur: () => void;
  invalid: boolean;
}) {
  return (
    <NativeSelect.Root disabled={field.disabled}>
      <NativeSelect.Field
        value={(value as string) ?? ""}
        onChange={(e) => {
            const val = e.target.value;
            const num = Number(val);
            onChange(!isNaN(num) && val !== "" ? num : val);
          }}
        onBlur={onBlur}
        aria-invalid={invalid}
        {...inputStyles}
      >
        <option value="" disabled style={{ background: "#1a1d2e", color: "rgba(255,255,255,0.5)" }}>
          {field.placeholder ?? "Select an option"}
        </option>
        {field.options?.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: "#1a1d2e", color: "rgba(255,255,255,0.85)" }}
          >
            {opt.label}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}

/** Multi-select */
function MultiSelectInput({
  field,
  value,
  onChange,
  onBlur,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
  onBlur: () => void;
}) {
  const selected: string[] = Array.isArray(value) ? (value as string[]) : [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
    onChange(vals);
  };

  return (
    <Box position="relative">
      <select
        multiple
        value={selected}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={field.disabled}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "rgba(255,255,255,0.85)",
          fontSize: 13,
          padding: "6px 10px",
          minHeight: 90,
          outline: "none",
        }}
      >
        {field.options?.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: "#1a1d2e", color: "rgba(255,255,255,0.85)", padding: "4px 0" }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <HStack gap="4px" flexWrap="wrap" mt="6px">
          {selected.map((s) => {
            const opt = field.options?.find((o) => String(o.value) === s);
            return (
              <Badge
                key={s}
                px="8px"
                py="2px"
                borderRadius="20px"
                bg="rgba(79,142,247,0.15)"
                color="#7fb3ff"
                fontSize="11px"
              >
                {opt?.label ?? s}
              </Badge>
            );
          })}
        </HStack>
      )}
      <Text {...helperStyle}>Hold Ctrl / Cmd to select multiple</Text>
    </Box>
  );
}

/** Checkbox group */
function CheckboxGroupInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const selected: string[] = Array.isArray(value) ? (value as string[]) : [];

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val]
    );
  };

  return (
    <VStack align="start" gap="6px">
      {field.options?.map((opt) => {
        const checked = selected.includes(String(opt.value));
        return (
          <Checkbox.Root
            key={opt.value}
            checked={checked}
            onCheckedChange={() => toggle(String(opt.value))}
            disabled={field.disabled}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              w="16px"
              h="16px"
              borderRadius="4px"
              border="0.5px solid"
              borderColor={checked ? "#4f8ef7" : "rgba(255,255,255,0.2)"}
              bg={checked ? "rgba(79,142,247,0.2)" : "transparent"}
            >
              <Checkbox.Indicator color="#7fb3ff" />
            </Checkbox.Control>
            <Checkbox.Label fontSize="13px" color="rgba(255,255,255,0.65)">
              {opt.label}
            </Checkbox.Label>
          </Checkbox.Root>
        );
      })}
    </VStack>
  );
}

/** Radio group */
function RadioGroupInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <RadioGroup.Root
      value={(value as string) ?? ""}
      onValueChange={(e) => onChange(e.value)}
      disabled={field.disabled}
    >
      <VStack align="start" gap="6px">
        {field.options?.map((opt) => {
          const checked = String(value) === String(opt.value);
          return (
            <RadioGroup.Item key={opt.value} value={String(opt.value)}>
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemControl
                w="16px"
                h="16px"
                borderRadius="50%"
                border="0.5px solid"
                borderColor={checked ? "#4f8ef7" : "rgba(255,255,255,0.2)"}
                bg={checked ? "rgba(79,142,247,0.15)" : "transparent"}
              >
                <RadioGroup.ItemIndicator
                  w="8px"
                  h="8px"
                  bg="#4f8ef7"
                  borderRadius="50%"
                />
              </RadioGroup.ItemControl>
              <RadioGroup.ItemText fontSize="13px" color="rgba(255,255,255,0.65)">
                {opt.label}
              </RadioGroup.ItemText>
            </RadioGroup.Item>
          );
        })}
      </VStack>
    </RadioGroup.Root>
  );
}

/** Single Checkbox (boolean) */
function SingleCheckbox({
  field,
  value,
  onChange,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const checked = Boolean(value);
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={(e) => onChange(e.checked)}
      disabled={field.disabled}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control
        w="16px"
        h="16px"
        borderRadius="4px"
        border="0.5px solid"
        borderColor={checked ? "#4f8ef7" : "rgba(255,255,255,0.2)"}
        bg={checked ? "rgba(79,142,247,0.2)" : "transparent"}
      >
        <Checkbox.Indicator color="#7fb3ff" />
      </Checkbox.Control>
      <Checkbox.Label fontSize="13px" color="rgba(255,255,255,0.65)">
        {field.label}
      </Checkbox.Label>
    </Checkbox.Root>
  );
}

/** Switch */
function SwitchInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig<any>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const checked = Boolean(value);
  return (
    <HStack gap="10px" align="center">
      <Switch.Root
        checked={checked}
        onCheckedChange={(e) => onChange(e.checked)}
        disabled={field.disabled}
      >
        <Switch.HiddenInput />
        <Switch.Control
          w="36px"
          h="20px"
          borderRadius="10px"
          bg={checked ? "#4f8ef7" : "rgba(255,255,255,0.12)"}
          transition="background 0.2s"
        >
          <Switch.Thumb
            w="16px"
            h="16px"
            borderRadius="50%"
            bg="white"
            shadow="sm"
            transition="transform 0.2s"
            transform={checked ? "translateX(16px)" : "translateX(0)"}
          />
        </Switch.Control>
      </Switch.Root>
      <Text fontSize="13px" color="rgba(255,255,255,0.55)">
        {checked ? "Enabled" : "Disabled"}
      </Text>
    </HStack>
  );
}

/** File upload */
function FileInput({
  field,
  onChange,
}: {
  field: FieldConfig<any>;
  onChange: (v: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files ?? []);
    setFiles(f);
    onChange(field.multiple ? e.target.files : e.target.files?.[0]);
  };

  return (
    <Box>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={field.disabled}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderRadius: 8,
          border: "0.5px dashed rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.02)",
          color: "rgba(255,255,255,0.45)",
          fontSize: 13,
          cursor: "pointer",
          width: "100%",
        }}
      >
        <Icon as={Upload} boxSize="14px" />
        {files.length > 0
          ? files.map((f) => f.name).join(", ")
          : (field.placeholder ?? "Click to upload")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={field.accept}
        multiple={field.multiple}
        style={{ display: "none" }}
        onChange={handleChange}
        disabled={field.disabled}
      />
    </Box>
  );
}

// ─── Main FormField Component ─────────────────────────────────────────────────

export function FormField<T extends FieldValues>({
  field,
  control,
  errors,
  inline: inlineProp,
}: FormFieldProps<T>) {
  const errorMsg = getErrorMessage(errors, field.name as string);
  const invalid = !!errorMsg;
  const isInline = field.inline ?? inlineProp ?? false;

  // Hidden field — no UI
  if (field.type === "hidden") {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: f }) => <input type="hidden" {...f} />}
      />
    );
  }

  // Boolean checkbox shows label inside the control, not above
  const isBoolean = field.type === "checkbox" || field.type === "switch";

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: f }) => (
        <Field.Root invalid={invalid} disabled={field.disabled}>
          {isInline ? (
            // ── Horizontal label : input layout ──
            <Box w="full">
              <HStack align="center" gap="0" w="full">
                <Box
                  w={field.labelWidth ?? "110px"}
                  flexShrink={0}
                  display="flex"
                  alignItems="center"
                  gap="4px"
                >
                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    color={field.readOnly ? "#9ca3af" : "#374151"}
                    letterSpacing="0.02em"
                  >
                    {field.label}
                  </Text>
                  {field.required && (
                    <Text as="span" color="#ef4444" fontSize="12px">*</Text>
                  )}
                  <Text fontSize="12px" color="#9ca3af" ml="1px">:</Text>
                </Box>
                <Box flex="1" w={field.inputWidth}>
                  {renderInput(field, f, invalid)}
                  {field.helperText && !errorMsg && (
                    <Text {...helperStyle}>{field.helperText}</Text>
                  )}
                  {errorMsg && (
                    <Field.ErrorText {...errorStyle}>{errorMsg}</Field.ErrorText>
                  )}
                </Box>
              </HStack>
            </Box>
          ) : (
            // ── Vertical (default) layout ──
            <Box w="full">
              {/* Label — skip for single checkbox / switch (they render it inline) */}
              {field.label && !isBoolean && (
                <Field.Label {...labelStyle}>
                  {field.label}
                  {field.required && (
                    <Text as="span" color="#ef4444" ml="3px">*</Text>
                  )}
                </Field.Label>
              )}
              {renderInput(field, f, invalid)}
              {field.helperText && !errorMsg && (
                <Text {...helperStyle}>{field.helperText}</Text>
              )}
              {errorMsg && (
                <Field.ErrorText {...errorStyle}>{errorMsg}</Field.ErrorText>
              )}
            </Box>
          )}

        </Field.Root>
      )}
    />
  );
}

// ─── Extracted input renderer ─────────────────────────────────────────────────

function renderInput(field: FieldConfig<any>, f: any, invalid: boolean) {
  if (
    field.type === "text" || field.type === "email" || field.type === "password" ||
    field.type === "number" || field.type === "tel" || field.type === "url" ||
    field.type === "date" || field.type === "time" || field.type === "datetime-local" ||
    field.type === "color"
  ) {
    return <TextInput field={field} value={f.value} onChange={f.onChange} onBlur={f.onBlur} invalid={invalid} tabIndex={field.tabIndex} />;
  }
  if (field.type === "range") {
    return <RangeInput field={field} value={f.value} onChange={f.onChange} onBlur={f.onBlur} />;
  }
  if (field.type === "textarea") {
    return <TextareaInput field={field} value={f.value} onChange={f.onChange} onBlur={f.onBlur} invalid={invalid} />;
  }
  if (field.type === "select") {
    return <SelectInput field={field} value={f.value} onChange={f.onChange} onBlur={f.onBlur} invalid={invalid} />;
  }
  if (field.type === "multi-select") {
    return <MultiSelectInput field={field} value={f.value} onChange={f.onChange} onBlur={f.onBlur} />;
  }
  if (field.type === "checkbox-group") {
    return <CheckboxGroupInput field={field} value={f.value} onChange={f.onChange} />;
  }
  if (field.type === "radio-group") {
    return <RadioGroupInput field={field} value={f.value} onChange={f.onChange} />;
  }
  if (field.type === "checkbox") {
    return <SingleCheckbox field={field} value={f.value} onChange={f.onChange} />;
  }
  if (field.type === "switch") {
    return <SwitchInput field={field} value={f.value} onChange={f.onChange} />;
  }
  if (field.type === "file") {
    return <FileInput field={field} onChange={f.onChange} />;
  }
  return null;
}