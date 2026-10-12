"use client";

import { ui } from "@/utils/ui";
import React, { forwardRef } from "react";
import { NativeSelect } from "@chakra-ui/react";
import { For } from "@chakra-ui/react";
import { FONT } from "@/utils/theme";
export type SelectItem = {
  label: string;
  value: string;
};
type NativeSelectWrapperProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  items: SelectItem[];
  placeholder?: string;
  size?: "xs" | "sm" | "md" | "lg";
  minW?: string;
  maxWidth?: string;
  fontSize?: string;
  disabled?: boolean;
  onEnter?: () => void;
  onClick?: () => void; // added
  onFocus?: () => void; // added
  className?: string;
  css?: any;
  onBlur?: () => void;
};
export const NativeSelectWrapper = forwardRef<HTMLSelectElement, NativeSelectWrapperProps>(({
  value,
  onChange,
  items,
  placeholder = "Select",
  size = "xs",
  minW = "90px",
  fontSize = FONT.size.sm,
  disabled = false,
  onEnter,
  onClick,
  onFocus,
  className,
  css,
  onBlur,
  maxWidth = "90px"
}, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onEnter?.();
    }
  };
  const handleOpenOptions = (e: React.MouseEvent<HTMLSelectElement> | React.FocusEvent<HTMLSelectElement>) => {
    // open native select options
    //e.currentTarget.size = items.length;

    if ("blur" in e.currentTarget) {
      e.currentTarget.focus();
    }
  };
  return <NativeSelect.Root size={size} minW={minW} maxW={maxWidth} fontSize={fontSize} disabled={disabled} onBlur={onBlur}>
                <NativeSelect.Field fontSize={fontSize} ref={ref} value={value} onChange={onChange} onKeyDown={handleKeyDown} onClick={e => {
      handleOpenOptions(e);
      onClick?.();
    }} onFocus={e => {
      handleOpenOptions(e);
      onFocus?.();
    }} className={ui("form-control " + ui(className + " " + "[min-height:var(--control-height)]! [border-radius:10px]!"))} css={{
      backgroundColor: "var(--surface)",
      color: "var(--text-main)",
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      height: "var(--control-height)",
      fontSize: fontSize,
      ...css
    }}>
                    <For each={items}>
                        {item => <option key={item.value} value={item.value}>
                                {item.label}
                            </option>}
                    </For>
                </NativeSelect.Field>

                <NativeSelect.Indicator />
            </NativeSelect.Root>;
});
NativeSelectWrapper.displayName = "NativeSelectWrapper";
