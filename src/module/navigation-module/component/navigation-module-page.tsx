'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Box, Button, Grid, VStack, Text, HStack, Badge, Table } from '@chakra-ui/react';
import {
  Database,
  Layers,
  FileText,
  Pencil,
  Trash2,
  ChevronDown,
  Eye,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  useModules,
  useMenu,
  useSubModules,
  useContents,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateSubModule,
  useUpdateSubModule,
  useDeleteSubModule,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
} from '@/src/module/role-tran/hook/use-role-tran';
import {
  useSidebar,
  type DirectMenuItem,
  type SectionDirectItem,
  type MenuGroup,
} from '@/context/layout/SideBarContext';
import { menuConfig } from '@/config/menu/menuConfig';
// import { useTheme } from "@/context/theme/themeContext";
import { toastError } from '@/components/toast/toast';

// Module options come straight from the static sidebar config — the value
// stored (and sent to the API as `name`) is always the stable `id` slug,
// never the display label.
const moduleOptions = menuConfig.map((m) => ({
  label: m.label,
  value: m.id,
}));

// ─── Types ──────────────────────────────────────────────────────────────────

type TabKey = 'module' | 'submodule' | 'content' | 'view';

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [
  {
    key: 'module',
    label: 'Module',
    icon: <Database size={14} />,
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    key: 'submodule',
    label: 'Sub Module',
    icon: <Layers size={14} />,
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    key: 'content',
    label: 'Content',
    icon: <FileText size={14} />,
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    key: 'view',
    label: 'View',
    icon: <Eye size={14} />,
    color: '#D97706',
    bg: '#FFFBEB',
  },
];

// ─── Shared styles ──────────────────────────────────────────────────────────

const selectClasses =
  'h-control! w-full! cursor-pointer! rounded-lg! border! border-line! bg-white! px-3! text-sm! text-ink! outline-none! focus:border-brand! focus:ring-3! focus:ring-brand-soft!';

// ─── Sub-components ──────────────────────────────────────────────────────────

