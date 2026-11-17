'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SelectField, type FieldMeta, type SelectOption } from './fields';
import { TextField } from './fields';
import { getApiErrorMessage } from '@/lib/api/errors';
/** Stable queryKey must include the lookup's parent/client/company scope. */
export function AsyncSelectField({
  queryKey,
  loadOptions,
  value,
  onChange,
  disabled,
  ...meta
}: FieldMeta & {
  queryKey: readonly unknown[];
  loadOptions: (search: string, signal: AbortSignal) => Promise<SelectOption[]>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: [...queryKey, debounced],
    queryFn: ({ signal }) => loadOptions(debounced, signal),
    enabled: !disabled,
  });
  const [selected, setSelected] = useState<SelectOption | null>(null);
  const options = query.data ?? [];
  const visible =
    selected?.value === value && !options.some((option) => option.value === value)
      ? [selected, ...options]
      : options;
  return (
    <div className="async-select">
      <TextField
        label={`Search ${meta.label.toLowerCase()}`}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        disabled={disabled}
        type="search"
      />
      <SelectField
        {...meta}
        value={value}
        options={visible}
        disabled={disabled || query.isPending}
        onChange={(event) => {
          setSelected(
            visible.find((option) => option.value === event.target.value) ?? null,
          );
          onChange(event.target.value);
        }}
      />
      {query.isFetching && (
        <span
          className="field-hint"
          role="status"
        >
          Loading options…
        </span>
      )}
      {query.isError && (
        <div
          className="field-error"
          role="alert"
        >
          {getApiErrorMessage(query.error)}{' '}
          <button
            type="button"
            className="button"
            onClick={() => query.refetch()}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
