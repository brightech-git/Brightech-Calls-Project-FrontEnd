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
import { ui } from "@/utils/ui";
import { Box, HStack, VStack, Text, Input, Badge, Checkbox, Spinner, Button, IconButton } from "@chakra-ui/react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox, List, ChevronRightCircle } from "lucide-react";
import { useState, useMemo, useCallback, Fragment } from "react";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { usePathname } from "next/navigation";
import { PAGE_CONFIG } from "@/config/pageConfig";

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
  showSearch?: boolean;
}

// ─── Status badge coloring ────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, {
  bg: string;
  color: string;
}> = {
  active: {
    bg: COLORS.successBg,
    color: COLORS.success
  },
  inactive: {
    bg: COLORS.errorBg,
    color: COLORS.error
  },
  pending: {
    bg: COLORS.warningBg,
    color: COLORS.warning
  },
  approved: {
    bg: COLORS.successBg,
    color: COLORS.success
  },
  rejected: {
    bg: COLORS.errorBg,
    color: COLORS.error
  },
  cancelled: {
    bg: COLORS.errorBg,
    color: COLORS.error
  },
  draft: {
    bg: COLORS.gray100,
    color: COLORS.textMuted
  },
  paid: {
    bg: COLORS.successBg,
    color: COLORS.success
  },
  unpaid: {
    bg: COLORS.errorBg,
    color: COLORS.error
  },
  processing: {
    bg: COLORS.warningBg,
    color: COLORS.warning
  },
  y: {
    bg: COLORS.successBg,
    color: COLORS.success
  },
  n: {
    bg: COLORS.errorBg,
    color: COLORS.error
  }
};
function StatusBadge({
  value
}: {
  value: string;
}) {
  const key = String(value).toLowerCase();
  const style = STATUS_COLORS[key] ?? {
    bg: COLORS.gray100,
    color: COLORS.textMuted
  };
  return <Badge bg={style.bg} color={style.color} className={ui("[padding-left:9px]! [padding-right:9px]! [padding-top:3px]! [padding-bottom:3px]! [border-radius:20px]! [font-size:var(--font-xs)]! font-normal! [letter-spacing:0.02em]!")}>
      {String(value)}
    </Badge>;
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({
  dir
}: {
  dir: SortDir;
}) {
  if (dir === "asc") return <ChevronUp size={13} className={ui("[color:var(--primary)]!")} />;
  if (dir === "desc") return <ChevronDown size={13} className={ui("[color:var(--primary)]!")} />;
  return <ChevronsUpDown size={13} className={ui("[color:var(--primary-light)]!")} />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({
  cols
}: {
  cols: number;
}) {
  return <Box as="tr" borderTop={`1px solid ${COLORS.gray100}`}>
      {Array.from({
      length: cols
    }).map((_, i) => <Box as="td" key={i} className={ui("[padding-left:16px]! [padding-right:16px]! [padding-top:11px]! [padding-bottom:11px]!")}>
          <Box w={i === 0 ? "60%" : i % 2 === 0 ? "80%" : "50%"} className={ui("[height:12px]! [border-radius:6px]! [background:var(--border)]! [animation:pulse_1.5s_ease-in-out_infinite]")} />
        </Box>)}
    </Box>;
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
  showSearch = true
}: CustomTableProps<T>) {
  const pathname = usePathname();
  const tableTitle = title || PAGE_CONFIG[pathname]?.title || "Records";
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
    setExpandedKeys(prev => {
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
  const rows = useMemo(() => Array.isArray(data) ? data : [], [data]);
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(row => columns.some(col => {
      const val = getVal(row, col.key as string);
      return String(val ?? "").toLowerCase().includes(q);
    }));
  }, [data, search, columns]);
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getVal(a, sortKey);
      const bv = getVal(b, sortKey);
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
        numeric: true
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Sort handler ──
  const handleSort = useCallback((key: string) => {
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
  }, [sortKey, sortDir]);

  // ── Selection ──
  const selectedRows = useMemo(() => data.filter(r => selected.has(r[rowKey])), [data, selected, rowKey]);
  const allPageSelected = paged.length > 0 && paged.every(r => selected.has(r[rowKey]));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allPageSelected) {
      paged.forEach(r => next.delete(r[rowKey]));
    } else {
      paged.forEach(r => next.add(r[rowKey]));
    }
    setSelected(next);
    onSelectionChange?.(data.filter(r => next.has(r[rowKey])));
  };
  const toggleRow = (row: T) => {
    const next = new Set(selected);
    if (next.has(row[rowKey])) {
      next.delete(row[rowKey]);
    } else {
      next.add(row[rowKey]);
    }
    setSelected(next);
    onSelectionChange?.(data.filter(r => next.has(r[rowKey])));
  };
  const clearSelection = () => {
    setSelected(new Set());
    onSelectionChange?.([]);
  };

  // ── Actions present? ──
  const hasActions = !!onEdit || !!onDelete || extraActions.length > 0 || !!expandedRowRender;
  const colCount = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  // ── Page number window ──
  const pageWindow = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) {
      range.push(i);
    }
    return range;
  }, [safePage, totalPages]);

  // ─────────────────────────────────────────────────────────────────────────────
  return <>
      

      <Box className={ui("data-table-card" + " " + "[background:var(--surface)]! [border-radius:14px]! [font-family:var(--font-poppins),_'Poppins',_sans-serif]! [display:flex]! [flex-direction:column]! [min-height:320px]!")} border={`1px solid ${COLORS.cardBorder}`} boxShadow={`0 1px 4px ${COLORS.cardShadow}`}>
        {/* ── Toolbar ── */}
        <HStack className={ui("table-toolbar" + " " + "[padding-left:16px]! [padding-right:16px]! [padding-top:12px]! [padding-bottom:12px]! [justify-content:space-between]! [flex-wrap:wrap]! [gap:8px]!")} borderBottom={`1px solid ${COLORS.cardBorder}`}>
          <HStack className={ui("table-title-group" + " " + "[gap:8px]!")}>
            {tableTitle && <Text className={ui("[font-size:var(--font-md)]! font-normal! [color:var(--text-main)]! [margin-right:4px]!")}>
                {tableTitle}
              </Text>}
            <span className={ui("table-record-count")}>{isLoading ? "…" : sorted.length.toLocaleString()}</span>
            {/* Search */}
            {showSearch && <Box className={ui("[position:relative]!")}>
                <Box className={ui("[position:absolute]! [left:10px]! [top:50%]! [transform:translateY(-50%)]! [color:var(--text-muted)]! [pointer-events:none]!")}>
                  <Search size={13} />
                </Box>
                <input type="text" aria-label={searchPlaceholder || "Search records"} className={ui("ct-search")} placeholder={searchPlaceholder} value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }} />
              </Box>}
         
          </HStack>

          <HStack className={ui("[gap:8px]!")}>
            {selected.size > 0 && bulkActionSlot && <Box>{bulkActionSlot(selectedRows, clearSelection)}</Box>}
            {toolbarRight}
          </HStack>
        </HStack>

        {/* ── Bulk selection banner ── */}
        {selected.size > 0 && !bulkActionSlot && <HStack borderBottom={`1px solid ${COLORS.infoBg}`} className={ui("[padding-left:16px]! [padding-right:16px]! [padding-top:8px]! [padding-bottom:8px]! [background:#eff6ff]! [gap:8px]!")}>
            <Text className={ui("[font-size:var(--font-xs)]! [color:#1d4ed8]! font-normal!")}>
              {selected.size} row{selected.size > 1 ? "s" : ""} selected
            </Text>
            <button type="button" onClick={clearSelection} className={ui("[font-size:var(--font-xs)] [color:var(--text-muted)] [cursor:pointer] [background:transparent] [border:none]")}>Clear</button>
          </HStack>}

        {/* ── Table ── */}
        <Box className={ui("[overflow-x:auto]! [flex:1]!")}>
          <Box as="table" className={ui("ct-table")} aria-label={title || "Records"}>
            <Box as="thead">
              <Box as="tr">
                {selectable && <Box as="th" className={ui("ct-th" + " " + "[width:40px]! [text-align:center]!")}>
                    <Checkbox.Root checked={allPageSelected && paged.length > 0} onCheckedChange={toggleAll}>
                      <Checkbox.HiddenInput />
                      <Checkbox.Control borderColor={allPageSelected ? COLORS.primary : COLORS.primaryLight} bg={allPageSelected ? COLORS.primaryLight : "transparent"} className={ui("[width:15px]! [height:15px]! [border-radius:4px]! border! border-solid!")}>
                        <Checkbox.Indicator className={ui("[color:var(--primary)]!")} />
                      </Checkbox.Control>
                    </Checkbox.Root>
                  </Box>}

                {hasActions && <Box as="th" className={ui("ct-th" + " " + "[text-align:left] [width:70px]")}>
                    Actions
                  </Box>}

                {columns.map(col => {
                const isSortActive = sortKey === col.key;
                return <Box as="th" key={col.key as string} className={ui(`ct-th${col.sortable ? " sortable" : ""}${isSortActive ? " active" : ""}`)} style={{
                  textAlign: col.align ?? "left",
                  width: col.width
                }} onClick={col.sortable ? () => handleSort(col.key as string) : undefined}>
                      <HStack justify={col.align === "center" ? "center" : col.align === "right" ? "flex-end" : "flex-start"} className={ui("[gap:4px]!")}>
                        {col.header}
                        {col.sortable && <SortIcon dir={isSortActive ? sortDir : null} />}
                      </HStack>
                    </Box>;
              })}

              </Box>
            </Box>

            <Box as="tbody">
              {isLoading ? Array.from({
              length: pageSize > 5 ? 5 : pageSize
            }).map((_, i) => <SkeletonRow key={i} cols={colCount} />) : paged.length === 0 ? <Box as="tr">
                  <td colSpan={colCount} className={ui("[padding:48px_0] [text-align:center]")}>
                    <VStack className={ui("[gap:8px]! [color:var(--text-muted)]!")}>
                      <Inbox size={32} strokeWidth={1.2} />
                      <Text className={ui("[font-size:var(--font-sm)]!")}>{emptyMessage}</Text>
                    </VStack>
                  </td>
                </Box> : paged.map((row, rowIdx) => {
              const isSelected = selected.has(row[rowKey]);
              const isExpanded = expandedRowRender ? expandedKeys.has(row[rowKey]) : false;
              return <Fragment key={String(row[rowKey] ?? rowIdx)}>
                      <Box as="tr" className={ui("ct-tr")} bg={isSelected ? COLORS.infoBg : "transparent"}>
                        {selectable && <Box as="td" className={ui("ct-td" + " " + "[text-align:center]!")}>
                            <Checkbox.Root checked={isSelected} onCheckedChange={() => toggleRow(row)}>
                              <Checkbox.HiddenInput />
                              <Checkbox.Control borderColor={isSelected ? COLORS.primary : COLORS.primaryLight} bg={isSelected ? COLORS.primaryLight : "transparent"} className={ui("[width:15px]! [height:15px]! [border-radius:4px]! border! border-solid!")}>
                                <Checkbox.Indicator className={ui("[color:var(--primary)]!")} />
                              </Checkbox.Control>
                            </Checkbox.Root>
                          </Box>}

                        {hasActions && <Box as="td" className={ui("ct-td" + " " + "[text-align:left]")}>
                            <HStack className={ui("[gap:1px]! [justify-content:flex-start]!")}>
                              {expandedRowRender && <button type="button" className={ui("ct-actions-btn")} title={isExpanded ? "Hide details" : "Show details"} onClick={() => toggleExpanded(row)} style={isExpanded ? {
                        background: COLORS.gray100,
                        color: COLORS.textPrimary
                      } : undefined}>
                                  <ChevronRightCircle size={20} />
                                </button>}
                              {extraActions.map((act, ai) => <button type="button" key={ai} className={ui("ct-actions-btn")} title={act.label} onClick={() => act.onClick(row)}>
                                  {act.icon}
                                </button>)}
                              {onEdit && <button type="button" className={ui("ct-actions-btn edit")} title="Edit" onClick={() => onEdit(row)}>
                                  <Pencil size={13} />
                                </button>}
                              {onDelete && <button type="button" className={ui("ct-actions-btn delete")} title="Delete" onClick={() => onDelete(row)}>
                                  <Trash2 size={13} />
                                </button>}
                            </HStack>
                          </Box>}

                        {columns.map((col, colIdx) => {
                    const rawVal = getVal(row, col.key as string);
                    return <Box as="td" key={col.key as string} className={ui(`ct-td${colIdx === 0 ? " primary" : ""}`)} style={{
                      textAlign: col.align ?? "left"
                    }}>
                              {col.render ? col.render(row, rowIdx) : col.isStatus ? <StatusBadge value={String(rawVal ?? "")} /> : <span>{String(rawVal ?? "—")}</span>}
                            </Box>;
                  })}
                      </Box>

                      {expandedRowRender && isExpanded && <Box as="tr" className={ui("ct-expanded-row")}>
                          <td colSpan={colCount} style={{
                    borderTop: `1px solid ${COLORS.gray100}`
                  }} className={ui("[padding:0]")}>
                            <Box className={ui("[background:#f8fafc]! [padding-left:16px]! [padding-right:16px]! [padding-top:14px]! [padding-bottom:14px]!")}>
                              {expandedRowRender(row)}
                            </Box>
                          </td>
                        </Box>}
                    </Fragment>;
            })}
            </Box>
          </Box>
        </Box>

        {/* ── Footer / Pagination ── */}
        <HStack borderTop={`1px solid ${COLORS.cardBorder}`} className={ui("[padding-left:16px]! [padding-right:16px]! [padding-top:10px]! [padding-bottom:10px]! [justify-content:space-between]! [flex-wrap:wrap]! [gap:8px]!")}>
          {/* Row count + page size */}
          <HStack className={ui("[gap:10px]!")}>
            <Text className={ui("[font-size:var(--font-xs)]! [color:#34445d]!")}>
              {sorted.length === 0 ? "0 records" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)} of ${sorted.length}`}
            </Text>
            <select className={ui("ct-size-select")} aria-label="Rows per page" value={pageSize} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}>
              {pageSizeOptions.map(s => <option key={s} value={s}>
                  {s} / page
                </option>)}
            </select>
          </HStack>

          {/* Page buttons */}
          <HStack className={ui("[gap:3px]!")}>
            <button className={ui("ct-page-btn")} onClick={() => setPage(1)} disabled={safePage === 1} title="First page">
              <ChevronsLeft size={13} />
            </button>
            <button className={ui("ct-page-btn")} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} title="Previous">
              <ChevronLeft size={13} />
            </button>

            {pageWindow[0] > 1 && <>
                <button className={ui("ct-page-btn")} onClick={() => setPage(1)}>1</button>
                {pageWindow[0] > 2 && <span className={ui("[font-size:var(--font-xs)] [color:var(--text-muted)] [padding:0_2px]")}>…</span>}
              </>}

            {pageWindow.map(p => <button key={p} className={ui(`ct-page-btn${p === safePage ? " active" : ""}`)} onClick={() => setPage(p)}>
                {p}
              </button>)}

            {pageWindow[pageWindow.length - 1] < totalPages && <>
                {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className={ui("[font-size:var(--font-xs)] [color:var(--text-muted)] [padding:0_2px]")}>…</span>}
                <button className={ui("ct-page-btn")} onClick={() => setPage(totalPages)}>
                  {totalPages}
                </button>
              </>}

            <button className={ui("ct-page-btn")} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next">
              <ChevronRight size={13} />
            </button>
            <button className={ui("ct-page-btn")} onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last page">
              <ChevronsRight size={13} />
            </button>
          </HStack>
        </HStack>
      </Box>
    </>;
}