const FormPanel = ({ children }: { children: React.ReactNode }) => (
  <Box
    className="max-w-full max-lg:w-full items-stretch max-sm:p-4 w-85 shrink-0 bg-white p-3 rounded-lg border border-gray-100 shadow-sm h-fit sticky top-5"
  >
    {children}
  </Box>
);
const DataPanel = ({ children }: { children: React.ReactNode }) => (
  <Box
    className="flex-1 min-w-0 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden"
  >
    {children}
  </Box>
);
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    className="text-sm font-normal text-ink mb-1"
  >
    {children}
  </Text>
);
const ActionButton = ({
  onClick,
  color = '#2563eb',
  className = '',
  children,
}: {
  onClick: () => void;
  color?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    style={{
      background: `${color}15`,
      color,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = `${color}25`;
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = `${color}15`;
    }}
    className={cn(
      'inline-flex size-7 cursor-pointer items-center justify-center rounded-md border-0 transition-all duration-150',
      className,
    )}
  >
    {children}
  </button>
);

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function RoleTranPage() {
  const { menuData } = useSidebar();
  // const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('module');
  const [moduleName, setModuleName] = useState('');
  const [subModuleName, setSubModuleName] = useState('');
  const [contentName, setContentName] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState(0);
  const [selectedSubModuleId, setSelectedSubModuleId] = useState(0);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingSubModuleId, setEditingSubModuleId] = useState<number | null>(null);
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedSubModules, setExpandedSubModules] = useState<Set<number>>(new Set());
  // Tracks which sidebar items are checked in the Content picker, by their
  // stable menuConfig `id` — not by label, so items with the same name in
  // different modules/submodules never collide.
  const [selectedContentItemIds, setSelectedContentItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [isDirectItem, setIsDirectItem] = useState<boolean>(false);
  const toggle = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  // ── API ──────────────────────────────────────────────────────────────────

  const { data: menu = [] } = useMenu();
  console.log(menu, 'menudetails');
  const { data: modules = [] } = useModules();
  const { data: subModules = [] } = useSubModules(selectedModuleId);
  const { data: contents = [] } = useContents(selectedModuleId, selectedSubModuleId);
  const { mutate: createModule } = useCreateModule();
  const { mutate: updateModule } = useUpdateModule();
  const { mutate: deleteModule } = useDeleteModule();
  const { mutate: createSubModule } = useCreateSubModule();
  const { mutate: updateSubModule } = useUpdateSubModule();
  const { mutate: deleteSubModule } = useDeleteSubModule();
  const { mutate: createContent } = useCreateContent();
  const { mutate: updateContent } = useUpdateContent();
  const { mutate: deleteContent } = useDeleteContent();

  // ── Handlers ──────────────────────────────────────────────────────────────

  // moduleName holds a menuConfig `id` (e.g. "master"), not the display label —
  // that id is what gets stored via the API, matching moduleOptions above.
  const handleSaveModule = () => {
    if (!moduleName) return;
    if (modules.some((m) => m.name === moduleName && m.id !== editingModuleId)) {
      return toastError('Already Added Module');
    }
    if (editingModuleId) {
      updateModule({
        id: editingModuleId,
        body: {
          name: moduleName,
          displayOrder: 1,
          active: true,
        },
      });
      setEditingModuleId(null);
    } else {
      createModule({
        name: moduleName,
        displayOrder: 1,
      });
    }
    setModuleName('');
  };
  const handleSaveSubModule = () => {
    if (!subModuleName.trim() || !selectedModuleId) return;
    if (
      subModules.some(
        (m) =>
          m.name.toLowerCase() === subModuleName.toLowerCase() &&
          m.moduleId === Number(selectedModuleId),
      )
    ) {
      return toastError('Already Added Sub Module');
    }
    if (editingSubModuleId) {
      updateSubModule({
        id: editingSubModuleId,
        body: {
          name: subModuleName,
          displayOrder: 1,
          active: true,
        },
      });
      setEditingSubModuleId(null);
    } else {
      createSubModule({
        moduleId: selectedModuleId,
        body: {
          name: subModuleName,
          displayOrder: 1,
        },
      });
    }
    setSubModuleName('');
  };
  const handleSaveContent = () => {
    if (!selectedModuleId) return;
    if (editingContentId) {
      if (!contentName.trim()) return;
      updateContent({
        id: editingContentId,
        body: {
          name: contentName.trim(),
          displayOrder: 1,
          active: true,
        },
      });
      setEditingContentId(null);
      setContentName('');
      return;
    }

    // Creating: names come from whichever sidebar items are checked, looked
    // up by id — not typed in, and not matched by label.
    const items = getSidebarItems(selectedModuleId, selectedSubModuleId);
    const selectedItems = items.filter((i) => selectedContentItemIds.has(i.id));
    if (!selectedItems.length) return;
    selectedItems.forEach((item, i) =>
      createContent({
        moduleId: selectedModuleId,
        subModuleId: selectedSubModuleId > 0 ? selectedSubModuleId : undefined,
        body: {
          name: item.id,
          displayOrder: i + 1,
        },
      }),
    );
    setSelectedContentItemIds(new Set());
  };
  const resetModuleEdit = () => {
    setEditingModuleId(null);
    setModuleName('');
  };
  const resetSubEdit = () => {
    setEditingSubModuleId(null);
    setSubModuleName('');
  };
  const resetContentEdit = () => {
    setEditingContentId(null);
    setContentName('');
  };

  // ── Sidebar helpers ───────────────────────────────────────────────────────

  // Module.name stores a menuConfig `id` (e.g. "master"), but menuData is
  // still keyed by the config entry's display label — resolve id -> label
  // before indexing into it.
  const getMenuSection = (moduleConfigId: string) => {
    const entry = menuConfig.find((m) => m.id === moduleConfigId);
    if (!entry) return null;
    return menuData[entry.label] ?? null;
  };
  const getSidebarSubModules = (moduleId: number): string[] => {
    const apiModule = modules.find((m) => m.id === moduleId);
    if (!apiModule) return [];
    const section = getMenuSection(apiModule.name);
    if (!section) return [];

    // Return only group names (keys where the value is a MenuGroup, not a direct item)
    return Object.entries(section)
      .filter(([, val]) => !('type' in val)) // MenuGroup has no `type`
      .map(([key]) => key);
  };
  const getSidebarItems = (moduleId: number, subModuleId: number): DirectMenuItem[] => {
    const apiModule = modules.find((m) => m.id === moduleId);
    const apiSubModule = subModules.find((s) => s.id === subModuleId);
    if (!apiModule) return [];
    const section = getMenuSection(apiModule.name);
    if (!section) return [];
    const values = Object.values(section);
    const directItems = values.filter(
      (v): v is DirectMenuItem => 'type' in v && v.type === 'direct',
    );

    // CASE 1: no submodule → show direct only
    if (!subModuleId) {
      return directItems;
    }

    // CASE 2: submodule selected → show group items
    if (apiSubModule) {
      const group = section[apiSubModule.name];
      if (group && Array.isArray((group as any).items)) {
        return (group as MenuGroup).items.filter(
          (i): i is DirectMenuItem => i.type === 'direct',
        );
      }
    }
    return [];
  };
  const toggleContentItem = (id: string) => {
    setSelectedContentItemIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const activeConfig = TABS.find((t) => t.key === activeTab)!;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box className="font-normal [&_table]:w-full [&_table]:border-collapse [&_th]:bg-slate-50 [&_th]:px-3.5 [&_th]:py-row [&_th]:text-xs [&_th]:tracking-wide [&_th]:text-muted [&_th]:uppercase [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-3.5 [&_td]:py-row [&_td]:text-sm [&_tbody_tr:hover]:bg-brand-soft [&_button]:min-h-9 [&_button]:rounded-lg [&_[role=tab]]:min-h-11 [&_[role=tab][data-selected]]:bg-brand-soft [&_[role=tab][data-selected]]:text-brand">
      <VStack className="items-stretch gap-2">
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <Box
          className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden"
        >
          <Box
            bg={activeConfig.color}
            borderLeftRadius="xl"
            className="absolute"
          />
          <HStack
            className="justify-between items-center"
          >
            <Box>
              <Text
                className="text-xl font-normal text-ink"
              >
                Navigation structure
              </Text>
              <Text className="text-gray-400 text-xs">
                Manage Modules, Sub Modules & Contents
              </Text>
            </Box>
            <Badge
              colorPalette="blue"
              className="pl-3 pr-3 pt-1 pb-1 rounded-full text-[11px] font-normal"
            >
              {modules.length} Modules
            </Badge>
          </HStack>
        </Box>

        {/* ── TABS ───────────────────────────────────────────────────────── */}
        <Box
          className="mb-4 max-w-full overflow-x-auto p-1.5 [&_button]:flex-1 [&_button]:justify-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-4 [&_button]:py-2.5 [&_button[aria-selected=true]]:bg-brand-soft [&_button[aria-selected=true]]:text-brand [&_button]:max-sm:shrink-0 [&_button]:max-sm:whitespace-nowrap bg-white pl-2 pr-2 pt-1.5 pb-1.5 rounded-full border border-gray-100 shadow-sm"
        >
          <HStack
            role="tablist"
            aria-label="Navigation structure"
            className="gap-1"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Box
                  as="button"
                  role="tab"
                  aria-selected={isActive}
                  key={tab.key}
                  bg={isActive ? tab.color : 'transparent'}
                  color={isActive ? 'white' : 'gray.500'}
                  _hover={{
                    bg: isActive ? tab.color : tab.bg,
                    color: isActive ? 'white' : 'gray.700',
                  }}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 pl-3 pr-3 pt-2 pb-2 rounded-lg cursor-pointer transition-all duration-200"
                >
                  <HStack className="justify-center gap-1.5">
                    {tab.icon}
                    <Text
                      fontWeight={isActive ? '700' : '500'}
                      className="text-sm"
                    >
                      {tab.label}
                    </Text>
                  </HStack>
                </Box>
              );
            })}
          </HStack>
        </Box>

        {/* ── MODULE TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'module' && (
          <HStack
            className="flex max-lg:flex-col max-lg:items-stretch items-start gap-3"
          >
            {/* LEFT: Form */}
            <FormPanel>
              <VStack className="items-stretch gap-4">
                <HStack
                  className="justify-between items-center"
                >
                  <Text
                    className="font-normal text-sm text-gray-700"
                  >
                    {editingModuleId ? 'Edit Module' : 'New Module'}
                  </Text>
                  {editingModuleId && (
                    <button
                      onClick={resetModuleEdit}
                      className="bg-transparent border-0 cursor-pointer text-muted text-[11px] flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Reset
                    </button>
                  )}
                </HStack>

                <Box>
                  <FieldLabel>Select Module</FieldLabel>
                  <select
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">Choose from Sidebar</option>
                    {moduleOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Box>

                <Button
                  _hover={{
                    bg: 'var(--primary-hover)',
                  }}
                  colorScheme={editingModuleId ? 'orange' : 'blue'}
                  onClick={handleSaveModule}
                  // disabled={!moduleName.trim()}
                  className="bg-brand text-white min-h-control h-9.5 rounded-lg font-normal text-sm w-full"
                >
                  <HStack className="gap-1.5">
                    {editingModuleId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingModuleId ? 'Update Module' : 'Create Module'}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack
                className="pl-5 pr-5 pt-3.5 pb-3.5 border-b border-[#F1F5F9] justify-between"
              >
                <Text
                  className="font-normal text-sm text-gray-600"
                >
                  All Modules
                </Text>
                <Badge
                  colorPalette="blue"
                  className="pl-2.5 pr-2.5 pt-0.5 pb-0.5 rounded-full text-[11px]"
                >
                  {modules.length} records
                </Badge>
              </HStack>
              <StyledTable
                headers={['#', 'Module Name', 'Status', 'Actions']}
                empty={modules.length === 0}
              >
                {modules.map((item, idx) => (
                  <Table.Row
                    key={item.id}
                    _hover={{
                      bg: 'gray.50',
                    }}
                    className="transition-colors duration-150"
                  >
                    <Table.Cell
                      className="text-gray-400 text-xs w-10"
                    >
                      {idx + 1}
                    </Table.Cell>
                    <Table.Cell className="font-normal text-sm">
                      {item.name}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={item.active ? 'green' : 'red'}
                        className="pl-2.5 pr-2.5 pt-0.5 pb-0.5 rounded-full text-[11px]"
                      >
                        {item.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack className="gap-1.5">
                        <ActionButton
                          onClick={() => {
                            setEditingModuleId(item.id);
                            setModuleName(item.name);
                          }}
                          className="text-[#2563EB]"
                        >
                          <Pencil size={12} />
                        </ActionButton>
                        <ActionButton
                          onClick={() => deleteModule(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 size={12} />
                        </ActionButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </StyledTable>
            </DataPanel>
          </HStack>
        )}

        {/* ── SUB MODULE TAB ─────────────────────────────────────────────── */}
        {activeTab === 'submodule' && (
          <HStack
            className="flex max-lg:flex-col max-lg:items-stretch items-start gap-3"
          >
            {/* LEFT: Form */}
            <FormPanel>
              <VStack className="items-stretch gap-4">
                <HStack
                  className="justify-between items-center"
                >
                  <Text
                    className="font-normal text-sm text-gray-700"
                  >
                    {editingSubModuleId ? 'Edit Sub Module' : 'New Sub Module'}
                  </Text>
                  {editingSubModuleId && (
                    <button
                      onClick={resetSubEdit}
                      className="bg-transparent border-0 cursor-pointer text-muted text-[11px] flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Reset
                    </button>
                  )}
                </HStack>

                <Box>
                  <FieldLabel>Module</FieldLabel>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => {
                      setSelectedModuleId(Number(e.target.value));
                      setSubModuleName('');
                    }}
                    className={selectClasses}
                  >
                    <option value="0">Select Module</option>
                    {modules?.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Box>

                {selectedModuleId > 0 && (
                  <Box>
                    <FieldLabel>Sub Module</FieldLabel>
                    <select
                      value={subModuleName}
                      onChange={(e) => setSubModuleName(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">Choose from Sidebar</option>
                      {getSidebarSubModules(selectedModuleId).map((sub) => (
                        <option
                          key={sub}
                          value={sub}
                        >
                          {sub}
                        </option>
                      ))}
                    </select>
                  </Box>
                )}

                <Button
                  _hover={{
                    bg: 'var(--primary-hover)',
                  }}
                  colorScheme={editingSubModuleId ? 'orange' : 'green'}
                  onClick={handleSaveSubModule}
                  disabled={!subModuleName.trim() || !selectedModuleId}
                  className="bg-brand text-white min-h-control h-9.5 rounded-lg font-normal text-sm w-full"
                >
                  <HStack className="gap-1.5">
                    {editingSubModuleId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingSubModuleId ? 'Update' : 'Create'}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack
                className="pl-5 pr-5 pt-3.5 pb-3.5 border-b border-[#F1F5F9] justify-between"
              >
                <Text
                  className="font-normal text-sm text-gray-600"
                >
                  All Sub Modules
                </Text>
                <Badge
                  colorPalette="green"
                  className="pl-2.5 pr-2.5 pt-0.5 pb-0.5 rounded-full text-[11px]"
                >
                  {subModules?.length} records
                </Badge>
              </HStack>
              <StyledTable
                headers={['#', 'Sub Module', 'Module', 'Actions']}
                empty={subModules.length === 0}
              >
                {subModules?.map((item, idx) => (
                  <Table.Row
                    key={item.id}
                    _hover={{
                      bg: 'gray.50',
                    }}
                    className="transition-colors duration-150"
                  >
                    <Table.Cell
                      className="text-gray-400 text-xs w-10"
                    >
                      {idx + 1}
                    </Table.Cell>
                    <Table.Cell className="font-normal text-sm">
                      {item.name}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette="blue"
                        className="pl-2.5 pr-2.5 pt-0.5 pb-0.5 rounded-full text-[11px]"
                      >
                        {modules.find((m) => m.id === item.moduleId)?.name}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack className="gap-1.5">
                        <ActionButton
                          onClick={() => {
                            setEditingSubModuleId(item.id);
                            setSubModuleName(item.name);
                          }}
                          className="text-[#2563EB]"
                        >
                          <Pencil size={12} />
                        </ActionButton>
                        <ActionButton
                          onClick={() => deleteSubModule(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 size={12} />
                        </ActionButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </StyledTable>
            </DataPanel>
          </HStack>
        )}

        {/* ── CONTENT TAB ────────────────────────────────────────────────── */}
        {activeTab === 'content' && (
          <HStack
            className="flex max-lg:flex-col max-lg:items-stretch items-start gap-3"
          >
            {/* LEFT: Form */}
            <FormPanel>
              <VStack className="items-stretch gap-4">
                <HStack
                  className="justify-between items-center"
                >
                  <Text
                    className="font-normal text-sm text-gray-700"
                  >
                    {editingContentId ? 'Edit Content' : 'New Content'}
                  </Text>
                  {editingContentId && (
                    <button
                      onClick={resetContentEdit}
                      className="bg-transparent border-0 cursor-pointer text-muted text-[11px] flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Reset
                    </button>
                  )}
                </HStack>

                <Box>
                  <FieldLabel>Module</FieldLabel>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => {
                      setSelectedModuleId(Number(e.target.value));
                      setSelectedSubModuleId(0);
                      setContentName('');
                      setSelectedContentItemIds(new Set());
                    }}
                    className={selectClasses}
                  >
                    <option value="0">Select Module</option>
                    {modules?.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Box>

                {selectedModuleId > 0 && (
                  <Box>
                    <FieldLabel>
                      Sub Module{' '}
                      <span
                        className="text-muted font-normal normal-case tracking-normal"
                      >
                        (optional)
                      </span>
                    </FieldLabel>
                    <select
                      value={selectedSubModuleId}
                      onChange={(e) => {
                        setSelectedSubModuleId(Number(e.target.value));
                        setContentName('');
                        setSelectedContentItemIds(new Set());
                      }}
                      className={selectClasses}
                    >
                      <option value="0">None</option>
                      {subModules.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </Box>
                )}

                {/* Checkbox picker */}
                {selectedModuleId > 0 &&
                  (() => {
                    const mod = modules.find((m) => m.id === selectedModuleId);
                    const section = mod ? getMenuSection(mod.name) : null;
                    const directItems = Object.values(section ?? {}).filter(
                      (v): v is DirectMenuItem => 'type' in v && v?.type === 'direct',
                    );
                    const groups = Object.values(section ?? {}).filter(
                      (v): v is MenuGroup => 'items' in v && Array.isArray(v?.items),
                    );
                    const showPicker =
                      directItems.length > 0 ||
                      (groups.length > 0 && selectedSubModuleId > 0);
                    if (!showPicker) return null;
                    const items = getSidebarItems(selectedModuleId, selectedSubModuleId);
                    const selectedCount = items.filter((i) =>
                      selectedContentItemIds.has(i.id),
                    ).length;
                    return (
                      <Box>
                        <FieldLabel>
                          Select Items
                          {selectedCount > 0 && (
                            <span
                              className="ml-1.5 bg-[#7C3AED] text-white rounded-xl py-0.25 px-1.75 text-[11px]"
                            >
                              {selectedCount}
                            </span>
                          )}
                        </FieldLabel>
                        <Box
                          className="border border-[#E2E8F0] rounded-lg max-h-50 overflow-y-auto bg-[#FAFAFA]"
                        >
                          {items.length > 0 ? (
                            <VStack
                              className="items-stretch gap-0 p-2"
                            >
                              {items.map((item) => {
                                const checked = selectedContentItemIds.has(item.id);
                                return (
                                  <label
                                    key={item.id}
                                    style={{
                                      background: checked ? '#EDE9FE' : 'transparent',
                                      color: checked ? '#5B21B6' : '#374151',
                                      fontWeight: checked ? 600 : 400,
                                    }}
                                    className="flex items-center gap-2 cursor-pointer py-1.25 px-2 rounded-md text-xs transition-all duration-150"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleContentItem(item.id)}
                                      className="accent-[#8B5CF6] w-3.25 h-3.25"
                                    />
                                    {item.label}
                                  </label>
                                );
                              })}
                            </VStack>
                          ) : (
                            <Text
                              className="text-gray-400 text-xs text-center pt-4 pb-4"
                            >
                              No items available
                            </Text>
                          )}
                        </Box>
                      </Box>
                    );
                  })()}

                <Button
                  _hover={{
                    bg: 'var(--primary-hover)',
                  }}
                  colorScheme={editingContentId ? 'orange' : 'purple'}
                  onClick={handleSaveContent}
                  disabled={
                    !selectedModuleId ||
                    (editingContentId
                      ? !contentName.trim()
                      : selectedContentItemIds.size === 0)
                  }
                  className="bg-brand text-white min-h-control h-9.5 rounded-lg font-normal text-sm w-full"
                >
                  <HStack className="gap-1.5">
                    {editingContentId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingContentId ? 'Update' : 'Create'}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack
                className="pl-5 pr-5 pt-3.5 pb-3.5 border-b border-[#F1F5F9] justify-between"
              >
                <Text
                  className="font-normal text-sm text-gray-600"
                >
                  All Contents
                </Text>
                <Badge
                  colorPalette="purple"
                  className="pl-2.5 pr-2.5 pt-0.5 pb-0.5 rounded-full text-[11px]"
                >
                  {contents.length} records
                </Badge>
              </HStack>
              <StyledTable
                headers={['#', 'Content Name', 'Sub Module', 'Actions']}
                empty={contents.length === 0}
              >
                {contents.map((item, idx) => {
                  const subModuleName = item.subModuleId
                    ? subModules.find((s) => s.id === item.subModuleId)?.name
                    : null;
                  return (
                    <Table.Row
                      key={item.id}
                      _hover={{
                        bg: 'gray.50',
                      }}
                      className="transition-colors duration-150"
                    >
                      <Table.Cell
                        className="text-gray-400 text-xs w-10"
                      >
                        {idx + 1}
                      </Table.Cell>
                      <Table.Cell className="font-normal text-sm">
                        {item.name}
                      </Table.Cell>
                      <Table.Cell>
                        {subModuleName ? (
                          <Badge
                            colorPalette="purple"
                            className="pl-2.5 pr-2.5 pt-0.5 pb-0.5 rounded-full text-[11px]"
                          >
                            {subModuleName}
                          </Badge>
                        ) : (
                          <Text
                            className="text-xs text-gray-400"
                          >
                            —
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <HStack className="gap-1.5">
                          <ActionButton
                            onClick={() => {
                              setEditingContentId(item.id);
                              setContentName(item.name);
                            }}
                            className="text-[#2563EB]"
                          >
                            <Pencil size={12} />
                          </ActionButton>
                          <ActionButton
                            onClick={() => deleteContent(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 size={12} />
                          </ActionButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </StyledTable>
            </DataPanel>
          </HStack>
        )}

        {/* ── VIEW TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'view' && (
          <Box>
            <Box
              className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <HStack
                className="pl-5 pr-5 pt-4 pb-4 justify-between border-b border-[#F1F5F9] [background:linear-gradient(90deg,#F8FAFC,#FFFFFF)]"
              >
                <Box>
                  <Text
                    className="font-normal text-base text-gray-700"
                  >
                    Module Hierarchy
                  </Text>
                  <Text
                    className="text-xs text-gray-400"
                  >
                    Expand modules and sub modules to explore contents
                  </Text>
                </Box>

                <Badge
                  colorPalette="orange"
                  className="pl-3 pr-3 pt-1 pb-1 rounded-full text-[11px] font-normal"
                >
                  {menu.length} Modules
                </Badge>
              </HStack>

              {/* Body */}
              <VStack
                className="items-stretch gap-3 p-4"
              >
                {menu.length === 0 && (
                  <Box
                    className="pt-12 pb-12 text-center"
                  >
                    <Text
                      className="text-gray-400 text-sm"
                    >
                      No hierarchy data available
                    </Text>
                  </Box>
                )}

                {menu.map((mod) => {
                  const modExpanded = expandedModules.has(mod.id);
                  return (
                    <Box
                      key={mod.id}
                      borderColor={modExpanded ? '#BFDBFE' : 'gray.100'}
                      boxShadow={
                        modExpanded
                          ? '0 6px 18px rgba(37,99,235,0.08)'
                          : '0 1px 4px rgba(0,0,0,0.03)'
                      }
                      className="border rounded-lg overflow-hidden transition-all duration-200"
                    >
                      {/* MODULE HEADER */}
                      <HStack
                        bg={
                          modExpanded ? 'linear-gradient(90deg,#EFF6FF,#F8FBFF)' : 'white'
                        }
                        _hover={{
                          bg: '#F8FAFC',
                        }}
                        onClick={() =>
                          setExpandedModules(toggle(expandedModules, mod.id))
                        }
                        className="pl-4 pr-4 pt-3 pb-3 justify-between cursor-pointer transition-all duration-200"
                      >
                        <HStack className="items-start gap-3">
                          <Box
                            className="p-2 bg-[#DBEAFE] text-[#2563EB] rounded-lg mt-0.25"
                          >
                            <Database size={15} />
                          </Box>

                          <Box>
                            <HStack className="gap-2 mb-1">
                              <Text
                                className="font-normal text-base text-ink"
                              >
                                {mod.name}
                              </Text>

                              <Badge
                                colorPalette="blue"
                                className="rounded-full text-[11px] pl-2 pr-2"
                              >
                                {mod.subModule.length} Sub
                              </Badge>

                              <Badge
                                colorPalette="purple"
                                className="rounded-full text-[11px] pl-2 pr-2"
                              >
                                {mod.moduleContent.length +
                                  mod.subModule.reduce(
                                    (acc, s) => acc + s.moduleContent.length,
                                    0,
                                  )}{' '}
                                Contents
                              </Badge>
                            </HStack>

                            <Text
                              className="text-[11px] text-gray-500"
                            >
                              Click to expand hierarchy details
                            </Text>
                          </Box>
                        </HStack>

                        <Box
                          transform={modExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}
                          className="transition-all duration-250 text-[#2563EB]"
                        >
                          <ChevronDown size={18} />
                        </Box>
                      </HStack>

                      {/* MODULE CONTENT */}
                      {modExpanded && (
                        <Box
                          className="pl-4 pr-4 pb-4 bg-[#FCFCFD] border-t border-[#EEF2F7]"
                        >
                          {/* DIRECT CONTENTS */}
                          {mod.moduleContent.length > 0 && (
                            <Box
                              className="mb-4 mt-4"
                            >
                              <Text
                                className="text-[11px] font-normal text-gray-400 uppercase mb-2 tracking-wide"
                              >
                                Direct Contents
                              </Text>

                              <HStack className="flex-wrap gap-2">
                                {mod.moduleContent.map((c) => (
                                  <Badge
                                    key={c.id}
                                    className="pl-3 pr-3 pt-1 pb-1 rounded-full bg-[#F3E8FF] text-[#6B21A8] text-[11px] font-normal"
                                  >
                                    {c.name}
                                  </Badge>
                                ))}
                              </HStack>
                            </Box>
                          )}

                          {/* SUB MODULES */}
                          <VStack className="items-stretch gap-3">
                            {mod.subModule.map((sub) => {
                              const subExpanded = expandedSubModules.has(sub.id);
                              return (
                                <Box
                                  key={sub.id}
                                  borderColor={subExpanded ? '#A7F3D0' : '#E5E7EB'}
                                  className="border rounded-lg overflow-hidden bg-white"
                                >
                                  {/* SUB HEADER */}
                                  <HStack
                                    bg={subExpanded ? '#ECFDF5' : 'white'}
                                    _hover={{
                                      bg: '#F9FAFB',
                                    }}
                                    onClick={() =>
                                      setExpandedSubModules(
                                        toggle(expandedSubModules, sub.id),
                                      )
                                    }
                                    className="pl-3 pr-3 pt-2.5 pb-2.5 justify-between cursor-pointer transition-all duration-200"
                                  >
                                    <HStack className="gap-2">
                                      <Box
                                        className="p-1.5 bg-[#D1FAE5] text-[#059669] rounded-xl"
                                      >
                                        <Layers size={12} />
                                      </Box>

                                      <Box>
                                        <Text
                                          className="text-xs font-normal text-gray-700"
                                        >
                                          {sub.name}
                                        </Text>

                                        <Text
                                          className="text-[11px] text-gray-400"
                                        >
                                          {sub.moduleContent.length} contents
                                        </Text>
                                      </Box>
                                    </HStack>

                                    <HStack className="gap-2">
                                      <Badge
                                        colorPalette="green"
                                        className="rounded-full pl-2 pr-2 text-[11px]"
                                      >
                                        {sub.moduleContent.length}
                                      </Badge>

                                      <Box
                                        transform={
                                          subExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                                        }
                                        className="transition-all duration-250 text-[#059669]"
                                      >
                                        <ChevronDown size={15} />
                                      </Box>
                                    </HStack>
                                  </HStack>

                                  {/* SUB CONTENTS */}
                                  {subExpanded && (
                                    <Box
                                      className="pl-4 pr-4 pt-3 pb-3 border-t border-[#F3F4F6] bg-[#FAFAFA]"
                                    >
                                      {sub.moduleContent.length > 0 ? (
                                        <Grid
                                          className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
                                        >
                                          {sub.moduleContent.map((c) => (
                                            <HStack
                                              key={c.id}
                                              className="pl-3 pr-3 pt-2 pb-2 bg-white border border-gray-100 rounded-lg justify-between"
                                            >
                                              <HStack className="gap-2">
                                                <Box
                                                  className="w-1.75 h-1.75 bg-[#8B5CF6] rounded-full"
                                                />
                                                <Text
                                                  className="text-xs font-normal text-gray-700"
                                                >
                                                  {c.name}
                                                </Text>
                                              </HStack>

                                              <FileText
                                                size={12}
                                                className="text-[#8B5CF6]"
                                              />
                                            </HStack>
                                          ))}
                                        </Grid>
                                      ) : (
                                        <Box
                                          className="text-center pt-4 pb-4 text-gray-400 text-xs"
                                        >
                                          No contents available
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </VStack>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

// ─── Shared Table wrapper ──────────────────────────────────────────────────

function StyledTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row className="bg-gray-50">
          {headers.map((h) => (
            <Table.ColumnHeader
              key={h}
              className="text-[11px] font-normal text-gray-400 uppercase tracking-wide pt-2.5 pb-2.5 pl-4 pr-4"
            >
              {h}
            </Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {empty ? (
          <Table.Row>
            <Table.Cell
              colSpan={headers.length}
              className="text-center pt-10 pb-10 text-gray-400 text-sm"
            >
              No records found
            </Table.Cell>
          </Table.Row>
        ) : (
          children
        )}
      </Table.Body>
    </Table.Root>
  );
}
