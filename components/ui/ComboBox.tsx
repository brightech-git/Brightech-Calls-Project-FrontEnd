"use client";

/**
 * ComboBox — single-select dropdown with search and an optional "Add new" row.
 *
 *   searchInModal = false (default): type straight into the field. While typing the
 *                   field shows the search text; otherwise it shows the picked value.
 *   searchInModal = true:  the field only shows the picked value. The search box sits
 *                   at the top of the option list. Good for long lists.
 *
 * Keys: type to search, Up/Down to move, Enter picks and moves to the next field,
 * Esc closes, Tab leaves. With the list closed, Enter moves on (or opens the list
 * when the field is required and empty).
 *
 * For short fixed lists (Yes / No, Active / Inactive) use NativeSelect instead.
 */

import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { focusNextField } from "./focusNextField";

export type ComboBoxValue = string | number;
export interface ComboBoxOption {
  label: string;
  value: ComboBoxValue;
}

export interface ComboBoxProps {
  value: ComboBoxValue | null | undefined;
  options: ComboBoxOption[];
  /** Called with the option's own value (number stays number). "" when cleared. */
  onChange: (value: ComboBoxValue | "") => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Search box at the top of the list instead of in the field. */
  searchInModal?: boolean;
  /** Show an "Add new" row at the end of the list. Needs onAddNew. */
  addNew?: boolean;
  /** Called with the text the user searched for, so the add form can start with it. */
  onAddNew?: (searchText: string) => void;
  addNewLabel?: string;
  /** Show an × to clear the value (not shown when required). */
  clearable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Show option labels in capitals. */
  uppercase?: boolean;
  tabIndex?: number;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

const ADD_NEW = -1;
const LIST_HEIGHT = 280;

const isPrintableKey = (e: KeyboardEvent) => e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

export const ComboBox = forwardRef<HTMLInputElement, ComboBoxProps>(function ComboBox(
  {
    value, options, onChange, onBlur, placeholder = "Select", required, disabled, invalid,
    searchInModal = false, addNew, onAddNew, addNewLabel = "Add new", clearable = false,
    searchPlaceholder = "Search…", emptyText, uppercase = false, tabIndex, id, name,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const listId = useId();
  const field = useRef<HTMLInputElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const refocusing = useRef(false);
  useImperativeHandle(ref, () => field.current as HTMLInputElement);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; above: boolean } | null>(null);

  const current = value == null ? "" : String(value);
  const showAddNew = addNew === true && onAddNew !== undefined;
  const selected = options.find((o) => String(o.value) === current);
  const filtered = useMemo(() => {
    const q = typing ? query.trim().toLowerCase() : "";
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q)) : options;
  }, [options, query, typing]);
  const addRowActive = showAddNew && (highlight === filtered.length || (highlight === ADD_NEW && !filtered.length));
  const panelShown = open && rect !== null;

