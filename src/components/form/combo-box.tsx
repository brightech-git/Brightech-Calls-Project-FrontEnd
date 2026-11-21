'use client';

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClass } from '@/lib/styles';
import { FormField, helpId, type FieldMeta } from './form-field';
import { moveToNextField } from './enter-navigation';
import {
  pointerMoved,
  listClass,
  optionClass,
  useFloatingList,
} from './use-floating-list';
import type { Option } from './select-input';

export interface ComboBoxProps extends FieldMeta {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Show an × to clear the value. Defaults to true when the field is not required. */
  clearable?: boolean;
  /** Show a "+ Add new" row at the foot of the list. Needs onAddNew. */
  addNew?: boolean;
  /** Called with the text typed so far, so the new record's form can start with it. */
  onAddNew?: (typed: string) => void;
  addNewLabel?: string;
  /** Open the list as soon as the field gets focus. */
  openOnFocus?: boolean;
  /** Move to the next field after an option is picked. Default true. */
  advanceOnSelect?: boolean;
  id?: string;
  name?: string;
  className?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
}

const ADD_NEW = -2;

/**
 * Searchable single select. Type to filter, Up / Down to move, Enter to pick,
 * Esc to close. With the list closed, Enter goes to the next field. When
 * `addNew` is true a "+ Add new" row opens the caller's create form.
 */
export const ComboBox = forwardRef<HTMLInputElement, ComboBoxProps>(function ComboBox(
  {
    label,
    error,
    hint,
    required,
    wrapperClassName,
    inline,
    value,
    onChange,
    options,
    placeholder = 'Select…',
    disabled,
    loading,
    clearable,
    addNew,
    onAddNew,
    addNewLabel = 'Add new',
    openOnFocus,
    advanceOnSelect = true,
    id,
    name,
    className,
    autoFocus,
    onBlur,
  },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  const listId = `${fieldId}-list`;
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => input.current as HTMLInputElement);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rect = useFloatingList(input, open);

  const current = value === null || value === undefined ? '' : String(value);
  const selected = options.find((o) => o.value === current);
  const canAdd = !!addNew && !!onAddNew;
  const canClear = (clearable ?? !required) && !!current && !disabled;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>('[data-active=true]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const openList = () => {
    if (disabled) return;
    const at = filtered.findIndex((o) => o.value === current);
    setHighlight(at >= 0 ? at : 0);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const pick = (option: Option) => {
    if (option.disabled) return;
    onChange(option.value);
    close();
    if (advanceOnSelect) {
      const el = input.current;
      requestAnimationFrame(() => el && moveToNextField(el));
    }
  };

  const startAddNew = () => {
    const typed = query.trim();
    close();
    onAddNew?.(typed);
  };

  const pickHighlighted = () => {
    if (highlight === ADD_NEW) startAddNew();
    else if (filtered[highlight]) pick(filtered[highlight]);
    else if (canAdd && filtered.length === 0) startAddNew();
  };

  const step = (delta: 1 | -1) => {
    const last = filtered.length - 1;
    setHighlight((h) => {
      if (h === ADD_NEW) return delta === 1 ? 0 : Math.max(last, 0);
      const next = h + delta;
      if (next > last) return canAdd ? ADD_NEW : 0;
      if (next < 0) return canAdd ? ADD_NEW : Math.max(last, 0);
      return next;
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else step(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList();
        else step(-1);
        break;
      case 'Enter':
        // Handled here, so the app-wide Enter handler does not move as well.
        event.preventDefault();
        if (open) pickHighlighted();
        else moveToNextField(event.currentTarget);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        break;
      case 'Tab':
        if (open) {
          const exact = filtered.find(
            (o) => o.label.toLowerCase() === query.trim().toLowerCase(),
          );
          if (exact && query) onChange(exact.value);
          close();
        }
        break;
      case 'Backspace':
        if (!open && canClear) {
          event.preventDefault();
          onChange('');
        }
        break;
    }
  };

  const activeId = open
    ? highlight === ADD_NEW
      ? `${listId}-add`
      : filtered[highlight]
        ? `${listId}-${highlight}`
        : undefined
    : undefined;

  return (
    <FormField
      id={fieldId}
      {...{ label, error, hint, required, wrapperClassName, inline }}
    >
      <div className={cn('relative min-w-0', className)}>
        <input
          ref={input}
          id={fieldId}
          name={name}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-required={required || undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? helpId(fieldId) : undefined}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={loading ? 'Loading…' : selected?.label || placeholder}
          value={open ? query : (selected?.label ?? '')}
          onFocus={() => openOnFocus && openList()}
          onClick={() => (open ? undefined : openList())}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (open && query) {
              const exact = options.find(
                (o) => o.label.toLowerCase() === query.trim().toLowerCase(),
              );
              if (exact) onChange(exact.value);
            }
            close();
            onBlur?.();
          }}
          className={cn(controlClass, canClear ? 'pr-12' : 'pr-8')}
        />
        {canClear && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange('');
            }}
            className="absolute top-1/2 right-7 grid size-5 -translate-y-1/2 place-items-center rounded text-muted hover:text-ink"
          >
            <X size={13} />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            if (open) close();
            else {
              input.current?.focus();
              openList();
            }
          }}
          className="absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded text-muted"
        >
          <ChevronDown
            size={15}
            className={cn('transition-transform', open && 'rotate-180')}
          />
        </button>

        {open &&
          rect &&
          createPortal(
            <ul
              ref={list}
              id={listId}
              role="listbox"
              aria-labelledby={label ? `${fieldId}-label` : undefined}
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                transform: rect.above ? 'translateY(-100%)' : undefined,
              }}
              className={cn(listClass, canAdd && 'pb-0')}
            >
              {filtered.length === 0 && (
                <li className="px-2.5 py-2 text-muted">
                  {loading ? 'Loading…' : options.length ? 'No matches' : 'No options'}
                </li>
              )}
              {filtered.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={o.value === current}
                  aria-disabled={o.disabled || undefined}
                  data-active={i === highlight}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={(e) => pointerMoved(e) && setHighlight(i)}
                  onClick={() => pick(o)}
                  className={optionClass}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.value === current && (
                    <Check
                      size={14}
                      aria-hidden
                    />
                  )}
                </li>
              ))}
              {canAdd && (
                <li
                  id={`${listId}-add`}
                  role="option"
                  aria-selected={false}
                  data-active={highlight === ADD_NEW || filtered.length === 0}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={(e) => pointerMoved(e) && setHighlight(ADD_NEW)}
                  onClick={startAddNew}
                  className={cn(
                    optionClass,
                    'sticky bottom-0 mt-1 border-t border-line bg-white py-2 font-semibold text-brand',
                  )}
                >
                  <Plus
                    size={14}
                    aria-hidden
                  />
                  {query.trim() ? `${addNewLabel} “${query.trim()}”` : addNewLabel}
                </li>
              )}
            </ul>,
            document.body,
          )}
      </div>
    </FormField>
  );
});
