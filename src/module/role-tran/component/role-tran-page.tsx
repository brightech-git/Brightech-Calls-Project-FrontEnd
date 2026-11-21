'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { toastCreated, toastError, toastUpdated } from '@/src/components/toast/toast';
import {
  useRoleTransactions,
  useInsertRoleTransaction,
  useDeleteRoleTransaction,
  useToggleRoleTransactionActive,
  useMenu,
} from '@/src/module/role-tran/hook/use-role-tran';
import type {
  MenuModule,
  RoleTran,
  RoleTranInput,
} from '@/src/module/role-tran/type/role-tran.types';
import { useRole } from '@/src/module/role-master/hook/use-role-master';
import { labelFor } from '@/src/config/menu/menuLabels';
import { cn } from '@/lib/utils';
import {
  buttonClass,
  buttonVariants,
  cardClass,
  controlClass,
  iconButtonClass,
  labelClass,
} from '@/lib/styles';

// ─── Types & helpers ────────────────────────────────────────────────────────

type TabKey = 'assign' | 'roles';
type CheckState = 'none' | 'some' | 'all';

interface ContentMeta {
  moduleID: number;
  moduleNAME: string;
  subModuleID: number;
  subModuleNAME: string;
  contentNAME: string;
}

const modKey = (id: number) => `m${id}`;
const subKey = (id: number) => `s${id}`;

function getCheckState(ids: number[], selected: Set<number>): CheckState {
  if (!ids.length) return 'none';
  const n = ids.filter((id) => selected.has(id)).length;
  return n === 0 ? 'none' : n === ids.length ? 'all' : 'some';
}

function moduleContentIds(mod: MenuModule): number[] {
  return [
    ...(mod.moduleContent ?? []).map((c) => c.id),
    ...(mod.subModule ?? []).flatMap((s) => (s.moduleContent ?? []).map((c) => c.id)),
  ];
}

// ECOM_ROLETRAN persists id + name columns directly (no server-side join), so
// the insert payload must carry every field the entity has, minus the
// auto-generated SNO.
function toRoleTranInputs(txs: RoleTran[]): RoleTranInput[] {
  return txs.map((tx) => ({
    ROLEID: tx.ROLEID,
    ROLENAME: tx.ROLENAME,
    MODULEID: tx.MODULEID,
    MODULENAME: tx.MODULENAME,
    SUBMODULEID: tx.SUBMODULEID,
    SUBMODULENAME: tx.SUBMODULENAME,
    CONTENTID: tx.CONTENTID,
    CONTENTNAME: tx.CONTENTNAME,
    ACTIVE: tx.ACTIVE,
  }));
}

function compareTxs(a: RoleTran, b: RoleTran): number {
  return (
    a.MODULENAME.localeCompare(b.MODULENAME) ||
    (a.SUBMODULENAME || '').localeCompare(b.SUBMODULENAME || '') ||
    a.CONTENTNAME.localeCompare(b.CONTENTNAME)
  );
}

const sortTxs = (txs: RoleTran[]) => [...txs].sort(compareTxs);

// Rowspan per row: null means the cell is covered by the span above.
function computeSpans<T>(rows: T[], key: (r: T) => string): (number | null)[] {
  return rows.map((row, i) => {
    if (i > 0 && key(rows[i - 1]) === key(row)) return null;
    let span = 1;
    for (let j = i + 1; j < rows.length && key(rows[j]) === key(row); j++) span++;
    return span;
  });
}

// ─── Small building blocks ──────────────────────────────────────────────────

function Panel({
  title,
  subtitle,
  action,
  footer,
  children,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(cardClass, 'flex min-w-0 flex-col overflow-hidden', className)}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
      {footer && <footer className="border-t border-line px-3 py-2">{footer}</footer>}
    </section>
  );
}

function Count({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        active ? 'bg-brand-soft text-brand' : 'bg-gray-100 text-ink',
      )}
    >
      {children}
    </span>
  );
}

function StatusPill({ active }: { active?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
      )}
    >
      <span className={cn('size-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-rose-500')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
      <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-gray-100 text-muted">
        {icon}
      </span>
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      {text && <p className="max-w-64 text-xs text-muted">{text}</p>}
    </div>
  );
}

