'use client';

import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  ChevronRightCircle,
} from 'lucide-react';
import { useState, useMemo, useCallback, Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { PAGE_CONFIG } from '@/config/pageConfig';
import { cn } from '@/lib/utils';
import { cardClass, iconButtonClass } from '@/lib/styles';

const thClass =
  'sticky top-0 z-[1] border-b border-line bg-gray-50 px-3 py-2 text-left text-[11px] font-semibold tracking-wide whitespace-nowrap text-ink uppercase';
const tdClass = 'border-t border-line px-3 py-row align-middle text-[13px] whitespace-nowrap text-ink';
const pageBtnClass =
  'inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs text-ink hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30';
const checkboxClass = 'size-3.5 cursor-pointer accent-brand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc' | null;
export interface TableColumn<T = Record<string, unknown>> {
  /** Maps to the key in your data object */
  key: keyof T | string;
  /** Column header label */
  header: string;
  /** Cell content override — receives full row */
  render?: (row: T, index: number) => React.ReactNode;
  /** Enable column sorting */
  sortable?: boolean;
  /** Cell text alignment */
  align?: 'left' | 'center' | 'right';
  /** Fixed pixel / % width */
  width?: string;
  /** Auto-apply status badge coloring if value matches status words */
  isStatus?: boolean;
}
export interface RowAction<T = Record<string, unknown>> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  colorScheme?: 'blue' | 'red' | 'green' | 'amber';
}
export interface CustomTableProps<T extends object> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  /** Rows per page options */
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  /** Row key field (for selection). Defaults to "id" */
  rowKey?: keyof T;
  /** Show row checkboxes */
  selectable?: boolean;
  /** Called with selected rows when selection changes */
  onSelectionChange?: (rows: T[]) => void;
  /** Shorthand for edit action */
  onEdit?: (row: T) => void;
  /** Shorthand for delete action */
  onDelete?: (row: T) => void;
  /** Additional custom row actions */
  extraActions?: RowAction<T>[];
  /** Slot rendered above the table when rows are selected (bulk actions) */
  bulkActionSlot?: (selected: T[], clearSelection: () => void) => React.ReactNode;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Caption shown in empty state */
  emptyMessage?: string;
  /** Table title shown in the toolbar */
  title?: string;
  /** Slot rendered in the top-right toolbar (e.g. an "Add" button) */
  toolbarRight?: React.ReactNode;

  expandedRowRender?: (row: T) => React.ReactNode;
  showSearch?: boolean;
  showPagination?: boolean;
  highlightRowId?: string | number | null;
  onRowClick?: (row: T) => void;
}


// ─── Status badge coloring ────────────────────────────────────────────────────