  // Keep the list next to the field while it is open.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const box = field.current?.getBoundingClientRect();
      if (!box) return;
      const above = box.bottom + LIST_HEIGHT > window.innerHeight && box.top > LIST_HEIGHT;
      setRect({ top: above ? box.top - 4 : box.bottom + 4, left: box.left, width: Math.max(box.width, 220), above });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ block: "nearest" });
  }, [highlight, panelShown]);

  // Search-in-list mode: focus the search box when the list shows, close on an outside click.
  useEffect(() => {
    if (!panelShown || !searchInModal) return;
    search.current?.focus();
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panel.current?.contains(target) || field.current?.parentElement?.contains(target)) return;
      close();
      onBlur?.();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
    // close only uses state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelShown, searchInModal]);

  const openList = (initialQuery = "") => {
    if (disabled) return;
    setQuery(initialQuery);
    setTyping(initialQuery !== "");
    const index = initialQuery ? 0 : options.findIndex((o) => String(o.value) === current);
    setHighlight(index >= 0 ? index : 0);
    setOpen(true);
  };

  function close(refocus = false) {
    setOpen(false);
    setTyping(false);
    setQuery("");
    if (refocus && searchInModal && field.current) {
      refocusing.current = true;
      field.current.focus();
      refocusing.current = false;
    }
  }

  const moveOn = () => {
    const el = field.current;
    // Let the new value render before moving on.
    if (el) requestAnimationFrame(() => focusNextField(el));
  };

  const pick = (option: ComboBoxOption, thenMoveOn: boolean) => {
    if (String(option.value) !== current) onChange(option.value);
    close(true);
    if (thenMoveOn) moveOn();
  };

  const chooseAddNew = () => {
    const text = typing ? query.trim() : "";
    close(true);
    onAddNew?.(text);
  };

  const clear = () => {
    onChange("");
    close();
    field.current?.focus();
  };

  /** Keys while the list is open, shared by the field and the in-list search box. */
  const listKeys = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = showAddNew ? filtered.length : filtered.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((h) => (h >= last ? (filtered.length ? 0 : ADD_NEW) : h + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((h) => (h <= 0 ? last : h - 1));
        break;
      case "PageUp":
        e.preventDefault();
        setHighlight(0);
        break;
      case "PageDown":
        e.preventDefault();
        setHighlight(Math.max(last, 0));
        break;
      case "Enter": {
        e.preventDefault();
        e.stopPropagation();
        const option = filtered[highlight];
        if (addRowActive) chooseAddNew();
        else if (option) pick(option, true);
        else if (showAddNew && !filtered.length) chooseAddNew();
        break;
      }
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close(true);
        break;
      case "Tab":
        close();
        if (searchInModal) {
          e.preventDefault();
          field.current?.focus();
        }
        break;
    }
  };

  const onFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (open) {
      // Search-in-list mode: keys pressed before the search box has focus still search.
      if (searchInModal && isPrintableKey(e)) {
        e.preventDefault();
        setQuery((q) => q + e.key);
        setTyping(true);
        setHighlight(0);
        search.current?.focus();
        return;
      }
      listKeys(e);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "F4":
        e.preventDefault();
        openList();
        return;
      case " ":
        if (searchInModal) {
          e.preventDefault();
          openList();
        }
        return;
      case "Enter":
        e.preventDefault();
        if (current || !required) focusNextField(e.currentTarget);
        else openList();
        return;
      case "Backspace":
      case "Delete":
        if (searchInModal && current && !required) {
          e.preventDefault();
          onChange("");
        }
        return;
    }
    // Search-in-list mode: the first typed letter opens the list and starts the search.
    if (searchInModal && isPrintableKey(e)) {
      e.preventDefault();
      openList(e.key);
    }
  };

  const onFieldBlur = () => {
    if (searchInModal) {
      if (!open) onBlur?.();
      return; // the list's search box takes focus; outside clicks close it
    }
    // Typed an exact name and left the field: take it.
    if (typing && query.trim()) {
      const exact = options.find((o) => o.label.toLowerCase() === query.trim().toLowerCase());
      if (exact && String(exact.value) !== current) onChange(exact.value);
    }
    close();
    onBlur?.();
  };

  const activeId = !open ? undefined
    : highlight >= 0 && highlight < filtered.length ? `${listId}-${highlight}`
    : addRowActive ? `${listId}-add` : undefined;
  const showClear = clearable && !required && !disabled && !!current;
  const addText = typing && query.trim() ? `${addNewLabel} "${query.trim()}"` : addNewLabel;
  const shown = (label: string) => (uppercase ? label.toUpperCase() : label);

  return (
    <div className="cb-root" data-disabled={disabled || undefined}>
      {!searchInModal && <Search size={13} aria-hidden className="cb-lead-icon" />}
      <input
        ref={field}
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete={searchInModal ? "none" : "list"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={searchInModal ? undefined : activeId}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        tabIndex={tabIndex}
        placeholder={selected ? shown(selected.label) : placeholder}
        value={typing && !searchInModal ? query : selected ? shown(selected.label) : ""}
        onFocus={(e) => {
          if (!searchInModal && !refocusing.current) e.currentTarget.select();
        }}
        onClick={() => (open ? undefined : openList())}
        onChange={(e) => {
          if (searchInModal) return; // typing goes to the search box in the list
          setQuery(e.target.value);
          setTyping(true);
          setHighlight(0);
          setOpen(true);
        }}
        onKeyDown={onFieldKeyDown}
        onBlur={onFieldBlur}
        className={`cb-field ${searchInModal ? "cb-field--modal" : ""} ${showClear ? "cb-field--clear" : ""}`}
      />
      {showClear && (
        <button type="button" tabIndex={-1} aria-label="Clear" className="cb-icon-btn cb-clear"
          onMouseDown={(e) => e.preventDefault()} onClick={clear}>
          <X size={13} />
        </button>
      )}
      <button type="button" tabIndex={-1} aria-hidden disabled={disabled} className="cb-icon-btn cb-chevron"
        onMouseDown={(e) => {
          e.preventDefault();
          if (open) close(true);
          else {
            field.current?.focus();
            openList();
          }
        }}>
        <ChevronDown size={14} className={open ? "cb-rotate" : undefined} />
      </button>

      {panelShown && rect && createPortal(
        <div ref={panel} className="cb-panel"
          style={{ top: rect.top, left: rect.left, width: rect.width, transform: rect.above ? "translateY(-100%)" : undefined }}>
          {searchInModal && (
            <div className="cb-search">
              <Search size={12} aria-hidden className="cb-search-icon" />
              <input
                ref={search}
                type="search"
                role="searchbox"
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={activeId}
                autoComplete="off"
                spellCheck={false}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setTyping(true);
                  setHighlight(0);
                }}
                onKeyDown={listKeys}
              />
            </div>
          )}
          <div id={listId} role="listbox" aria-label={ariaLabel ?? placeholder}>
            <ul ref={list} role="presentation" className="cb-list">
              {filtered.length === 0 && (
                <li className="cb-empty">{emptyText ?? (options.length ? "No matches" : "No options")}</li>
              )}
              {filtered.map((option, index) => {
                const isSelected = String(option.value) === current;
                return (
                  <li key={String(option.value)} id={`${listId}-${index}`} role="option" aria-selected={isSelected}
                    data-active={index === highlight} className="cb-option"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => pick(option, false)}>
                    <span className="cb-option-label">{shown(option.label)}</span>
                    {isSelected && <Check size={12} aria-hidden />}
                  </li>
                );
              })}
            </ul>
            {/* Outside the scrolling list, so it never covers an option. */}
            {showAddNew && (
              <div id={`${listId}-add`} role="option" aria-selected={false} data-active={addRowActive}
                className="cb-option cb-add"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(filtered.length)}
                onClick={chooseAddNew}>
                <Plus size={14} aria-hidden /> <span className="cb-option-label">{addText}</span>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
});

export default ComboBox;
