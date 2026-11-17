'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Button,
  Flex,
  Tabs,
  VStack,
  HStack,
  Text,
  Spinner,
  Badge,
  Grid,
  GridItem,
} from '@chakra-ui/react';

import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  ShieldCheck,
  Eye,
  CheckSquare,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { CustomTable } from '@/components/CustomTable';
import { toastError, toastCreated } from '@/components/toast/toast';
import {
  useRoleTransactions,
  useInsertRoleTransaction,
  useDeleteRoleTransaction,
  useToggleRoleTransactionActive,
  useMenu,
} from '@/hooks/ApiHooks/RoleTran/useRoleTran';
import { RoleTran, RoleTranInput } from '@/types/RoleTran/RoleTran';
import { useRole } from '@/hooks/ApiHooks/RoleMaster/useRoleMaster';

// ─── Design tokens ────────────────────────────────────────────────────────────

import { COLORS, RADIUS } from '@/utils/theme';
const T = {
  navy: COLORS.primary,
  navyMID: COLORS.primary,
  navyLight: COLORS.primaryHover,
  accent: COLORS.primary,
  accentLight: COLORS.primaryLight,
  accentMID: COLORS.primaryLight,
  green: COLORS.success,
  greenLight: COLORS.successBg,
  red: COLORS.error,
  redLight: COLORS.errorBg,
  orange: COLORS.warning,
  text: COLORS.textPrimary,
  textMID: COLORS.textSecondary,
  textSub: COLORS.textMuted,
  textMuted: COLORS.textMuted,
  border: COLORS.cardBorder,
  borderMID: COLORS.inputBorder,
  bg: COLORS.gray50,
  bgCard: COLORS.cardBg,
  bgHover: COLORS.primaryLight,
  radius: RADIUS.md,
  radiusMd: RADIUS.md,
  radiusLg: RADIUS.lg,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentNode {
  id: number;
  name: string;
}
interface SubModuleNode {
  id: number;
  name: string;
  moduleContent: ContentNode[];
}
interface ModuleNode {
  id: number;
  name: string;
  moduleContent: ContentNode[];
  subModulel: SubModuleNode[];
}
type CheckState = 'none' | 'some' | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCheckState(IDs: number[], selected: Set<number>): CheckState {
  if (!IDs.length) return 'none';
  const n = IDs.filter((ID) => selected.has(ID)).length;
  return n === 0 ? 'none' : n === IDs.length ? 'all' : 'some';
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

// ─── TriCheckbox ──────────────────────────────────────────────────────────────

const TriCheckbox = memo(
  ({ state, onChange }: { state: CheckState; onChange: () => void }) => (
    <input
      type="checkbox"
      ref={(el) => {
        if (el) el.indeterminate = state === 'some';
      }}
      checked={state === 'all'}
      onChange={onChange}
      style={{
        accentColor: T.accent,
      }}
      className="cursor-pointer w-3.25 h-3.25 shrink-0"
    />
  ),
);
TriCheckbox.displayName = 'TriCheckbox';

// ─── ContentRow ───────────────────────────────────────────────────────────────

const ContentRow = memo(
  ({
    content,
    selected,
    onToggle,
  }: {
    content: ContentNode;
    selected: boolean;
    onToggle: (ID: number) => void;
  }) => (
    <label
      style={{
        background: selected ? T.accentLight : 'transparent',
      }}
      className="flex items-center gap-2 pt-1 pr-2.5 pb-1 pl-10.5 cursor-pointer rounded-md text-xs select-none transition-colors duration-120"
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(content.id)}
        style={{
          accentColor: T.accent,
        }}
        className="cursor-pointer w-3.25 h-3.25 shrink-0"
      />
      <span
        style={{
          color: selected ? '#1D4ED8' : T.textMID,
        }}
        className="transition-colors duration-120 text-sm"
      >
        {content.name}
      </span>
    </label>
  ),
);
ContentRow.displayName = 'ContentRow';

// ─── SubModuleRow ─────────────────────────────────────────────────────────────

const SubModuleRow = memo(
  ({
    sub,
    selected,
    onToggleContent,
    onToggleGroup,
    forceOpen,
  }: {
    sub: SubModuleNode;
    selected: Set<number>;
    onToggleContent: (ID: number) => void;
    onToggleGroup: (IDs: number[]) => void;
    forceOpen?: boolean;
  }) => {
    const [open, setOpen] = useState(forceOpen ?? true);
    useEffect(() => {
      if (forceOpen !== undefined) setOpen(forceOpen);
    }, [forceOpen]);
    const IDs = useMemo(() => sub.moduleContent.map((c) => c.id), [sub.moduleContent]);
    const state = getCheckState(IDs, selected);
    const checkedCount = IDs.filter((ID) => selected.has(ID)).length;
    return (
      <Box>
        <Flex
          _hover={{
            bg: T.bgHover,
          }}
          className="items-center gap-1.5 pr-2 pt-1.25 pb-1.25 cursor-pointer rounded-md pl-5 transition-colors duration-120"
        >
          <Box
            as="span"
            onClick={() => setOpen((o) => !o)}
            style={{
              color: T.textSub,
            }}
            className="flex items-center shrink-0"
          >
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </Box>
          <TriCheckbox
            state={state}
            onChange={() => onToggleGroup(IDs)}
          />
          <Text
            color={state !== 'none' ? T.accent : T.textSub}
            onClick={() => setOpen((o) => !o)}
            className="text-xs font-normal ml-1 cursor-pointer select-none flex-1 transition-colors duration-120"
          >
            📁 {sub.name}
          </Text>
          {state !== 'none' && (
            <Box
              bg={T.accentLight}
              color={T.accent}
              className="pl-1.5 pr-1.5 pt-0.25 pb-0.25 rounded-xl text-[11px] font-normal"
            >
              {checkedCount}/{IDs.length}
            </Box>
          )}
        </Flex>
        {open && (
          <Box>
            {sub.moduleContent.map((c) => (
              <ContentRow
                key={c.id}
                content={c}
                selected={selected.has(c.id)}
                onToggle={onToggleContent}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  },
);
SubModuleRow.displayName = 'SubModuleRow';

// ─── ModuleRow ────────────────────────────────────────────────────────────────

const ModuleRow = memo(
  ({
    mod,
    selected,
    onToggleContent,
    onToggleGroup,
    forceOpen,
    expandedSubIDs,
  }: {
    mod: ModuleNode;
    selected: Set<number>;
    onToggleContent: (ID: number) => void;
    onToggleGroup: (IDs: number[]) => void;
    forceOpen?: boolean;
    expandedSubIDs?: Set<number>;
  }) => {
    console.log(mod, 'mod');
    const [open, setOpen] = useState(forceOpen ?? true);
    useEffect(() => {
      if (forceOpen !== undefined) setOpen(forceOpen);
    }, [forceOpen]);
    const allIDs = useMemo(
      () => [
        ...mod.moduleContent.map((c) => c.id),
        // ...mod.SUBMODULES.flatMap(s => s.CONTENTS.map(c => c.ID)),
      ],
      [mod],
    );
    const state = getCheckState(allIDs, selected);
    const checkedCount = allIDs.filter((ID) => selected.has(ID)).length;
    return (
      <Box
        border={`1px solid ${state !== 'none' ? T.accentMID : T.border}`}
        borderRadius={T.radiusMd}
        boxShadow={state !== 'none' ? '0 0 0 2px rgba(59,130,246,0.08)' : 'none'}
        className="mb-1.5 overflow-hidden transition-colors duration-150"
      >
        <Flex
          bg={state !== 'none' ? T.accentLight : T.bg}
          _hover={{
            bg: state !== 'none' ? '#DBEAFE' : T.bgHover,
          }}
          className="items-center gap-2 pl-3 pr-3 pt-1.75 pb-1.75 cursor-pointer transition-colors duration-120"
        >
          <Box
            as="span"
            onClick={() => setOpen((o) => !o)}
            style={{
              color: T.textSub,
            }}
            className="flex items-center shrink-0"
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </Box>
          <TriCheckbox
            state={state}
            onChange={() => onToggleGroup(allIDs)}
          />
          <Text
            color={state !== 'none' ? '#1E40AF' : T.textMID}
            onClick={() => setOpen((o) => !o)}
            className="text-xs font-normal ml-1 flex-1 cursor-pointer select-none transition-colors duration-120"
          >
            {mod.name}
          </Text>
          {state !== 'none' && (
            <Box
              className="pl-2 pr-2 pt-0.5 pb-0.5 rounded-xl text-[11px] font-normal bg-[#DBEAFE] text-[#1E40AF]"
            >
              {checkedCount}/{allIDs.length}
            </Box>
          )}
        </Flex>
        {open && (
          <Box
            bg={T.bgCard}
            className="pt-1 pb-1"
          >
            {mod.moduleContent.map((c) => (
              <ContentRow
                key={c.id}
                content={c}
                selected={selected.has(c.id)}
                onToggle={onToggleContent}
              />
            ))}
            {/* {mod.SUBMODULES.map(sub => (
            <SubModuleRow
              key={sub.ID} sub={sub} selected={selected}
              onToggleContent={onToggleContent} onToggleGroup={onToggleGroup}
              forceOpen={expandedSubIDs ? expandedSubIDs.has(sub.ID) : true}
            />
           ))} */}
          </Box>
        )}
      </Box>
    );
  },
);
ModuleRow.displayName = 'ModuleRow';

// ─── ModuleTree ───────────────────────────────────────────────────────────────

const ModuleTree = memo(
  ({
    menuData,
    selectedContentIDs,
    onToggleContent,
    onToggleGroup,
    expandedModuleIDs,
    expandedSubIDs,
  }: {
    menuData: ModuleNode[];
    selectedContentIDs: Set<number>;
    onToggleContent: (ID: number) => void;
    onToggleGroup: (IDs: number[]) => void;
    expandedModuleIDs?: Set<number>;
    expandedSubIDs?: Set<number>;
  }) => {
    const allIDs = useMemo(
      () =>
        menuData.flatMap((m) => [
          ...m.moduleContent.map((c) => c.id),
          // ...m.SUBMODULES.flatMap(s => s.CONTENTS.map(c => c.ID)),
        ]),
      [menuData],
    );
    const rootState = getCheckState(allIDs, selectedContentIDs);
    const totalSelected = allIDs.filter((ID) => selectedContentIDs.has(ID)).length;
    return (
      <Box>
        <Flex
          bg={T.bg}
          borderRadius={T.radius}
          border={`1px solid ${T.border}`}
          className="items-center gap-2 pl-3 pr-3 pt-1.5 pb-1.5 mb-2"
        >
          <TriCheckbox
            state={rootState}
            onChange={() => onToggleGroup(allIDs)}
          />
          <Text
            color={T.textMID}
            className="text-base font-normal flex-1"
          >
            Select All
          </Text>
          {totalSelected > 0 && (
            <Box
              bg={T.accentLight}
              color={T.accent}
              className="pl-2 pr-2 pt-0.5 pb-0.5 rounded-xl text-[11px] font-normal"
            >
              {totalSelected} / {allIDs.length}
            </Box>
          )}
        </Flex>
        {menuData.map((mod) => (
          <ModuleRow
            key={mod.id}
            mod={mod}
            selected={selectedContentIDs}
            onToggleContent={onToggleContent}
            onToggleGroup={onToggleGroup}
            forceOpen={expandedModuleIDs ? expandedModuleIDs.has(mod.id) : true}
            expandedSubIDs={expandedSubIDs}
          />
        ))}
      </Box>
    );
  },
);
ModuleTree.displayName = 'ModuleTree';

// ─── MergedViewTable ──────────────────────────────────────────────────────────

interface FlatRow {
  sno?: number;
  moduleNAME: string;
  subModuleNAME: string;
  contentNAME: string;
  active?: boolean;
}
function buildFlatRows(txs: RoleTran[]): FlatRow[] {
  return [...txs]
    .sort((a, b) => {
      const m = a.MODULENAME.localeCompare(b.MODULENAME);
      if (m) return m;
      const s = (a.SUBMODULENAME || '').localeCompare(b.SUBMODULENAME || '');
      if (s) return s;
      return a.CONTENTNAME.localeCompare(b.CONTENTNAME);
    })
    .map((tx) => ({
      sno: tx.SNO,
      moduleNAME: tx.MODULENAME,
      subModuleNAME: tx.SUBMODULENAME || '—',
      contentNAME: tx.CONTENTNAME,
      active: tx.ACTIVE,
    }));
}

// Compute rowspan array: null = skip cell (covered by rowspan above)
function computeSpans<T>(rows: T[], key: (r: T, i: number) => string): (number | null)[] {
  return rows.map((row, i) => {
    if (i === 0 || key(rows[i - 1], i - 1) !== key(row, i)) {
      let span = 1;
      for (let j = i + 1; j < rows.length && key(rows[j], j) === key(row, i); j++) span++;
      return span;
    }
    return null;
  });
}
const MergedViewTable = memo(
  ({
    txs,
    onToggle,
    onDelete,
    isToggling,
    isDeleting,
  }: {
    txs: RoleTran[];
    onToggle: (sno: number) => void;
    onDelete: (sno: number) => void;
    isToggling: boolean;
    isDeleting: boolean;
  }) => {
    const rows = useMemo(() => buildFlatRows(txs), [txs]);
    const moduleSpans = useMemo(() => computeSpans(rows, (r) => r.moduleNAME), [rows]);
    const subSpans = useMemo(
      () => computeSpans(rows, (r, i) => `${r.moduleNAME}__${r.subModuleNAME}`),
      [rows],
    );
    const cell: React.CSSProperties = {
      padding: '9px 14px',
      fontSize: 13,
      borderBottom: `1px solid ${T.border}`,
      verticalAlign: 'middle',
    };
    return (
      <Box className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr
              style={{
                background: T.navy,
              }}
            >
              {['Module', 'Sub Module', 'Content', 'Status', 'Actions'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i >= 3 ? 'center' : 'left',
                    borderBottom: `2px solid ${T.navyLight}`,
                  }}
                  className="py-2.75 px-3.5 text-[#E2E8F0] font-semibold text-[11px] tracking-wide uppercase whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? T.bgCard : T.bg,
                }}
                className="transition-colors duration-100"
              >
                {moduleSpans[i] !== null && (
                  <td
                    rowSpan={moduleSpans[i]!}
                    style={{
                      ...cell,
                      background: T.accentLight,
                      borderRight: `2px solid ${T.accentMID}`,
                      borderBottom: `1px solid ${T.accentMID}`,
                    }}
                    className="text-center align-middle min-w-30"
                  >
                    <Box
                      className="inline-block bg-[#DBEAFE] text-[#1E40AF] pl-3 pr-3 pt-1 pb-1 rounded-md text-xs font-normal max-w-37.5 break-words text-center"
                    >
                      {row.moduleNAME}
                    </Box>
                  </td>
                )}

                {subSpans[i] !== null && (
                  <td
                    rowSpan={subSpans[i]!}
                    style={{
                      ...cell,
                      borderRight: `1px solid ${T.border}`,
                      borderBottom: `1px solid ${T.border}`,
                    }}
                    className="bg-[#F7FAFF] text-center align-middle min-w-27.5"
                  >
                    {row.subModuleNAME === '—' ? (
                      <Text
                        color={T.textMuted}
                        className="text-sm"
                      >
                        —
                      </Text>
                    ) : (
                      <Box
                        className="inline-block bg-[#F5F3FF] text-[#6D28D9] pl-2 pr-2 pt-0.5 pb-0.5 rounded-md text-[11px] font-normal max-w-32.5 break-words text-center"
                      >
                        📁 {row.subModuleNAME}
                      </Box>
                    )}
                  </td>
                )}

                {/* Content */}
                <td
                  style={{
                    ...cell,
                    color: T.text,
                  }}
                  className="font-normal"
                >
                  {row.contentNAME}
                </td>

                {/* Status */}
                <td
                  style={{
                    ...cell,
                  }}
                  className="text-center"
                >
                  <Box
                    bg={row.active ? T.greenLight : T.redLight}
                    color={row.active ? '#065F46' : '#991B1B'}
                    className="inline-flex items-center gap-1 pl-2.5 pr-2.5 pt-0.75 pb-0.75 rounded-full text-[11px] font-normal"
                  >
                    <Box
                      bg={row.active ? T.green : T.red}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                    />
                    {row.active ? 'Active' : 'Inactive'}
                  </Box>
                </td>

                {/* Actions */}
                <td
                  style={{
                    ...cell,
                  }}
                  className="text-center"
                >
                  <HStack className="gap-1.5 justify-center">
                    <button
                      onClick={() => row.sno && onToggle(row.sno)}
                      disabled={isToggling || !row.sno}
                      title={row.active ? 'Deactivate' : 'Activate'}
                      style={{
                        borderColor: row.active ? '#F59E0B' : T.green,
                        color: row.active ? T.orange : T.green,
                        background: row.active ? '#FFFBEB' : '#F0FDF4',
                        opacity: isToggling || !row.sno ? 0.5 : 1,
                      }}
                      className="py-0.75 px-2.5 text-[11px] font-semibold rounded-md cursor-pointer border transition-all duration-120"
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => row.sno && onDelete(row.sno)}
                      disabled={isDeleting || !row.sno}
                      title="Delete"
                      style={{
                        border: `1px solid ${T.redLight}`,
                        background: T.redLight,
                        color: T.red,
                        opacity: isDeleting || !row.sno ? 0.5 : 1,
                      }}
                      className="py-1 px-2 rounded-md cursor-pointer flex items-center transition-all duration-120"
                    >
                      <Trash2 size={13} />
                    </button>
                  </HStack>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    );
  },
);
MergedViewTable.displayName = 'MergedViewTable';

// ─── RoleCard ─────────────────────────────────────────────────────────────────

const RoleCard = memo(
  ({
    roleNAME,
    txs,
    onEdit,
    onToggle,
    onDelete,
    isToggling,
    isDeleting,
  }: {
    roleNAME: string;
    txs: RoleTran[];
    onEdit: (roleNAME: string, txs: RoleTran[]) => void;
    onToggle: (sno: number) => void;
    onDelete: (sno: number) => void;
    isToggling: boolean;
    isDeleting: boolean;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const activeCount = txs.filter((t) => t.ACTIVE).length;
    return (
      <Box
        border={`1px solid ${T.border}`}
        borderRadius={T.radiusLg}
        _hover={{
          boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
        }}
        className="mb-4 overflow-hidden shadow-md transition-shadow duration-150"
      >
        {/* Header */}
        <Flex
          bg={T.navyMID}
          onClick={() => setExpanded((e) => !e)}
          className="justify-between items-center pl-4 pr-4 pt-3 pb-3 cursor-pointer"
        >
          <HStack className="gap-3">
            <Box
              className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.12)] flex items-center justify-center"
            >
              <ShieldCheck
                size={15}
                className="text-white"
              />
            </Box>
            <Box>
              <Text
                className="font-normal text-white text-sm"
              >
                {roleNAME}
              </Text>
              <HStack className="gap-2 mt-0.5">
                <Box
                  className="pl-1.5 pr-1.5 pt-0.25 pb-0.25 rounded-xl text-[11px] font-normal bg-[rgba(255,255,255,0.15)] text-white"
                >
                  {txs.length} permission{txs.length !== 1 ? 's' : ''}
                </Box>
                <Box
                  bg={activeCount > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}
                  color={activeCount > 0 ? '#6EE7B7' : '#FCA5A5'}
                  className="pl-1.5 pr-1.5 pt-0.25 pb-0.25 rounded-xl text-[11px] font-normal"
                >
                  {activeCount} active
                </Box>
              </HStack>
            </Box>
          </HStack>
          <HStack
            onClick={(e) => e.stopPropagation()}
            className="gap-2"
          >
            <button
              onClick={() => onEdit(roleNAME, txs)}
              className="flex items-center gap-1.25 py-1.25 px-3 rounded-md text-xs font-semibold bg-[rgba(255,255,255,0.12)] text-white border border-[rgba(255,255,255,0.2)] cursor-pointer transition-colors duration-120"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1.25 py-1.25 px-3 rounded-md text-xs font-semibold bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.12)] cursor-pointer transition-colors duration-120"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {expanded ? 'Hide' : 'Show'}
            </button>
          </HStack>
        </Flex>

        {/* Table */}
        {expanded && (
          <MergedViewTable
            txs={txs}
            onToggle={onToggle}
            onDelete={onDelete}
            isToggling={isToggling}
            isDeleting={isDeleting}
          />
        )}
      </Box>
    );
  },
);
RoleCard.displayName = 'RoleCard';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoleTranCreationPage() {
  const [tabValue, setTabValue] = useState<string>('create');
  const [selectedRoleID, setSelectedRoleID] = useState<number | undefined>(undefined);
  const [selectedRoleNAME, setSelectedRoleNAME] = useState('');
  const [active, setActive] = useState(true);
  const [selectedContentIDs, setSelectedContentIDs] = useState<Set<number>>(new Set());
  const [expandedModuleIDs, setExpandedModuleIDs] = useState<Set<number> | undefined>(
    undefined,
  );
  const [expandedSubIDs, setExpandedSubIDs] = useState<Set<number> | undefined>(
    undefined,
  );
  const [rows, setRows] = useState<RoleTran[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<{
    roleNAME: string;
    originalRows: RoleTran[];
  } | null>(null);
  const { data: menu = [] } = useMenu();
  const {
    data: roleTransactions,
    isLoading: isLoadingTransactions,
    refetch,
  } = useRoleTransactions();
  console.log(roleTransactions, menu, 'roleTransactions');
  const { mutate: insertRoles, isPending: isInserting } = useInsertRoleTransaction();
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteRoleTransaction();
  const { mutate: toggleTransaction, isPending: isToggling } =
    useToggleRoleTransactionActive();
  const { roles, loading: loadingRoles } = useRole();
  console.log(menu, 'roleTransactions');

  // ── Content meta lookup ────────────────────────────────────────────────────
  const contentMeta = useMemo(() => {
    const map = new Map<
      number,
      {
        moduleID: number;
        moduleNAME: string;
        subModuleID: number;
        subModuleNAME: string;
        contentNAME: string;
      }
    >();
    (menu as unknown as ModuleNode[]).forEach((mod) => {
      console.log(mod, 'modmod');
      mod.moduleContent?.forEach((c) => {
        map.set(c.id, {
          moduleID: mod.id,
          moduleNAME: mod.name,
          subModuleID: 0,
          subModuleNAME: '',
          contentNAME: c.name,
        });
      });
      // mod.SUBMODULES?.forEach(sub => {
      //   sub.CONTENTS?.forEach(c => {
      //     map.set(c.ID, { moduleID: mod.ID, moduleNAME: mod.NAME, subModuleID: sub.ID, subModuleNAME: sub.NAME, contentNAME: c.NAME });
      //   });
      // });
    });
    return map;
  }, [menu]);
  const computeExpandedIDs = useCallback(
    (contentIDs: Set<number>) => {
      const modIDs = new Set<number>();
      const subIDs = new Set<number>();
      contentIDs.forEach((cID) => {
        const m = contentMeta.get(cID);
        if (m) {
          modIDs.add(m.moduleID);
          if (m.subModuleID) subIDs.add(m.subModuleID);
        }
      });
      return {
        modIDs,
        subIDs,
      };
    },
    [contentMeta],
  );

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const handleToggleContent = useCallback((contentID: number) => {
    setSelectedContentIDs((prev) => {
      const next = new Set(prev);
      next.has(contentID) ? next.delete(contentID) : next.add(contentID);
      return next;
    });
  }, []);
  const handleToggleGroup = useCallback((IDs: number[]) => {
    setSelectedContentIDs((prev) => {
      const next = new Set(prev);
      const allSelected = IDs.every((ID) => next.has(ID));
      if (allSelected) IDs.forEach((ID) => next.delete(ID));
      else IDs.forEach((ID) => next.add(ID));
      return next;
    });
  }, []);
  const isFormValID = selectedRoleID !== undefined && selectedContentIDs.size > 0;

  // ── Clear ──────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setSelectedRoleID(undefined);
    setSelectedRoleNAME('');
    setSelectedContentIDs(new Set());
    setExpandedModuleIDs(undefined);
    setExpandedSubIDs(undefined);
    setRows([]);
    setEditingIndex(null);
    setEditingRole(null);
    setActive(true);
  }, []);

  // ── Add / edit rows ────────────────────────────────────────────────────────
  const handleAddRows = useCallback(() => {
    if (!isFormValID) {
      toastError('Please select a role and at least one content');
      return;
    }
    console.log(selectedContentIDs, 'selectedContentIDs');
    const newRows: RoleTran[] = Array.from(selectedContentIDs).map((contentID) => {
      const meta = contentMeta.get(contentID);
      console.log(meta, contentID, 'meta');
      if (!meta) throw new Error(`Content ${contentID} not found`);
      return {
        ROLEID: selectedRoleID!,
        ROLENAME: selectedRoleNAME,
        MODULEID: meta.moduleID,
        MODULENAME: meta.moduleNAME,
        SUBMODULEID: meta.subModuleID,
        SUBMODULENAME: meta.subModuleNAME,
        CONTENTID: contentID,
        CONTENTNAME: meta.contentNAME,
        ACTIVE: active,
      };
    });
    if (editingIndex !== null) {
      setRows((prev) => {
        const u = [...prev];
        u[editingIndex] = newRows[0];
        return u;
      });
      setEditingIndex(null);
    } else {
      const existing = new Set(rows.map((r) => `${r.ROLEID}-${r.CONTENTID}`));
      const unique = newRows.filter((r) => !existing.has(`${r.ROLEID}-${r.CONTENTID}`));
      setRows((prev) => [...prev, ...unique]);
    }
    setSelectedContentIDs(new Set());
  }, [
    isFormValID,
    selectedContentIDs,
    contentMeta,
    selectedRoleID,
    selectedRoleNAME,
    active,
    editingIndex,
    rows,
  ]);
  const handleEditRow = useCallback(
    (index: number) => {
      const row = rows[index];
      const role = roles.find((r) => r.ROLEID === row.ROLEID);
      if (role) {
        setSelectedRoleID(role.ROLEID);
        setSelectedRoleNAME(role.ROLENAME);
      }
      const IDs = new Set([row.CONTENTID]);
      setSelectedContentIDs(IDs);
      const { modIDs, subIDs } = computeExpandedIDs(IDs);
      setExpandedModuleIDs(modIDs);
      setExpandedSubIDs(subIDs);
      setActive(row.ACTIVE ?? true);
      setEditingIndex(index);
      setTabValue('create');
    },
    [rows, roles, computeExpandedIDs],
  );
  const handleDeleteRow = useCallback(
    (index: number) => {
      setRows((prev) => prev.filter((_, i) => i !== index));
      if (editingIndex === index) {
        setEditingIndex(null);
        setSelectedContentIDs(new Set());
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
      setEditingRole({
        roleNAME,
        originalRows: txs,
      });
      setEditingIndex(null);
      const IDs = new Set(txs.map((tx) => tx.CONTENTID));
      setSelectedContentIDs(IDs);
      const { modIDs, subIDs } = computeExpandedIDs(IDs);
      setExpandedModuleIDs(modIDs);
      setExpandedSubIDs(subIDs);
      setActive(true);
      setTabValue('create');
    },
    [computeExpandedIDs],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmitSuccess = useCallback(() => {
    toastCreated('Role permissions saved successfully');
    handleClear();
    refetch();
  }, [handleClear, refetch]);
  const handleSubmit = useCallback(() => {
    if (!rows.length) {
      toastError('Please add at least one role transaction');
      return;
    }
    const payload = toRoleTranInputs(rows);
    console.log(payload, 'payload');
    if (editingRole) {
      const snos = editingRole.originalRows.filter((tx) => tx.SNO).map((tx) => tx.SNO!);
      if (!snos.length) {
        insertRoles(payload, {
          onSuccess: handleSubmitSuccess,
        });
        return;
      }
      let done = 0;
      let errored = false;
      snos.forEach((sno) =>
        deleteTransaction(sno, {
          onSuccess: () => {
            done++;
            if (done === snos.length && !errored)
              insertRoles(payload, {
                onSuccess: handleSubmitSuccess,
              });
          },
          onError: () => {
            if (!errored) {
              errored = true;
              toastError('Error deleting old permissions');
            }
          },
        }),
      );
    } else {
      insertRoles(payload, {
        onSuccess: handleSubmitSuccess,
      });
    }
  }, [rows, editingRole, insertRoles, deleteTransaction, handleSubmitSuccess]);
  const handleDeleteFromDB = useCallback(
    (sno: number) => {
      if (window.confirm('Delete this permission?'))
        deleteTransaction(sno, {
          onSuccess: () => refetch(),
        });
    },
    [deleteTransaction, refetch],
  );
  const handleToggleFromDB = useCallback(
    (sno: number) => {
      toggleTransaction(sno, {
        onSuccess: () => refetch(),
      });
    },
    [toggleTransaction, refetch],
  );

  // ── Staging table columns ──────────────────────────────────────────────────
  const groupedByRole = useMemo(() => {
    if (!roleTransactions) return {} as Record<string, RoleTran[]>;
    const g: Record<string, RoleTran[]> = {};
    roleTransactions.forEach((tx) => {
      (g[tx.ROLENAME] = g[tx.ROLENAME] || []).push(tx);
    });
    return g;
  }, [roleTransactions]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Box
      className="font-normal [&_table]:w-full [&_table]:border-collapse [&_th]:bg-slate-50 [&_th]:px-3.5 [&_th]:py-row [&_th]:text-xs [&_th]:tracking-wide [&_th]:text-muted [&_th]:uppercase [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-3.5 [&_td]:py-row [&_td]:text-sm [&_tbody_tr:hover]:bg-brand-soft [&_button]:min-h-9 [&_button]:rounded-lg [&_[role=tab]]:min-h-11 [&_[role=tab][data-selected]]:bg-brand-soft [&_[role=tab][data-selected]]:text-brand"
      bg={T.bgCard}
      rounded={T.radiusLg}
      shadow="sm"
      border={`1px solid ${T.border}`}
    >
      <Tabs.Root
        value={tabValue}
        onValueChange={(d: any) => setTabValue(d.value)}
        variant="enclosed"
      >
        <Tabs.List
          borderBottom={`2px solid ${T.border}`}
          bg={T.bg}
          borderRadius={`${T.radiusMd} ${T.radiusMd} 0 0`}
          className="p-1 gap-1"
        >
          {[
            {
              value: 'create',
              label: 'Create Role Transaction',
              icon: <ShieldCheck size={14} />,
            },
            {
              value: 'view',
              label: 'View Role Transactions',
              icon: <Eye size={14} />,
            },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 py-1.75 px-4 rounded-lg text-sm font-semibold transition-all duration-150"
            >
              {tab.icon} {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* ── CREATE TAB ──────────────────────────────────────────────────── */}
        <Tabs.Content value="create">
          <Grid
            className="grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-3 p-4"
          >
            {/* LEFT: form + tree */}
            <GridItem>
              <Box
                bg={T.bg}
                rounded={T.radiusLg}
                border={`1px solid ${T.border}`}
                className="p-4 shadow-sm"
              >
                {/* Section header */}
                <HStack className="gap-2 mb-4">
                  <Box
                    bg={T.navyMID}
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  >
                    <ShieldCheck
                      size={14}
                      className="text-white"
                    />
                  </Box>
                  <Box>
                    <Text
                      color={T.text}
                      className="text-sm font-normal"
                    >
                      {editingRole
                        ? `Editing: ${editingRole.roleNAME}`
                        : editingIndex !== null
                          ? 'Edit Transaction'
                          : 'New Transaction'}
                    </Text>
                    {editingRole && (
                      <Text
                        color={T.orange}
                        className="text-xs"
                      >
                        ⚠ Editing existing role permissions
                      </Text>
                    )}
                  </Box>
                </HStack>

                <VStack className="gap-4 items-stretch">
                  {/* Role selector */}
                  <Box>
                    <Text
                      color={T.textSub}
                      className="text-xs font-normal mb-1.5 uppercase tracking-wide"
                    >
                      Role *
                    </Text>
                    {loadingRoles ? (
                      <Flex className="items-center gap-2">
                        <Spinner size="sm" />
                        <Text
                          color={T.textMuted}
                          className="text-xs"
                        >
                          Loading roles…
                        </Text>
                      </Flex>
                    ) : (
                      <select
                        style={{
                          borderRadius: T.radius,
                          border: `1px solid ${T.borderMID}`,
                          background: T.bgCard,
                          color: T.text,
                        }}
                        value={selectedRoleID ?? ''}
                        onChange={(e) => {
                          const ID = Number(e.target.value);
                          const r = roles.find((r) => r.ROLEID === ID);
                          if (r) {
                            setSelectedRoleID(r.ROLEID);
                            setSelectedRoleNAME(r.ROLENAME);
                          } else {
                            setSelectedRoleID(undefined);
                            setSelectedRoleNAME('');
                          }
                        }}
                        className="w-full py-2 px-3 text-sm outline-none cursor-pointer"
                      >
                        <option value="">Select role…</option>
                        {roles.map((r) => (
                          <option
                            key={r.ROLEID}
                            value={r.ROLEID}
                          >
                            {r.ROLENAME}
                          </option>
                        ))}
                      </select>
                    )}
                  </Box>

                  {/* Active toggle */}
                  <label
                    style={{
                      borderRadius: T.radius,
                      background: active ? T.greenLight : T.bg,
                      border: `1px solid ${active ? '#A7F3D0' : T.border}`,
                      color: active ? '#065F46' : T.textMID,
                    }}
                    className="flex items-center p-3 gap-2 cursor-pointer select-none py-1.75 px-2.5 transition-all duration-150 text-sm font-semibold"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      style={{
                        accentColor: T.green,
                      }}
                      className="w-3.5 p-3 h-3.5"
                    />
                    Active Permission
                  </label>

                  <Box borderTop={`1px solid ${T.border}`} />

                  {/* Permission tree */}
                  <Box>
                    <HStack
                      className="justify-between mb-2"
                    >
                      <Text
                        color={T.textSub}
                        className="text-xs font-normal uppercase tracking-wide"
                      >
                        Permissions
                      </Text>
                      {selectedContentIDs.size > 0 && (
                        <Box
                          bg={T.accentLight}
                          color={T.accent}
                          className="pl-2 pr-2 pt-0.5 pb-0.5 rounded-xl text-[11px] font-normal"
                        >
                          {selectedContentIDs.size} selected
                        </Box>
                      )}
                    </HStack>
                    <Box
                      border={`1px solid ${T.border}`}
                      rounded={T.radius}
                      bg={T.bgCard}
                      css={{
                        '&::-webkit-scrollbar': {
                          width: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: T.borderMID,
                          borderRadius: '4px',
                        },
                      }}
                      className="max-h-85 overflow-y-auto p-2"
                    >
                      {!menu.length ? (
                        <Flex
                          className="justify-center items-center h-20 gap-2"
                        >
                          <Spinner size="sm" />
                          <Text
                            color={T.textMuted}
                            className="text-xs"
                          >
                            Loading permissions…
                          </Text>
                        </Flex>
                      ) : (
                        <ModuleTree
                          menuData={menu as unknown as ModuleNode[]}
                          selectedContentIDs={selectedContentIDs}
                          onToggleContent={handleToggleContent}
                          onToggleGroup={handleToggleGroup}
                          expandedModuleIDs={expandedModuleIDs}
                          expandedSubIDs={expandedSubIDs}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Add row button */}
                  <button
                    onClick={handleAddRows}
                    disabled={!isFormValID}
                    style={{
                      borderRadius: T.radius,
                      cursor: isFormValID ? 'pointer' : 'not-allowed',
                      background: isFormValID ? T.navyMID : T.border,
                      color: isFormValID ? 'white' : T.textMuted,
                    }}
                    className="flex items-center justify-center gap-1.75 w-full py-2 px-4 text-sm font-semibold border-0 transition-all duration-150"
                  >
                    <Plus size={15} />
                    {editingIndex !== null ? 'Update Row' : 'Add Row(s)'}
                  </button>

                  {(editingIndex !== null || editingRole) && (
                    <button
                      onClick={handleClear}
                      style={{
                        borderRadius: T.radius,
                        color: T.textMID,
                        border: `1px solid ${T.border}`,
                      }}
                      className="w-full py-1.75 px-4 text-sm font-semibold cursor-pointer bg-transparent transition-all duration-150"
                    >
                      Cancel Edit
                    </button>
                  )}
                </VStack>
              </Box>
            </GridItem>

            {/* RIGHT: staging table */}
            <GridItem>
              <Box
                border={`1px solid ${T.border}`}
                rounded={T.radiusLg}
                bg={T.bgCard}
                className="p-3 h-full shadow-sm"
              >
                <HStack
                  className="justify-between mb-3"
                >
                  <HStack className="gap-2">
                    <Text
                      color={T.text}
                      className="text-sm font-normal"
                    >
                      Staged Transactions
                    </Text>
                    <Box
                      bg={rows.length ? T.accentLight : T.bg}
                      color={rows.length ? T.accent : T.textMuted}
                      className="pl-2 pr-2 pt-0.5 pb-0.5 rounded-xl text-[11px] font-normal"
                    >
                      {rows.length}
                    </Box>
                    {editingRole && (
                      <Box
                        color={T.orange}
                        className="pl-2 pr-2 pt-0.5 pb-0.5 rounded-xl text-[11px] font-normal bg-[#FFFBEB]"
                      >
                        Editing Role
                      </Box>
                    )}
                  </HStack>
                  {rows.length > 0 && (
                    <button
                      onClick={handleClear}
                      style={{
                        color: T.textMuted,
                      }}
                      className="text-[11px] cursor-pointer bg-transparent border-0 py-0.5 px-1.5"
                    >
                      Clear all
                    </button>
                  )}
                </HStack>

                {rows.length === 0 ? (
                  <Flex
                    direction="column"
                    color={T.textMuted}
                    className="justify-center items-center h-50 gap-3"
                  >
                    <Box
                      bg={T.bg}
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                    >
                      <AlertCircle
                        size={20}
                        color={T.textMuted}
                      />
                    </Box>
                    <Text className="text-sm">
                      No rows added yet
                    </Text>
                    <Text
                      color={T.textMuted}
                      className="text-xs text-center max-w-50"
                    >
                      Select a role and permissions, then click "Add Row(s)"
                    </Text>
                  </Flex>
                ) : (
                  <VStack className="items-stretch gap-4">
                    <Box className="overflow-x-auto">
                      <CustomTable
                        columns={[
                          {
                            key: 'MODULENAME',
                            header: 'Module',
                            render: (row) => row.MODULENAME,
                          },
                          {
                            key: 'SUBMODULENAME',
                            header: 'Sub Module',
                            render: (row) => row.SUBMODULENAME || '—',
                          },
                          {
                            key: 'CONTENTNAME',
                            header: 'Content',
                            render: (row) => row.CONTENTNAME,
                          },
                          {
                            key: 'ACTIVE',
                            header: 'Active',
                            render: (row) => (
                              <Box
                                bg={row.ACTIVE ? T.greenLight : T.redLight}
                                color={row.ACTIVE ? '#065F46' : '#991B1B'}
                                className="inline-block pl-2 pr-2 pt-0.25 pb-0.25 rounded-xl text-[11px] font-normal"
                              >
                                {row.ACTIVE ? 'Yes' : 'No'}
                              </Box>
                            ),
                          },
                          {
                            key: 'actions',
                            header: 'Actions',
                            render: (_row, IDx) => (
                              <HStack
                                className="gap-1 justify-center"
                              >
                                <button
                                  onClick={() => handleEditRow(IDx)}
                                  style={{
                                    background: T.accentLight,
                                    color: T.accent,
                                    border: `1px solid ${T.accentMID}`,
                                  }}
                                  className="py-0.75 px-2 text-[11px] rounded-md cursor-pointer font-semibold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRow(IDx)}
                                  style={{
                                    background: T.redLight,
                                    color: T.red,
                                    border: `1px solid #FECACA`,
                                  }}
                                  className="py-1 px-1.75 rounded-md cursor-pointer flex items-center"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </HStack>
                            ),
                          },
                        ]}
                        data={rows}
                        showSearch={false}
                        showPagination={false}
                        title="Selected permissions"
                      />
                    </Box>
                    <HStack
                      borderTop={`1px solid ${T.border}`}
                      className="justify-end gap-2 pt-1"
                    >
                      <button
                        onClick={handleSubmit}
                        disabled={isInserting}
                        style={{
                          borderRadius: T.radius,
                          background: isInserting ? T.border : T.green,
                          color: isInserting ? T.textMuted : 'white',
                          cursor: isInserting ? 'not-allowed' : 'pointer',
                        }}
                        className="flex items-center gap-1.5 py-1.75 px-4.5 text-sm font-bold border-0 transition-all duration-150"
                      >
                        <CheckSquare size={14} />
                        {isInserting ? 'Submitting…' : 'Submit All'}
                      </button>
                    </HStack>
                  </VStack>
                )}
              </Box>
            </GridItem>
          </Grid>
        </Tabs.Content>

        {/* ── VIEW TAB ────────────────────────────────────────────────────── */}
        <Tabs.Content value="view">
          <VStack className="items-stretch gap-4 p-4">
            {isLoadingTransactions ? (
              <Flex
                className="justify-center items-center min-h-75 gap-3"
              >
                <Spinner
                  size="lg"
                  color={T.accent}
                />
                <Text
                  color={T.textMuted}
                  className="text-sm"
                >
                  Loading permissions…
                </Text>
              </Flex>
            ) : roleTransactions && roleTransactions.length > 0 ? (
              <>
                <HStack className="justify-between">
                  <HStack className="gap-2">
                    <Text
                      color={T.text}
                      className="text-sm font-normal"
                    >
                      Role Permissions
                    </Text>
                    <Box
                      bg={T.accentLight}
                      color={T.accent}
                      className="pl-2 pr-2 pt-0.5 pb-0.5 rounded-xl text-[11px] font-normal"
                    >
                      {Object.keys(groupedByRole).length} roles ·{' '}
                      {roleTransactions.length} total
                    </Box>
                  </HStack>
                </HStack>
                {Object.entries(groupedByRole).map(([roleNAME, txs]) => (
                  <RoleCard
                    key={roleNAME}
                    roleNAME={roleNAME}
                    txs={txs}
                    onEdit={handleEditRole}
                    onToggle={handleToggleFromDB}
                    onDelete={handleDeleteFromDB}
                    isToggling={isToggling}
                    isDeleting={isDeleting}
                  />
                ))}
              </>
            ) : (
              <Flex
                direction="column"
                className="justify-center items-center min-h-75 gap-3"
              >
                <Box
                  bg={T.bg}
                  className="w-13 h-13 rounded-lg flex items-center justify-center"
                >
                  <ShieldCheck
                    size={24}
                    color={T.textMuted}
                  />
                </Box>
                <Text
                  color={T.textMID}
                  className="text-sm font-normal"
                >
                  No permissions found
                </Text>
                <Text
                  color={T.textMuted}
                  className="text-xs"
                >
                  Create role transactions in the Create tab
                </Text>
              </Flex>
            )}
          </VStack>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