const GOOD = 'bg-emerald-50 text-emerald-700';
const BAD = 'bg-rose-50 text-rose-700';
const WAIT = 'bg-amber-50 text-amber-700';
const STATUS_CLASSES: Record<string, string> = {
  active: GOOD,
  inactive: BAD,
  pending: WAIT,
  approved: GOOD,
  rejected: BAD,
  cancelled: BAD,
  draft: 'bg-gray-100 text-ink',
  paid: GOOD,
  unpaid: BAD,
  processing: WAIT,
  y: GOOD,
  n: BAD,
};
function StatusBadge({ value }: { value: string }) {
  const tone = STATUS_CLASSES[String(value).toLowerCase()] ?? 'bg-gray-100 text-ink';
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold', tone)}>
      {String(value)}
    </span>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc') return <ChevronUp size={12} className="text-brand" />;
  if (dir === 'desc') return <ChevronDown size={12} className="text-brand" />;
  return <ChevronsUpDown size={12} className="text-gray-400" />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-t border-line">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div
            className={cn(
              'h-3 animate-pulse rounded bg-gray-100',
              i === 0 ? 'w-3/5' : i % 2 === 0 ? 'w-4/5' : 'w-1/2',
            )}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Get nested value ─────────────────────────────────────────────────────────

function getVal(row: object, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => {
    if (acc != null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, row);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomTable<T extends object>({
  columns,
  data,
  isLoading = false,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  rowKey = 'id' as keyof T,
  selectable = false,
  onSelectionChange,
  onEdit,
  onDelete,
  extraActions = [],
  bulkActionSlot,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found',
  title,
  toolbarRight,
  expandedRowRender,
  showSearch = true,
  showPagination = true,
  highlightRowId,
  onRowClick,
}: CustomTableProps<T>) {
  const pathname = usePathname();
  const tableTitle = title || PAGE_CONFIG[pathname]?.title || 'Records';
  // ── State ──
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selected, setSelected] = useState<Set<unknown>>(new Set());
  const [expandedKeys, setExpandedKeys] = useState<Set<unknown>>(new Set());
  const toggleExpanded = (row: T) => {
    const key = row[rowKey];
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ── Derived data ──
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = getVal(row, col.key as string);
        return String(val ?? '')
          .toLowerCase()
          .includes(q);
      }),
    );
  }, [rows, search, columns]);
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getVal(a, sortKey);
      const bv = getVal(b, sortKey);
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, {
        numeric: true,
      });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = showPagination
    ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sorted;

  // ── Sort handler ──
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey !== key) {
        setSortKey(key);
        setSortDir('asc');
      } else if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortKey(null);
        setSortDir(null);
      }
      setPage(1);
    },
    [sortKey, sortDir],
  );

  // ── Selection ──
  const selectedRows = useMemo(
    () => data.filter((r) => selected.has(r[rowKey])),
    [data, selected, rowKey],
  );
  const allPageSelected = paged.length > 0 && paged.every((r) => selected.has(r[rowKey]));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allPageSelected) {
      paged.forEach((r) => next.delete(r[rowKey]));
    } else {
      paged.forEach((r) => next.add(r[rowKey]));
    }
    setSelected(next);
    onSelectionChange?.(data.filter((r) => next.has(r[rowKey])));
  };
  const toggleRow = (row: T) => {
    const next = new Set(selected);
    if (next.has(row[rowKey])) {
      next.delete(row[rowKey]);
    } else {
      next.add(row[rowKey]);
    }
    setSelected(next);
    onSelectionChange?.(data.filter((r) => next.has(r[rowKey])));
  };
  const clearSelection = () => {
    setSelected(new Set());
    onSelectionChange?.([]);
  };

  // ── Actions present? ──
  const hasActions =
    !!onEdit || !!onDelete || extraActions.length > 0 || !!expandedRowRender;
  const colCount = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  // ── Page number window ──
  const pageWindow = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, safePage - delta);
      i <= Math.min(totalPages, safePage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [safePage, totalPages]);


  const alignClass = (align?: 'left' | 'center' | 'right') =>
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const justifyClass = (align?: 'left' | 'center' | 'right') =>
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn(cardClass, 'flex min-h-64 flex-col overflow-hidden')}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {tableTitle && <p className="text-sm font-semibold text-ink">{tableTitle}</p>}
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-ink">
            {isLoading ? '…' : sorted.length.toLocaleString()}
          </span>
          {showSearch && (
            <div className="relative ml-auto max-sm:ml-0 max-sm:w-full">
              <Search
                size={13}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                aria-label={searchPlaceholder || 'Search records'}
                className="h-8 w-56 max-w-full rounded-md border border-line bg-white pr-2.5 pl-7 text-xs text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 max-sm:w-full"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && bulkActionSlot && (
            <div>{bulkActionSlot(selectedRows, clearSelection)}</div>
          )}
          {toolbarRight}
        </div>
      </div>

      {/* ── Bulk selection banner ── */}
      {selected.size > 0 && !bulkActionSlot && (
        <div className="flex items-center gap-2 border-b border-line bg-brand-soft px-3 py-1.5">
          <p className="text-xs font-semibold text-brand">
            {selected.size} row{selected.size > 1 ? 's' : ''} selected
          </p>
          <button
            type="button"
            onClick={clearSelection}
            className="cursor-pointer text-xs text-ink underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="flex-1 overflow-x-auto">
        <table
          className="w-full border-collapse"
          aria-label={title || 'Records'}
          aria-busy={isLoading}
        >
          <thead>
            <tr>
              {selectable && (
                <th className={cn(thClass, 'w-10 text-center')}>
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    aria-label="Select all rows on this page"
                    checked={allPageSelected && paged.length > 0}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {hasActions && <th className={cn(thClass, 'w-20')}>Actions</th>}
              {columns.map((col) => {
                const isSortActive = sortKey === col.key;
                return (
                  <th
                    key={col.key as string}
                    className={cn(
                      thClass,
                      alignClass(col.align),
                      col.sortable && 'cursor-pointer select-none hover:text-brand',
                      isSortActive && 'text-brand',
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={
                      col.sortable
                        ? isSortActive && sortDir
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                    tabIndex={col.sortable ? 0 : undefined}
                    onKeyDown={
                      col.sortable
                        ? (event: React.KeyboardEvent) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleSort(col.key as string);
                            }
                          }
                        : undefined
                    }
                    onClick={col.sortable ? () => handleSort(col.key as string) : undefined}
                  >
                    <span className={cn('flex items-center gap-1', justifyClass(col.align))}>
                      {col.header}
                      {col.sortable && <SortIcon dir={isSortActive ? sortDir : null} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <SkeletonRow
                  key={i}
                  cols={colCount}
                />
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-0 py-10 text-center"
                >
                  <div className="flex flex-col items-center gap-1.5 text-muted">
                    <Inbox
                      size={28}
                      strokeWidth={1.2}
                    />
                    <p className="text-[13px]">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, rowIdx) => {
                const isSelected = selected.has(row[rowKey]);
                const isExpanded = expandedRowRender ? expandedKeys.has(row[rowKey]) : false;
                const highlighted =
                  isSelected ||
                  (highlightRowId != null && String(row[rowKey]) === String(highlightRowId));
                return (
                  <Fragment key={String(row[rowKey] ?? rowIdx)}>
                    <tr
                      className={cn(
                        'hover:bg-gray-50',
                        highlighted && 'bg-brand-soft hover:bg-brand-soft',
                      )}
                    >
                      {selectable && (
                        <td className={cn(tdClass, 'text-center')}>
                          <input
                            type="checkbox"
                            className={checkboxClass}
                            aria-label="Select row"
                            checked={isSelected}
                            onChange={() => toggleRow(row)}
                          />
                        </td>
                      )}

                      {hasActions && (
                        <td className={tdClass}>
                          <div className="flex items-center gap-1">
                            {expandedRowRender && (
                              <button
                                type="button"
                                className={cn(iconButtonClass, isExpanded && 'bg-gray-100')}
                                title={isExpanded ? 'Hide details' : 'Show details'}
                                aria-label={isExpanded ? 'Hide details' : 'Show details'}
                                aria-expanded={isExpanded}
                                onClick={() => toggleExpanded(row)}
                              >
                                <ChevronRightCircle
                                  size={15}
                                  className={cn('transition-transform', isExpanded && 'rotate-90')}
                                />
                              </button>
                            )}
                            {extraActions.map((act, ai) => (
                              <button
                                type="button"
                                key={ai}
                                className={iconButtonClass}
                                title={act.label}
                                aria-label={act.label}
                                onClick={() => act.onClick(row)}
                              >
                                {act.icon ?? <ChevronRightCircle size={14} />}
                              </button>
                            ))}
                            {onEdit && (
                              <button
                                type="button"
                                className={cn(iconButtonClass, 'hover:border-brand hover:text-brand')}
                                title="Edit"
                                aria-label="Edit"
                                onClick={() => onEdit(row)}
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                type="button"
                                className={cn(
                                  iconButtonClass,
                                  'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600',
                                )}
                                title="Delete"
                                aria-label="Delete"
                                onClick={() => onDelete(row)}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {columns.map((col, colIdx) => {
                        const rawVal = getVal(row, col.key as string);
                        return (
                          <td
                            key={col.key as string}
                            className={cn(
                              tdClass,
                              alignClass(col.align),
                              colIdx === 0 && 'font-semibold',
                              onRowClick && 'cursor-pointer',
                            )}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                          >
                            {col.render ? (
                              col.render(row, rowIdx)
                            ) : col.isStatus ? (
                              <StatusBadge value={String(rawVal ?? '')} />
                            ) : (
                              <span>{String(rawVal ?? '—')}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {expandedRowRender && isExpanded && (
                      <tr>
                        <td
                          colSpan={colCount}
                          className="border-t border-line bg-gray-50 px-3 py-2.5"
                        >
                          {expandedRowRender(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
     
  );
}
