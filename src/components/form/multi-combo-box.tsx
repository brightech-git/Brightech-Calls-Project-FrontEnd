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

export interface MultiComboBoxProps extends FieldMeta {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Show the picks as removable chips under the box. Default true. */
  showChips?: boolean;
  addNew?: boolean;
  onAddNew?: (typed: string) => void;
  addNewLabel?: string;
  id?: string;
  className?: string;
}

const SELECT_ALL = -1;
const ADD_NEW = -2;

/**
 * Searchable multi select: type to filter, Up / Down to move, Enter or Space
 * to tick, Esc to close. With the list closed, Enter goes to the next field.
 */
export const MultiComboBox = forwardRef<HTMLInputElement, MultiComboBoxProps>(
  function MultiComboBox(
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
      showChips = true,
      addNew,
      onAddNew,
      addNewLabel = 'Add new',
      id,
      className,
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
    const canAdd = !!addNew && !!onAddNew;

    const selected = useMemo(() => new Set(value), [value]);
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    }, [options, query]);
    const allShownPicked =
      filtered.length > 0 && filtered.every((o) => selected.has(o.value));
    const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

    const summary =
      value.length === 0
        ? ''
        : value.length <= 2
          ? value.map(labelOf).join(', ')
          : `${value.length} selected`;

    useEffect(() => {
      list.current
        ?.querySelector<HTMLElement>('[data-active=true]')
        ?.scrollIntoView({ block: 'nearest' });
    }, [highlight, open]);

    const openList = () => {
      if (disabled) return;
      setHighlight(0);
      setOpen(true);
    };
    const close = () => {
      setOpen(false);
      setQuery('');
    };

    const toggle = (o: Option) => {
      if (o.disabled) return;
      onChange(
        selected.has(o.value) ? value.filter((v) => v !== o.value) : [...value, o.value],
      );
    };

    const toggleAllShown = () => {
      const shown = new Set(filtered.map((o) => o.value));
      onChange(
        allShownPicked
          ? value.filter((v) => !shown.has(v))
          : [
              ...value,
              ...filtered
                .filter((o) => !o.disabled && !selected.has(o.value))
                .map((o) => o.value),
            ],
      );
    };

    const startAddNew = () => {
      const typed = query.trim();
      close();
      onAddNew?.(typed);
    };

    const rows = [
      ...filtered.map((_, i) => i),
      ...(filtered.length > 1 ? [SELECT_ALL] : []),
      ...(canAdd ? [ADD_NEW] : []),
    ];
    const step = (delta: 1 | -1) =>
      setHighlight((h) => {
        const at = rows.indexOf(h);
        return rows[(at + delta + rows.length) % rows.length] ?? 0;
      });

    const pickHighlighted = () => {
      if (highlight === SELECT_ALL) toggleAllShown();
      else if (highlight === ADD_NEW) startAddNew();
      else if (filtered[highlight]) toggle(filtered[highlight]);
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
          event.preventDefault();
          if (open) pickHighlighted();
          else moveToNextField(event.currentTarget);
          break;
        case ' ':
          if (open && !query) {
            event.preventDefault();
            pickHighlighted();
          }
          break;
        case 'Escape':
          if (open) {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
          break;
        case 'Backspace':
          if (!query && value.length) onChange(value.slice(0, -1));
          break;
        case 'Tab':
          close();
          break;
      }
    };

    const activeId = !open
      ? undefined
      : highlight === SELECT_ALL
        ? `${listId}-all`
        : highlight === ADD_NEW
          ? `${listId}-add`
          : filtered[highlight]
            ? `${listId}-${highlight}`
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
            disabled={disabled}
            placeholder={loading ? 'Loading…' : summary || placeholder}
            value={open ? query : summary}
            onClick={() => (open ? undefined : openList())}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            onBlur={close}
            className={cn(controlClass, value.length ? 'pr-12' : 'pr-8')}
          />
          {value.length > 0 && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange([]);
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
                aria-multiselectable
                aria-labelledby={label ? `${fieldId}-label` : undefined}
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  transform: rect.above ? 'translateY(-100%)' : undefined,
                }}
                className={cn(listClass, 'pb-0')}
              >
                {filtered.length === 0 && (
                  <li className="px-2.5 py-2 text-muted">
                    {options.length ? 'No matches' : 'No options'}
                  </li>
                )}
                {filtered.map((o, i) => {
                  const on = selected.has(o.value);
                  return (
                    <li
                      key={o.value}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={on}
                      aria-disabled={o.disabled || undefined}
                      data-active={i === highlight}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseMove={(e) => pointerMoved(e) && setHighlight(i)}
                      onClick={() => toggle(o)}
                      className={optionClass}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-4 shrink-0 place-items-center rounded border',
                          on
                            ? 'border-brand bg-brand text-white'
                            : 'border-line-strong bg-white',
                        )}
                      >
                        {on && <Check size={12} />}
                      </span>
                      <span className="flex-1 truncate">{o.label}</span>
                    </li>
                  );
                })}
                {(filtered.length > 1 || canAdd) && (
                  <li
                    role="presentation"
                    className="sticky bottom-0 mt-1 border-t border-line bg-white"
                  >
                    <ul role="group">
                      {filtered.length > 1 && (
                        <li
                          id={`${listId}-all`}
                          role="option"
                          aria-selected={allShownPicked}
                          data-active={highlight === SELECT_ALL}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseMove={(e) => pointerMoved(e) && setHighlight(SELECT_ALL)}
                          onClick={toggleAllShown}
                          className={cn(optionClass, 'py-2 font-semibold text-brand')}
                        >
                          {allShownPicked ? 'Clear all shown' : 'Select all shown'}
                        </li>
                      )}
                      {canAdd && (
                        <li
                          id={`${listId}-add`}
                          role="option"
                          aria-selected={false}
                          data-active={highlight === ADD_NEW}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseMove={(e) => pointerMoved(e) && setHighlight(ADD_NEW)}
                          onClick={startAddNew}
                          className={cn(optionClass, 'py-2 font-semibold text-brand')}
                        >
                          <Plus
                            size={14}
                            aria-hidden
                          />
                          {addNewLabel}
                        </li>
                      )}
                    </ul>
                  </li>
                )}
              </ul>,
              document.body,
            )}
        </div>
        {showChips && value.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {value.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded bg-brand-soft py-0.5 pr-1 pl-2 text-[11px] font-medium text-brand"
              >
                {labelOf(v)}
                {!disabled && (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Remove ${labelOf(v)}`}
                    onClick={() => onChange(value.filter((x) => x !== v))}
                    className="grid size-4 place-items-center rounded hover:bg-brand/10"
                  >
                    <X size={11} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </FormField>
    );
  },
);