function TriCheckbox({
  state,
  onChange,
  label,
}: {
  state: CheckState;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      ref={(el) => {
        if (el) el.indeterminate = state === 'some';
      }}
      checked={state === 'all'}
      onChange={onChange}
      className="size-3.5 shrink-0 cursor-pointer accent-brand"
    />
  );
}

function Chevron({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      onClick={onClick}
      className="flex size-5 shrink-0 items-center justify-center rounded text-muted hover:bg-gray-100 hover:text-ink"
    >
      <ChevronRight size={13} className={cn('transition-transform', open && 'rotate-90')} />
    </button>
  );
}

const thClass =
  'border-b border-line bg-gray-50 px-3 py-2 text-left text-[11px] font-semibold tracking-wide whitespace-nowrap text-ink uppercase';
const tdClass = 'border-t border-line px-3 py-row align-middle text-[13px] text-ink';

// ─── Permission tree ────────────────────────────────────────────────────────

const PermissionTree = memo(function PermissionTree({
  menu,
  selected,
  staged,
  collapsed,
  query,
  onToggleContent,
  onToggleGroup,
  onToggleOpen,
}: {
  menu: MenuModule[];
  selected: Set<number>;
  staged: Set<number>;
  collapsed: Set<string>;
  query: string;
  onToggleContent: (id: number) => void;
  onToggleGroup: (ids: number[]) => void;
  onToggleOpen: (key: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const matches = (name: string) => !q || labelFor(name).toLowerCase().includes(q);

  const renderContent = (id: number, name: string) => (
    <label
      key={id}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[13px] select-none hover:bg-gray-50',
        selected.has(id) && 'bg-brand-soft/60 text-brand hover:bg-brand-soft',
      )}
    >
      <input
        type="checkbox"
        checked={selected.has(id)}
        onChange={() => onToggleContent(id)}
        className="size-3.5 shrink-0 cursor-pointer accent-brand"
      />
      <FileText size={12} className="shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate">{labelFor(name)}</span>
      {staged.has(id) && (
        <span className="shrink-0 rounded bg-gray-100 px-1.5 text-[10px] font-semibold text-muted">
          In list
        </span>
      )}
    </label>
  );

  const visible = menu
    .map((mod) => {
      const modHit = matches(mod.name);
      const contents = (mod.moduleContent ?? []).filter((c) => modHit || matches(c.name));
      const subs = (mod.subModule ?? [])
        .map((s) => {
          const subHit = modHit || matches(s.name);
          return {
            ...s,
            moduleContent: (s.moduleContent ?? []).filter((c) => subHit || matches(c.name)),
          };
        })
        .filter((s) => s.moduleContent.length > 0);
      return { mod, contents, subs };
    })
    .filter(({ contents, subs }) => contents.length > 0 || subs.length > 0);

  if (!visible.length) {
    return (
      <p className="px-2 py-6 text-center text-xs text-muted">
        {q ? `No pages match “${query}”` : 'No pages have been added to the navigation yet'}
      </p>
    );
  }

  return (
    <ul className="grid gap-1">
      {visible.map(({ mod, contents, subs }) => {
        const ids = moduleContentIds(mod);
        const state = getCheckState(ids, selected);
        const picked = ids.filter((id) => selected.has(id)).length;
        const open = !!q || !collapsed.has(modKey(mod.id));
        return (
          <li
            key={mod.id}
            className={cn('rounded-md border border-line', state !== 'none' && 'border-brand/40')}
          >
            <div
              className={cn(
                'flex items-center gap-1.5 px-1.5 py-1',
                state !== 'none' ? 'bg-brand-soft/50' : 'bg-gray-50',
                open && 'border-b border-line',
              )}
            >
              <Chevron
                open={open}
                onClick={() => onToggleOpen(modKey(mod.id))}
                label={`Toggle ${labelFor(mod.name)}`}
              />
              <TriCheckbox
                state={state}
                onChange={() => onToggleGroup(ids)}
                label={`Select all in ${labelFor(mod.name)}`}
              />
              <button
                type="button"
                onClick={() => onToggleOpen(modKey(mod.id))}
                className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold text-ink"
              >
                {labelFor(mod.name)}
              </button>
              <Count active={picked > 0}>
                {picked}/{ids.length}
              </Count>
            </div>
            {open && (
              <div className="grid gap-0.5 p-1">
                {contents.map((c) => renderContent(c.id, c.name))}
                {subs.map((sub) => {
                  const subIds = sub.moduleContent.map((c) => c.id);
                  const subState = getCheckState(subIds, selected);
                  const subOpen = !!q || !collapsed.has(subKey(sub.id));
                  return (
                    <div key={sub.id}>
                      <div className="flex items-center gap-1.5 px-1 py-0.5">
                        <Chevron
                          open={subOpen}
                          onClick={() => onToggleOpen(subKey(sub.id))}
                          label={`Toggle ${sub.name}`}
                        />
                        <TriCheckbox
                          state={subState}
                          onChange={() => onToggleGroup(subIds)}
                          label={`Select all in ${sub.name}`}
                        />
                        <Layers size={12} className="shrink-0 text-muted" />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                          {labelFor(sub.name)}
                        </span>
                      </div>
                      {subOpen && (
                        <div className="ml-3.5 grid gap-0.5 border-l border-line pl-2">
                          {sub.moduleContent.map((c) => renderContent(c.id, c.name))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
});

// ─── Saved permissions for one role ─────────────────────────────────────────

const RolePermissionTable = memo(function RolePermissionTable({
  txs,
  onToggle,
  onDelete,
  busy,
}: {
  txs: RoleTran[];
  onToggle: (sno: number) => void;
  onDelete: (sno: number) => void;
  busy: boolean;
}) {
  const rows = useMemo(() => sortTxs(txs), [txs]);
  const moduleSpans = useMemo(() => computeSpans(rows, (r) => r.MODULENAME), [rows]);
  const subSpans = useMemo(
    () => computeSpans(rows, (r) => `${r.MODULENAME}__${r.SUBMODULENAME || ''}`),
    [rows],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={thClass}>Module</th>
            <th className={thClass}>Sub module</th>
            <th className={thClass}>Page</th>
            <th className={cn(thClass, 'w-24')}>Status</th>
            <th className={cn(thClass, 'w-36 text-right')}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.SNO ?? i} className="hover:bg-gray-50/60">
              {moduleSpans[i] !== null && (
                <td
                  rowSpan={moduleSpans[i]!}
                  className={cn(tdClass, 'border-r bg-white align-top font-semibold')}
                >
                  {labelFor(row.MODULENAME)}
                </td>
              )}
              {subSpans[i] !== null && (
                <td
                  rowSpan={subSpans[i]!}
                  className={cn(tdClass, 'border-r bg-white align-top text-muted')}
                >
                  {row.SUBMODULENAME ? labelFor(row.SUBMODULENAME) : '—'}
                </td>
              )}
              <td className={tdClass}>{labelFor(row.CONTENTNAME)}</td>
              <td className={tdClass}>
                <StatusPill active={row.ACTIVE} />
              </td>
              <td className={tdClass}>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    disabled={busy || !row.SNO}
                    onClick={() => row.SNO && onToggle(row.SNO)}
                    className={cn(buttonClass, 'h-7 px-2 text-xs')}
                  >
                    {row.ACTIVE ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete permission"
                    title="Delete"
                    disabled={busy || !row.SNO}
                    onClick={() => row.SNO && onDelete(row.SNO)}
                    className={cn(
                      iconButtonClass,
                      'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600',
                    )}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

function RoleCard({
  roleNAME,
  txs,
  open,
  onOpenChange,
  onEdit,
  onToggle,
  onDelete,
  busy,
}: {
  roleNAME: string;
  txs: RoleTran[];
  open: boolean;
  onOpenChange: () => void;
  onEdit: (roleNAME: string, txs: RoleTran[]) => void;
  onToggle: (sno: number) => void;
  onDelete: (sno: number) => void;
  busy: boolean;
}) {
  const activeCount = txs.filter((t) => t.ACTIVE).length;
  const moduleCount = new Set(txs.map((t) => t.MODULENAME)).size;
  return (
    <section className={cn(cardClass, 'overflow-hidden')}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={onOpenChange}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronRight
            size={14}
            className={cn('shrink-0 text-muted transition-transform', open && 'rotate-90')}
          />
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
            <ShieldCheck size={14} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-ink">{roleNAME}</span>
            <span className="block text-[11px] text-muted">
              {txs.length} page{txs.length !== 1 ? 's' : ''} across {moduleCount} module
              {moduleCount !== 1 ? 's' : ''}
            </span>
          </span>
        </button>
        <span
          className={cn(
            'hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-flex',
            activeCount === txs.length
              ? 'bg-emerald-50 text-emerald-700'
              : activeCount === 0
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-700',
          )}
        >
          {activeCount}/{txs.length} active
        </span>
        <button
          type="button"
          onClick={() => onEdit(roleNAME, txs)}
          className={cn(buttonClass, 'h-7 px-2.5 text-xs')}
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      {open && (
        <div className="border-t border-line">
          <RolePermissionTable txs={txs} onToggle={onToggle} onDelete={onDelete} busy={busy} />
        </div>
      )}
    </section>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function RoleTranCreationPage() {
  const [tab, setTab] = useState<TabKey>('assign');
  const [selectedRoleID, setSelectedRoleID] = useState<number | undefined>(undefined);
  const [selectedRoleNAME, setSelectedRoleNAME] = useState('');
  const [active, setActive] = useState(true);
  const [selectedContentIDs, setSelectedContentIDs] = useState<Set<number>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [treeQuery, setTreeQuery] = useState('');
  const [rows, setRows] = useState<RoleTran[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<{
    roleNAME: string;
    originalRows: RoleTran[];
  } | null>(null);
  const [roleQuery, setRoleQuery] = useState('');
  const [openRoles, setOpenRoles] = useState<Set<string>>(new Set());

  const { data: menuData } = useMenu();
  const menu = useMemo(() => (menuData ?? []) as MenuModule[], [menuData]);
  const {
    data: roleTransactions,
    isLoading: isLoadingTransactions,
    refetch,
  } = useRoleTransactions();
  const { mutate: insertRoles, isPending: isInserting } = useInsertRoleTransaction();
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteRoleTransaction();
  const { mutate: toggleTransaction, isPending: isToggling } = useToggleRoleTransactionActive();
  const { roles, loading: loadingRoles } = useRole();

  // ── Lookups ────────────────────────────────────────────────────────────────
  const contentMeta = useMemo(() => {
    const map = new Map<number, ContentMeta>();
    menu.forEach((mod) => {
      mod.moduleContent?.forEach((c) =>
        map.set(c.id, {
          moduleID: mod.id,
          moduleNAME: mod.name,
          subModuleID: 0,
          subModuleNAME: '',
          contentNAME: c.name,
        }),
      );
      mod.subModule?.forEach((sub) =>
        sub.moduleContent?.forEach((c) =>
          map.set(c.id, {
            moduleID: mod.id,
            moduleNAME: mod.name,
            subModuleID: sub.id,
            subModuleNAME: sub.name,
            contentNAME: c.name,
          }),
        ),
      );
    });
    return map;
  }, [menu]);

  const allContentIDs = useMemo(() => menu.flatMap(moduleContentIds), [menu]);
  const allGroupKeys = useMemo(
    () => menu.flatMap((m) => [modKey(m.id), ...(m.subModule ?? []).map((s) => subKey(s.id))]),
    [menu],
  );

  // Open only the modules/sub modules that hold the given pages.
  const focusOn = useCallback(
    (contentIDs: Set<number>) => {
      const open = new Set<string>();
      contentIDs.forEach((id) => {
        const m = contentMeta.get(id);
        if (!m) return;
        open.add(modKey(m.moduleID));
        if (m.subModuleID) open.add(subKey(m.subModuleID));
      });
      setCollapsed(new Set(allGroupKeys.filter((k) => !open.has(k))));
    },
    [contentMeta, allGroupKeys],
  );

  // ── Tree toggles ───────────────────────────────────────────────────────────
  const handleToggleContent = useCallback((id: number) => {
    setSelectedContentIDs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleGroup = useCallback((ids: number[]) => {
    setSelectedContentIDs((prev) => {
      const next = new Set(prev);
      if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const handleToggleOpen = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isFormValid = selectedRoleID !== undefined && selectedContentIDs.size > 0;

  // ── Clear ──────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setSelectedRoleID(undefined);
    setSelectedRoleNAME('');
    setSelectedContentIDs(new Set());
    setCollapsed(new Set());
    setTreeQuery('');
    setRows([]);
    setEditingIndex(null);
    setEditingRole(null);
    setActive(true);
  }, []);

  // ── Stage / edit rows ──────────────────────────────────────────────────────
  const handleAddRows = useCallback(() => {
    if (!isFormValid) {
      toastError('Add permissions', 'Select a role and at least one page');
      return;
    }
    const newRows: RoleTran[] = [];
    selectedContentIDs.forEach((contentID) => {
      const meta = contentMeta.get(contentID);
      if (!meta) return;
      newRows.push({
        ROLEID: selectedRoleID!,
        ROLENAME: selectedRoleNAME,
        MODULEID: meta.moduleID,
        MODULENAME: meta.moduleNAME,
        SUBMODULEID: meta.subModuleID,
        SUBMODULENAME: meta.subModuleNAME,
        CONTENTID: contentID,
        CONTENTNAME: meta.contentNAME,
        ACTIVE: active,
      });
    });
    if (editingIndex !== null) {
      setRows((prev) => {
        const next = [...prev];
        next[editingIndex] = newRows[0];
        return next;
      });
      setEditingIndex(null);
    } else {
      // Re-adding a page already in the list updates its status instead of duplicating it.
      setRows((prev) => {
        const byKey = new Map(prev.map((r) => [`${r.ROLEID}-${r.CONTENTID}`, r]));
        newRows.forEach((r) => byKey.set(`${r.ROLEID}-${r.CONTENTID}`, r));
        return Array.from(byKey.values());
      });
    }
    setSelectedContentIDs(new Set());
  }, [
    isFormValid,
    selectedContentIDs,
    contentMeta,
    selectedRoleID,
    selectedRoleNAME,
    active,
    editingIndex,
  ]);

  const handleEditRow = useCallback(
    (index: number) => {
      const row = rows[index];
      const role = roles.find((r) => r.ROLEID === row.ROLEID);
      if (role) {
        setSelectedRoleID(role.ROLEID);
        setSelectedRoleNAME(role.ROLENAME);
      }
      const ids = new Set([row.CONTENTID]);
      setSelectedContentIDs(ids);
      focusOn(ids);
      setActive(row.ACTIVE ?? true);
      setEditingIndex(index);
      setTab('assign');
    },
    [rows, roles, focusOn],
  );

  const handleDeleteRow = useCallback(
    (index: number) => {
      setRows((prev) => prev.filter((_, i) => i !== index));
      if (editingIndex === index) {
        setEditingIndex(null);
        setSelectedContentIDs(new Set());
      } else if (editingIndex !== null && index < editingIndex) {
        setEditingIndex(editingIndex - 1);
      }
    },
    [editingIndex],
  );

  const handleEditRole = useCallback(
    (roleNAME: string, txs: RoleTran[]) => {
      const first = txs[0];
      setSelectedRoleID(first.ROLEID);
      setSelectedRoleNAME(first.ROLENAME);
      setRows(txs);
      setEditingRole({ roleNAME, originalRows: txs });
      setEditingIndex(null);
      // Rows are already staged, so start with an empty selection for adding more.
      setSelectedContentIDs(new Set());
      focusOn(new Set(txs.map((tx) => tx.CONTENTID)));
      setTreeQuery('');
      setActive(true);
      setTab('assign');
    },
    [focusOn],
  );

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSubmitSuccess = useCallback(() => {
    if (editingRole) toastUpdated('Role permissions');
    else toastCreated('Role permissions');
    handleClear();
    refetch();
  }, [editingRole, handleClear, refetch]);

  const handleSubmit = useCallback(() => {
    if (!rows.length) {
      toastError('Save permissions', 'Add at least one page to the list');
      return;
    }
    const payload = toRoleTranInputs(rows);
    const snos = editingRole
      ? editingRole.originalRows.filter((tx) => tx.SNO).map((tx) => tx.SNO!)
      : [];
    if (!snos.length) {
      insertRoles(payload, { onSuccess: handleSubmitSuccess });
      return;
    }
    // Editing replaces the role's saved permissions: delete the old rows, then insert.
    let done = 0;
    let errored = false;
    snos.forEach((sno) =>
      deleteTransaction(sno, {
        onSuccess: () => {
          done++;
          if (done === snos.length && !errored)
            insertRoles(payload, { onSuccess: handleSubmitSuccess });
        },
        onError: () => {
          if (!errored) {
            errored = true;
            toastError('Remove old permissions');
          }
        },
      }),
    );
  }, [rows, editingRole, insertRoles, deleteTransaction, handleSubmitSuccess]);

  const handleDeleteFromDB = useCallback(
    (sno: number) => {
      if (window.confirm('Delete this permission?'))
        deleteTransaction(sno, { onSuccess: () => refetch() });
    },
    [deleteTransaction, refetch],
  );

  const handleToggleFromDB = useCallback(
    (sno: number) => {
      toggleTransaction(sno, { onSuccess: () => refetch() });
    },
    [toggleTransaction, refetch],
  );

  // ── Derived ────────────────────────────────────────────────────────────────
  const groupedByRole = useMemo(() => {
    const g: Record<string, RoleTran[]> = {};
    (roleTransactions ?? []).forEach((tx) => {
      (g[tx.ROLENAME] = g[tx.ROLENAME] || []).push(tx);
    });
    return g;
  }, [roleTransactions]);

  const roleEntries = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    return Object.entries(groupedByRole)
      .filter(([name]) => !q || name.toLowerCase().includes(q))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [groupedByRole, roleQuery]);

  const stagedRows = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => a.row.ROLENAME.localeCompare(b.row.ROLENAME) || compareTxs(a.row, b.row)),
    [rows],
  );

  const stagedForRole = useMemo(
    () => new Set(rows.filter((r) => r.ROLEID === selectedRoleID).map((r) => r.CONTENTID)),
    [rows, selectedRoleID],
  );

  const rootState = getCheckState(allContentIDs, selectedContentIDs);
  const allExpanded = collapsed.size === 0;
  const roleCount = Object.keys(groupedByRole).length;
  const savingBusy = isInserting || (isDeleting && !!editingRole);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Role permissions</h1>
          <p className="text-xs text-muted">
            Choose which pages each role can open. Pages come from Navigation modules.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-ink">
          <span className="rounded-md border border-line px-2.5 py-1">
            <strong>{roleCount}</strong> roles configured
          </span>
          <span className="rounded-md border border-line px-2.5 py-1">
            <strong>{roleTransactions?.length ?? 0}</strong> permissions
          </span>
          <span className="rounded-md border border-line px-2.5 py-1">
            <strong>{allContentIDs.length}</strong> pages
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Role permissions"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {(
          [
            { key: 'assign', label: 'Assign permissions', icon: <ListChecks size={14} /> },
            { key: 'roles', label: 'Saved by role', icon: <Users size={14} /> },
          ] as const
        ).map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.key)}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-[13px] whitespace-nowrap text-muted transition-colors hover:text-ink',
                isActive && 'border-brand font-semibold text-brand hover:text-brand',
              )}
            >
              {t.icon}
              {t.label}
              {t.key === 'assign' && rows.length > 0 && <Count active>{rows.length}</Count>}
            </button>
          );
        })}
      </div>

      {/* ── ASSIGN ───────────────────────────────────────────────────────── */}
      {tab === 'assign' && (
        <>
          {editingRole && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span>
                Editing saved permissions for <strong>{editingRole.roleNAME}</strong>. Saving
                replaces what is stored for this role.
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 font-semibold hover:underline"
              >
                <RotateCcw size={11} /> Cancel edit
              </button>
            </div>
          )}

          <div className="flex items-start gap-3 max-lg:flex-col max-lg:items-stretch">
            {/* Left: role + page picker */}
            <Panel
              title={editingIndex !== null ? 'Edit row' : 'Pick pages'}
              subtitle="Select a role, then tick the pages it can open"
              className="w-96 shrink-0 max-lg:w-full lg:sticky lg:top-0 lg:max-h-[calc(100dvh-8rem)]"
              action={
                editingIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null);
                      setSelectedContentIDs(new Set());
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
                  >
                    <RotateCcw size={11} /> Cancel
                  </button>
                )
              }
              footer={
                <button
                  type="button"
                  onClick={handleAddRows}
                  disabled={!isFormValid}
                  className={cn(buttonClass, buttonVariants.primary, 'w-full')}
                >
                  {editingIndex !== null ? <Check size={14} /> : <Plus size={14} />}
                  {editingIndex !== null
                    ? 'Update row'
                    : selectedContentIDs.size > 0
                      ? `Add ${selectedContentIDs.size} page${selectedContentIDs.size !== 1 ? 's' : ''} to list`
                      : 'Add to list'}
                </button>
              }
            >
              <div className="grid gap-3 border-b border-line p-3">
                <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                  <label className="grid gap-1">
                    <span className={labelClass}>Role</span>
                    <select
                      value={selectedRoleID ?? ''}
                      disabled={loadingRoles || !!editingRole}
                      onChange={(e) => {
                        const r = roles.find((x) => x.ROLEID === Number(e.target.value));
                        setSelectedRoleID(r?.ROLEID);
                        setSelectedRoleNAME(r?.ROLENAME ?? '');
                      }}
                      className={cn(controlClass, 'cursor-pointer')}
                    >
                      <option value="">{loadingRoles ? 'Loading roles…' : 'Select role…'}</option>
                      {roles.map((r) => (
                        <option key={r.ROLEID} value={r.ROLEID}>
                          {r.ROLENAME}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label
                    className={cn(
                      'flex h-control cursor-pointer items-center gap-2 rounded-md border px-2.5 text-[13px] font-semibold select-none',
                      active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-line text-muted',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="size-3.5 cursor-pointer accent-emerald-600"
                    />
                    Active
                  </label>
                </div>

                <div className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted"
                  />
                  <input
                    type="search"
                    value={treeQuery}
                    onChange={(e) => setTreeQuery(e.target.value)}
                    placeholder="Search pages"
                    aria-label="Search pages"
                    className={cn(controlClass, 'pl-8')}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <label className="flex cursor-pointer items-center gap-2 font-semibold text-ink select-none">
                    <TriCheckbox
                      state={rootState}
                      onChange={() => handleToggleGroup(allContentIDs)}
                      label="Select all pages"
                    />
                    Select all
                    <Count active={selectedContentIDs.size > 0}>
                      {selectedContentIDs.size}/{allContentIDs.length}
                    </Count>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCollapsed(allExpanded ? new Set(allGroupKeys) : new Set())}
                    className="text-muted hover:text-ink"
                  >
                    {allExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>
              </div>

              <div className="min-h-40 flex-1 overflow-y-auto p-2 max-lg:max-h-[420px]">
                {!menuData ? (
                  <p className="flex items-center justify-center gap-2 py-8 text-xs text-muted">
                    <Loader2 size={14} className="animate-spin" /> Loading pages…
                  </p>
                ) : (
                  <PermissionTree
                    menu={menu}
                    selected={selectedContentIDs}
                    staged={stagedForRole}
                    collapsed={collapsed}
                    query={treeQuery}
                    onToggleContent={handleToggleContent}
                    onToggleGroup={handleToggleGroup}
                    onToggleOpen={handleToggleOpen}
                  />
                )}
              </div>
            </Panel>

            {/* Right: staged list */}
            <Panel
              className="flex-1"
              title={
                <span className="flex items-center gap-2">
                  {editingRole ? `Permissions for ${editingRole.roleNAME}` : 'Ready to save'}
                  <Count active={rows.length > 0}>{rows.length}</Count>
                </span>
              }
              subtitle="Review the list, then save it to the role"
              action={
                rows.length > 0 &&
                !editingRole && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[11px] text-muted hover:text-ink"
                  >
                    Clear list
                  </button>
                )
              }
              footer={
                rows.length > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">
                      {rows.filter((r) => r.ACTIVE).length} active ·{' '}
                      {rows.filter((r) => !r.ACTIVE).length} inactive
                    </span>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={savingBusy}
                      className={cn(buttonClass, buttonVariants.primary)}
                    >
                      {savingBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      {savingBusy ? 'Saving…' : 'Save permissions'}
                    </button>
                  </div>
                )
              }
            >
              {rows.length === 0 ? (
                <EmptyState
                  icon={<ListChecks size={18} />}
                  title="Nothing to save yet"
                  text="Pick a role and tick pages on the left, then press “Add to list”."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thClass}>Role</th>
                        <th className={thClass}>Module</th>
                        <th className={thClass}>Page</th>
                        <th className={cn(thClass, 'w-24')}>Status</th>
                        <th className={cn(thClass, 'w-20 text-right')}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stagedRows.map(({ row, index }) => (
                        <tr
                          key={`${row.ROLEID}-${row.CONTENTID}`}
                          className={cn(
                            'hover:bg-gray-50/60',
                            editingIndex === index && 'bg-brand-soft/50',
                          )}
                        >
                          <td className={cn(tdClass, 'whitespace-nowrap')}>{row.ROLENAME}</td>
                          <td className={tdClass}>
                            {labelFor(row.MODULENAME)}
                            {row.SUBMODULENAME && (
                              <span className="text-muted"> / {labelFor(row.SUBMODULENAME)}</span>
                            )}
                          </td>
                          <td className={cn(tdClass, 'font-semibold')}>
                            {labelFor(row.CONTENTNAME)}
                          </td>
                          <td className={tdClass}>
                            <StatusPill active={row.ACTIVE} />
                          </td>
                          <td className={tdClass}>
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                aria-label="Edit row"
                                title="Edit"
                                onClick={() => handleEditRow(index)}
                                className={cn(
                                  iconButtonClass,
                                  'hover:border-brand hover:text-brand',
                                )}
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                aria-label="Remove row"
                                title="Remove"
                                onClick={() => handleDeleteRow(index)}
                                className={cn(
                                  iconButtonClass,
                                  'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600',
                                )}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      {/* ── SAVED BY ROLE ───────────────────────────────────────────────── */}
      {tab === 'roles' && (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative w-full max-w-xs">
              <Search
                size={13}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={roleQuery}
                onChange={(e) => setRoleQuery(e.target.value)}
                placeholder="Search roles"
                aria-label="Search roles"
                className={cn(controlClass, 'pl-8')}
              />
            </div>
            {roleEntries.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setOpenRoles(
                    openRoles.size === roleEntries.length
                      ? new Set()
                      : new Set(roleEntries.map(([n]) => n)),
                  )
                }
                className="text-xs text-muted hover:text-ink"
              >
                {openRoles.size === roleEntries.length ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>

          {isLoadingTransactions ? (
            <p className="flex items-center justify-center gap-2 py-10 text-xs text-muted">
              <Loader2 size={14} className="animate-spin" /> Loading permissions…
            </p>
          ) : roleEntries.length === 0 ? (
            <section className={cardClass}>
              <EmptyState
                icon={<ShieldCheck size={18} />}
                title={roleQuery ? 'No roles match your search' : 'No permissions saved yet'}
                text={roleQuery ? undefined : 'Assign pages to a role on the first tab.'}
              />
            </section>
          ) : (
            roleEntries.map(([roleNAME, txs]) => (
              <RoleCard
                key={roleNAME}
                roleNAME={roleNAME}
                txs={txs}
                open={openRoles.has(roleNAME)}
                onOpenChange={() =>
                  setOpenRoles((prev) => {
                    const next = new Set(prev);
                    if (next.has(roleNAME)) next.delete(roleNAME);
                    else next.add(roleNAME);
                    return next;
                  })
                }
                onEdit={handleEditRole}
                onToggle={handleToggleFromDB}
                onDelete={handleDeleteFromDB}
                busy={isToggling || isDeleting}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
