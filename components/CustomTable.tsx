"use client";

/**
 * CustomTable.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A fully-featured, config-driven data table that follows the project's dark
 * design system.
 *
 * Features:
 *  • Column configuration with optional sort, custom render, and cell alignment
 *  • Global search/filter
 *  • Column-level sorting (asc / desc toggle)
 *  • Client-side pagination
 *  • Row selection (checkbox) with bulk-action slot
 *  • Status badge auto-coloring
 *  • Empty state
 *  • Loading skeleton rows
 *  • Optional row action buttons (Edit / Delete / custom)
 *  • Responsive horizontal scroll
 *
 * Usage:
 *   <CustomTable
 *     columns={columns}
 *     data={data}
 *     isLoading={isFetching}
 *     onEdit={(row) => openForm(row)}
 *     onDelete={(row) => deleteRow(row.id)}
 *   />
 */

import {
  Box,
  HStack,
  VStack,
  Text,
  Input,
  Badge,
  Checkbox,
  Spinner,
  Button,
  IconButton,
} from "@chakra-ui/react";
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
  List,
  ChevronRightCircle,
} from "lucide-react";
import { useState, useMemo, useCallback, Fragment } from "react";
import { COLORS, FONT } from "@/utils/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDir = "asc" | "desc" | null;

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
  align?: "left" | "center" | "right";
  /** Fixed pixel / % width */
  width?: string;
  /** Auto-apply status badge coloring if value matches status words */
  isStatus?: boolean;
}

export interface RowAction<T = Record<string, unknown>> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  colorScheme?: "blue" | "red" | "green" | "amber";
}

export interface CustomTableProps<T extends Record<string, unknown>> {
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
  /**
   * When provided, adds a "List" toggle action to each row that expands an
   * inline row directly beneath it (accordion-style — no modal, no page nav)
   * rendering whatever this returns. Expansion state is managed internally.
   */
  expandedRowRender?: (row: T) => React.ReactNode;
  showSearch?:boolean
}

// ─── Status badge coloring ────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:    { bg: "#dcfce7", color: "#16a34a" },
  inactive:  { bg: "#fee2e2", color: "#ef4444" },
  pending:   { bg: "#fef9c3", color: "#b45309" },
  approved:  { bg: "#dcfce7", color: "#16a34a" },
  rejected:  { bg: "#fee2e2", color: "#ef4444" },
  cancelled: { bg: "#fee2e2", color: "#ef4444" },
  draft:     { bg: "#f1f5f9", color: "#64748b" },
  paid:      { bg: "#dcfce7", color: "#16a34a" },
  unpaid:    { bg: "#fee2e2", color: "#ef4444" },
  processing:{ bg: "#fef9c3", color: "#b45309" },
  y:         { bg: "#dcfce7", color: "#16a34a" },
  n:         { bg: "#fee2e2", color: "#ef4444" },
};

function StatusBadge({ value }: { value: string }) {
  const key = String(value).toLowerCase();
  const style = STATUS_COLORS[key] ?? { bg: "#f1f5f9", color: "#64748b" };
  return (
    <Badge
      px="9px"
      py="3px"
      borderRadius="20px"
      bg={style.bg}
      color={style.color}
      fontSize="11px"
      fontWeight="600"
      letterSpacing="0.02em"
    >
      {String(value)}
    </Badge>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc")  return <ChevronUp size={13}  color="#3b82f6" />;
  if (dir === "desc") return <ChevronDown size={13} color="#3b82f6" />;
  return <ChevronsUpDown size={13} color="#bfdbfe" />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <Box as="tr" borderTop="1px solid #f3f4f6">
      {Array.from({ length: cols }).map((_, i) => (
        <Box as="td" key={i} px="16px" py="11px">
          <Box h="12px" borderRadius="6px" bg="#e5e7eb"
            w={i === 0 ? "60%" : i % 2 === 0 ? "80%" : "50%"}
            style={{ animation: "pulse 1.5s ease-in-out infinite" }} 
            />
        </Box>
      ))}
    </Box>
  );
}

// ─── Get nested value ─────────────────────────────────────────────────────────

function getVal(row: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, k) => {
    if (acc != null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, row);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  rowKey = "id" as keyof T,
  selectable = false,
  onSelectionChange,
  onEdit,
  onDelete,
  extraActions = [],
  bulkActionSlot,
  searchPlaceholder = "Search...",
  emptyMessage = "No records found",
  title,
  toolbarRight,
  expandedRowRender,
  showSearch = true,
}: CustomTableProps<T>) {
  // ── State ──
  const [search, setSearch] = useState("");
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
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getVal(a, sortKey);
      const bv = getVal(b, sortKey);
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paged      = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Sort handler ──
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey !== key) {
        setSortKey(key);
        setSortDir("asc");
      } else if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir(null);
      }
      setPage(1);
    },
    [sortKey, sortDir]
  );

  // ── Selection ──
  const selectedRows = useMemo(
    () => data.filter((r) => selected.has(r[rowKey])),
    [data, selected, rowKey]
  );

  const allPageSelected =
    paged.length > 0 && paged.every((r) => selected.has(r[rowKey]));

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
  const hasActions = !!onEdit || !!onDelete || extraActions.length > 0 || !!expandedRowRender;
  const colCount   = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

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

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .ct-table { width: 100%; border-collapse: collapse; }
        .ct-th {
          font-size: 10px; font-weight: 700; letter-spacing: 0.09em;
          text-transform: uppercase; color: ${COLORS.textSecondary};
          padding: 10px 16px; text-align: left; white-space: nowrap;
          border-bottom: 1px solid #e5e7eb; background: #f9fafb;
          position: sticky; top: 0; z-index: 1;
        }
        .ct-th.sortable { cursor: pointer; user-select: none; }
        .ct-th.sortable:hover { color: ${COLORS.textPrimary}; }
        .ct-th.active { color: ${COLORS.textPrimary}; }
        .ct-td {
          font-size: 13px; color: ${COLORS.textSecondary};
          padding: 10px 16px; border-top: 1px solid #f3f4f6;
          vertical-align: middle; white-space: nowrap;
        }
        .ct-td.primary { color: ${COLORS.textPrimary}; font-weight: 600; }
        .ct-tr:hover .ct-td { background: #f9fafb; }
        .ct-actions-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 7px; border: none;
          cursor: pointer; transition: background 0.15s, color 0.15s;
          background: transparent; color: ${COLORS.textMuted};
        }
        .ct-actions-btn:hover { background: #f3f4f6; color: ${COLORS.textPrimary}; }
        .ct-actions-btn.delete:hover { background: #fee2e2; color: #ef4444; }
        .ct-actions-btn.edit:hover   { background: #f3f4f6; color: ${COLORS.textPrimary}; }
        .ct-page-btn {
          min-width: 30px; height: 30px; border-radius: 7px;
          border: 1px solid transparent; background: transparent;
          color: ${COLORS.textSecondary}; font-size: 12px; font-family: inherit;
          cursor: pointer; display: inline-flex; align-items: center;
          justify-content: center; transition: background 0.15s, color 0.15s; padding: 0 6px;
        }
        .ct-page-btn:hover:not(:disabled) { background: #f3f4f6; color: ${COLORS.textPrimary}; }
        .ct-page-btn.active { background: ${COLORS.primary}; color: #fff; border-color: ${COLORS.primary}; font-weight: 600; }
        .ct-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .ct-search {
          background: #ffffff; border: 1px solid #d1d5db; border-radius: 8px;
          color: ${COLORS.textPrimary}; font-size: 13px; padding: 0 12px 0 34px;
          height: 34px; outline: none; width: 220px;
          transition: border-color 0.15s; font-family: inherit;
        }
        .ct-search::placeholder { color: ${COLORS.textMuted}; }
        .ct-search:focus { border-color: ${COLORS.textSecondary}; }
        .ct-size-select {
          background: #ffffff; border: 1px solid #d1d5db; border-radius: 7px;
          color: ${COLORS.textSecondary}; font-size: 12px; padding: 4px 8px;
          outline: none; cursor: pointer; font-family: inherit;
        }
        .ct-size-select option { background: #ffffff; }
      `}</style>

      <Box bg="#ffffff" border="1px solid #e5e7eb" borderRadius="12px"
        fontFamily={FONT.family}
        boxShadow="0 1px 4px rgba(0,0,0,0.06)"
        display="flex" flexDirection="column"
        minH="480px"
      >
        {/* ── Toolbar ── */}
        <HStack
          px="16px"
          py="12px"
          borderBottom="1px solid #e5e7eb"
          justify="space-between"
          flexWrap="wrap"
          gap="8px"
        >
          <HStack gap="8px">
            {title && (
              <Text fontSize="13.5px" fontWeight="700" color={COLORS.textPrimary} mr="4px">
                {title}
              </Text>
            )}
            {/* Search */}
            {showSearch && 
            
              <Box position="relative">
                <Box
                  position="absolute"
                  left="10px"
                  top="50%"
                  transform="translateY(-50%)"
                  color={COLORS.textMuted}
                  pointerEvents="none"
                >
                  <Search size={13} />
                </Box>
                <input
                  type="text"
                  className="ct-search"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </Box>
              }
         
          </HStack>

          <HStack gap="8px">
            {selected.size > 0 && bulkActionSlot && (
              <Box>{bulkActionSlot(selectedRows, clearSelection)}</Box>
            )}
            {toolbarRight}
          </HStack>
        </HStack>

        {/* ── Bulk selection banner ── */}
        {selected.size > 0 && !bulkActionSlot && (
          <HStack px="16px" py="8px" bg="#eff6ff" borderBottom="1px solid #dbeafe" gap="8px">
            <Text fontSize="12px" color="#1d4ed8" fontWeight="500">
              {selected.size} row{selected.size > 1 ? "s" : ""} selected
            </Text>
            <button type="button"
              style={{ fontSize: 11, color: "#64748b", cursor: "pointer", background: "transparent", border: "none" }}
              onClick={clearSelection}>Clear</button>
          </HStack>
        )}

        {/* ── Table ── */}
        <Box overflowX="auto" flex="1">
          <Box as="table" className="ct-table" style={{ height: "100%" }}>
            <Box as="thead">
              <Box as="tr">
                {selectable && (
                  <Box as="th" className="ct-th" w="40px" textAlign="center">
                    <Checkbox.Root
                      checked={allPageSelected && paged.length > 0}
                      onCheckedChange={toggleAll}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control w="15px" h="15px" borderRadius="4px" border="1px solid"
                        borderColor={allPageSelected ? "#3b82f6" : "#bfdbfe"}
                        bg={allPageSelected ? "#dbeafe" : "transparent"}>
                        <Checkbox.Indicator color="#3b82f6" />
                      </Checkbox.Control>
                    </Checkbox.Root>
                  </Box>
                )}

                {hasActions && (
                  <Box as="th" className="ct-th" style={{ textAlign: "left", width: "70px" }}>
                    Actions
                  </Box>
                )}

                {columns.map((col) => {
                  const isSortActive = sortKey === col.key;
                  return (
                    <Box
                      as="th"
                      key={col.key as string}
                      className={`ct-th${col.sortable ? " sortable" : ""}${
                        isSortActive ? " active" : ""
                      }`}
                      style={{
                        textAlign: col.align ?? "left",
                        width: col.width,
                      }}
                      onClick={col.sortable ? () => handleSort(col.key as string) : undefined}
                    >
                      <HStack
                        gap="4px"
                        justify={
                          col.align === "center"
                            ? "center"
                            : col.align === "right"
                            ? "flex-end"
                            : "flex-start"
                        }
                      >
                        {col.header}
                        {col.sortable && (
                          <SortIcon dir={isSortActive ? sortDir : null} />
                        )}
                      </HStack>
                    </Box>
                  );
                })}

              </Box>
            </Box>

            <Box as="tbody">
              {isLoading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <SkeletonRow key={i} cols={colCount} />
                ))
              ) : paged.length === 0 ? (
                <Box as="tr">
                  <td colSpan={colCount} style={{ padding: "48px 0", textAlign: "center" }}>
                    <VStack gap="8px" color={COLORS.textMuted}>
                      <Inbox size={32} strokeWidth={1.2} />
                      <Text fontSize="13px">{emptyMessage}</Text>
                    </VStack>
                  </td>
                </Box>
              ) : (
                paged.map((row, rowIdx) => {
                  const isSelected = selected.has(row[rowKey]);
                  const isExpanded = expandedRowRender ? expandedKeys.has(row[rowKey]) : false;
                  return (
                    <Fragment key={String(row[rowKey] ?? rowIdx)}>
                      <Box
                        as="tr"
                        className="ct-tr"
                        bg={isSelected ? "#eff6ff" : "transparent"}
                      >
                        {selectable && (
                          <Box as="td" className="ct-td" textAlign="center">
                            <Checkbox.Root
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(row)}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control w="15px" h="15px" borderRadius="4px" border="1px solid"
                                borderColor={isSelected ? "#3b82f6" : "#bfdbfe"}
                                bg={isSelected ? "#dbeafe" : "transparent"}>
                                <Checkbox.Indicator color="#3b82f6" />
                              </Checkbox.Control>
                            </Checkbox.Root>
                          </Box>
                        )}

                        {hasActions && (
                          <Box as="td" className="ct-td" style={{ textAlign: "left" }}>
                            <HStack gap="4px" justify="flex-start">
                              {expandedRowRender && (
                                <button
                                  type="button"
                                  className="ct-actions-btn"
                                  title={isExpanded ? "Hide details" : "Show details"}
                                  onClick={() => toggleExpanded(row)}
                                  style={isExpanded ? { background: "#f3f4f6", color: COLORS.textPrimary } : undefined}
                                >
                                  <ChevronRightCircle size={20} />
                                </button>
                              )}
                              {extraActions.map((act, ai) => (
                                <button type="button" key={ai} className="ct-actions-btn" title={act.label} onClick={() => act.onClick(row)}>
                                  {act.icon}
                                </button>
                              ))}
                              {onEdit && (
                                <button type="button" className="ct-actions-btn edit" title="Edit" onClick={() => onEdit(row)}>
                                  <Pencil size={13} />
                                </button>
                              )}
                              {onDelete && (
                                <button type="button" className="ct-actions-btn delete" title="Delete" onClick={() => onDelete(row)}>
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </HStack>
                          </Box>
                        )}

                        {columns.map((col, colIdx) => {
                          const rawVal = getVal(row, col.key as string);
                          return (
                            <Box
                              as="td"
                              key={col.key as string}
                              className={`ct-td${colIdx === 0 ? " primary" : ""}`}
                              style={{ textAlign: col.align ?? "left" }}
                            >
                              {col.render ? (
                                col.render(row, rowIdx)
                              ) : col.isStatus ? (
                                <StatusBadge value={String(rawVal ?? "")} />
                              ) : (
                                <span>{String(rawVal ?? "—")}</span>
                              )}
                            </Box>
                          );
                        })}
                      </Box>

                      {expandedRowRender && isExpanded && (
                        <Box as="tr" className="ct-expanded-row">
                          <td colSpan={colCount} style={{ padding: 0, borderTop: "1px solid #f3f4f6" }}>
                            <Box bg="#f9fafb" px="16px" py="14px">
                              {expandedRowRender(row)}
                            </Box>
                          </td>
                        </Box>
                      )}
                    </Fragment>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>

        {/* ── Footer / Pagination ── */}
        <HStack
          px="16px"
          py="10px"
          borderTop="1px solid #e5e7eb"
          justify="space-between"
          flexWrap="wrap"
          gap="8px"
        >
          {/* Row count + page size */}
          <HStack gap="10px">
            <Text fontSize="12px" color={COLORS.textSecondary}>
              {sorted.length === 0
                ? "0 records"
                : `${(safePage - 1) * pageSize + 1}–${Math.min(
                    safePage * pageSize,
                    sorted.length
                  )} of ${sorted.length}`}
            </Text>
            <select
              className="ct-size-select"
              value={pageSize}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
          </HStack>

          {/* Page buttons */}
          <HStack gap="3px">
            <button
              className="ct-page-btn"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              title="First page"
            >
              <ChevronsLeft size={13} />
            </button>
            <button
              className="ct-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              title="Previous"
            >
              <ChevronLeft size={13} />
            </button>

            {pageWindow[0] > 1 && (
              <>
                <button className="ct-page-btn" onClick={() => setPage(1)}>1</button>
                {pageWindow[0] > 2 && (
                  <span style={{ fontSize: 12, color: COLORS.textMuted, padding: "0 2px" }}>…</span>
                )}
              </>
            )}

            {pageWindow.map((p) => (
              <button
                key={p}
                className={`ct-page-btn${p === safePage ? " active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}

            {pageWindow[pageWindow.length - 1] < totalPages && (
              <>
                {pageWindow[pageWindow.length - 1] < totalPages - 1 && (
                  <span style={{ fontSize: 12, color: COLORS.textMuted, padding: "0 2px" }}>…</span>
                )}
                <button className="ct-page-btn" onClick={() => setPage(totalPages)}>
                  {totalPages}
                </button>
              </>
            )}

            <button
              className="ct-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              title="Next"
            >
              <ChevronRight size={13} />
            </button>
            <button
              className="ct-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              title="Last page"
            >
              <ChevronsRight size={13} />
            </button>
          </HStack>
        </HStack>
      </Box>
    </>
  );
}