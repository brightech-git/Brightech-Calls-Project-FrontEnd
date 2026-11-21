'use client';

import { useState } from 'react';
import {
  Database,
  Layers,
  FileText,
  Pencil,
  Trash2,
  ChevronRight,
  Eye,
  Plus,
  RotateCcw,
  Check,
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
import { useSidebar, type DirectMenuItem, type MenuGroup } from '@/src/context/layout/SideBarContext';
import { menuConfig } from '@/src/config/menu/menuConfig';
import { labelFor } from '@/src/config/menu/menuLabels';
import { toastError } from '@/src/components/toast/toast';
import { cn } from '@/lib/utils';
import {
  buttonClass,
  buttonVariants,
  cardClass,
  controlClass,
  iconButtonClass,
  labelClass,
} from '@/lib/styles';

// Module options come straight from the static sidebar config — the value
// stored (and sent to the API as `name`) is always the stable `id` slug,
// never the display label.
const moduleOptions = menuConfig.map((m) => ({
  label: m.label,
  value: m.id,
}));

// ─── Types ──────────────────────────────────────────────────────────────────

type TabKey = 'module' | 'submodule' | 'content' | 'view';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  hint: string;
}[] = [
  {
    key: 'module',
    label: 'Modules',
    icon: <Database size={14} />,
    hint: 'Top-level sidebar sections',
  },
  {
    key: 'submodule',
    label: 'Sub modules',
    icon: <Layers size={14} />,
    hint: 'Groups inside a module',
  },
  {
    key: 'content',
    label: 'Contents',
    icon: <FileText size={14} />,
    hint: 'Pages users can open',
  },
  {
    key: 'view',
    label: 'Structure',
    icon: <Eye size={14} />,
    hint: 'Full tree preview',
  },
];

// ─── Small building blocks ──────────────────────────────────────────────────

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(cardClass, 'min-w-0 overflow-hidden', className)}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
      {children}
    </span>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function FormPanel({
  title,
  editing,
  onReset,
  children,
}: {
  title: string;
  editing: boolean;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <Panel
      title={editing ? `Edit ${title}` : `New ${title}`}
      className="w-80 shrink-0 self-start max-lg:w-full lg:sticky lg:top-0"
      action={
        editing && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
          >
            <RotateCcw size={11} /> Cancel edit
          </button>
        )
      }
    >
      <div className="grid gap-3 p-3">{children}</div>
    </Panel>
  );
}

function SaveButton({
  editing,
  disabled,
  onClick,
  label,
}: {
  editing: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(buttonClass, buttonVariants.primary, 'w-full')}
    >
      {editing ? <Check size={14} /> : <Plus size={14} />}
      {editing ? `Update ${label}` : `Add ${label}`}
    </button>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        aria-label="Edit"
        title="Edit"
        onClick={onEdit}
        className={cn(iconButtonClass, 'hover:border-brand hover:text-brand')}
      >
        <Pencil size={12} />
      </button>
      <button
        type="button"
        aria-label="Delete"
        title="Delete"
        onClick={onDelete}
        className={cn(
          iconButtonClass,
          'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600',
        )}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function SimpleTable({
  headers,
  empty,
  emptyText = 'No records yet',
  children,
}: {
  headers: string[];
  empty: boolean;
  emptyText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={h}
                className={cn(
                  'border-b border-line bg-gray-50 px-3 py-2 text-left text-[11px] font-semibold tracking-wide whitespace-nowrap text-ink uppercase',
                  i === 0 && 'w-10',
                  i === headers.length - 1 && 'w-20 text-right',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="px-3 py-8 text-center text-muted">
                {emptyText}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

const tdClass = 'border-t border-line px-3 py-row align-middle text-ink';

function Pill({
  tone = 'gray',
  children,
}: {
  tone?: 'gray' | 'green' | 'red' | 'blue';
  children: React.ReactNode;
}) {
  const tones = {
    gray: 'bg-gray-100 text-ink',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    blue: 'bg-brand-soft text-brand',
  };
  return (
    <span
      className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold', tones[tone])}
    >
      {children}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function NavigationModulePage() {
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
  const [selectedContentItemIds, setSelectedContentItemIds] = useState<Set<string>>(new Set());
  const toggle = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  // ── API ──────────────────────────────────────────────────────────────────

  const { data: menu = [] } = useMenu();
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
      if (group && Array.isArray((group as Partial<MenuGroup>).items)) {
        return (group as MenuGroup).items.filter((i): i is DirectMenuItem => i.type === 'direct');
      }
    }
    return [];
  };
  const toggleContentItem = (id: string) => {
    setSelectedContentItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalContents = (mod: (typeof menu)[number]) =>
    mod.moduleContent.length + mod.subModule.reduce((acc, s) => acc + s.moduleContent.length, 0);

  const moduleSelect = (onChange: (id: number) => void) => (
    <Field label="Module">
      <select
        value={selectedModuleId}
        onChange={(e) => onChange(Number(e.target.value))}
        className={controlClass}
      >
        <option value="0">Select module</option>
        {modules.map((item) => (
          <option key={item.id} value={item.id}>
            {labelFor(item.name)}
          </option>
        ))}
      </select>
    </Field>
  );

  // Content picker: direct items of the module, or the items of the chosen sub module.
  const renderContentPicker = () => {
    if (!selectedModuleId || editingContentId) return null;
    const mod = modules.find((m) => m.id === selectedModuleId);
    const section = mod ? getMenuSection(mod.name) : null;
    const values = Object.values(section ?? {});
    const directItems = values.filter(
      (v): v is DirectMenuItem => 'type' in v && v?.type === 'direct',
    );
    const groups = values.filter((v): v is MenuGroup => 'items' in v && Array.isArray(v?.items));
    if (!(directItems.length > 0 || (groups.length > 0 && selectedSubModuleId > 0))) return null;
    const items = getSidebarItems(selectedModuleId, selectedSubModuleId);
    const selectedCount = items.filter((i) => selectedContentItemIds.has(i.id)).length;
    const allSelected = items.length > 0 && selectedCount === items.length;
    return (
      <div className="grid gap-1">
        <div className="flex items-center justify-between">
          <span className={labelClass}>
            Pages{' '}
            {selectedCount > 0 && <span className="text-brand">({selectedCount} selected)</span>}
          </span>
          {items.length > 0 && (
            <button
              type="button"
              className="text-[11px] font-semibold text-brand hover:underline"
              onClick={() =>
                setSelectedContentItemIds(allSelected ? new Set() : new Set(items.map((i) => i.id)))
              }
            >
              {allSelected ? 'Clear' : 'Select all'}
            </button>
          )}
        </div>
        <div className="max-h-56 overflow-y-auto rounded-md border border-line">
          {items.length > 0 ? (
            items.map((item) => {
              const checked = selectedContentItemIds.has(item.id);
              return (
                <label
                  key={item.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 border-b border-line px-2.5 py-1.5 text-[13px] last:border-b-0 hover:bg-gray-50',
                    checked && 'bg-brand-soft font-semibold text-brand hover:bg-brand-soft',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleContentItem(item.id)}
                    className="size-3.5 accent-brand"
                  />
                  {item.label}
                </label>
              );
            })
          ) : (
            <p className="px-3 py-4 text-center text-xs text-muted">No pages in this section</p>
          )}
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Navigation modules</h1>
          <p className="text-xs text-muted">
            Build the sidebar: modules, their sub modules, and the pages inside them.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-ink">
          <span className="rounded-md border border-line px-2.5 py-1">
            <strong>{modules.length}</strong> modules
          </span>
          <span className="rounded-md border border-line px-2.5 py-1">
            <strong>{menu.reduce((a, m) => a + m.subModule.length, 0)}</strong> sub modules
          </span>
          <span className="rounded-md border border-line px-2.5 py-1">
            <strong>{menu.reduce((a, m) => a + totalContents(m), 0)}</strong> contents
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Navigation structure"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={tab.hint}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-[13px] whitespace-nowrap text-muted transition-colors hover:text-ink',
                isActive && 'border-brand font-semibold text-brand hover:text-brand',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── MODULES ─────────────────────────────────────────────────────── */}
      {activeTab === 'module' && (
        <div className="flex items-start gap-3 max-lg:flex-col max-lg:items-stretch">
          <FormPanel title="module" editing={!!editingModuleId} onReset={resetModuleEdit}>
            <Field label="Sidebar section">
              <select
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className={controlClass}
              >
                <option value="">Choose a section</option>
                {moduleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <SaveButton
              label="module"
              editing={!!editingModuleId}
              disabled={!moduleName}
              onClick={handleSaveModule}
            />
          </FormPanel>

          <Panel
            className="flex-1"
            title={
              <>
                Modules <Count>{modules.length}</Count>
              </>
            }
          >
            <SimpleTable
              headers={['#', 'Module', 'Key', 'Status', 'Actions']}
              empty={modules.length === 0}
            >
              {modules.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn('hover:bg-gray-50', editingModuleId === item.id && 'bg-brand-soft')}
                >
                  <td className={cn(tdClass, 'text-muted')}>{idx + 1}</td>
                  <td className={cn(tdClass, 'font-semibold')}>{labelFor(item.name)}</td>
                  <td className={cn(tdClass, 'text-xs text-muted')}>{item.name}</td>
                  <td className={tdClass}>
                    <Pill tone={item.active ? 'green' : 'red'}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Pill>
                  </td>
                  <td className={tdClass}>
                    <RowActions
                      onEdit={() => {
                        setEditingModuleId(item.id);
                        setModuleName(item.name);
                      }}
                      onDelete={() => deleteModule(item.id)}
                    />
                  </td>
                </tr>
              ))}
            </SimpleTable>
          </Panel>
        </div>
      )}

      {/* ── SUB MODULES ─────────────────────────────────────────────────── */}
      {activeTab === 'submodule' && (
        <div className="flex items-start gap-3 max-lg:flex-col max-lg:items-stretch">
          <FormPanel title="sub module" editing={!!editingSubModuleId} onReset={resetSubEdit}>
            {moduleSelect((id) => {
              setSelectedModuleId(id);
              setSubModuleName('');
            })}
            {selectedModuleId > 0 && (
              <Field label="Sidebar group">
                <select
                  value={subModuleName}
                  onChange={(e) => setSubModuleName(e.target.value)}
                  className={controlClass}
                >
                  <option value="">Choose a group</option>
                  {getSidebarSubModules(selectedModuleId).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <SaveButton
              label="sub module"
              editing={!!editingSubModuleId}
              disabled={!subModuleName.trim() || !selectedModuleId}
              onClick={handleSaveSubModule}
            />
          </FormPanel>

          <Panel
            className="flex-1"
            title={
              <>
                Sub modules <Count>{subModules.length}</Count>
              </>
            }
            subtitle={
              selectedModuleId ? undefined : 'Pick a module on the left to see its sub modules'
            }
          >
            <SimpleTable
              headers={['#', 'Sub module', 'Module', 'Actions']}
              empty={subModules.length === 0}
              emptyText={selectedModuleId ? 'No sub modules yet' : 'Select a module first'}
            >
              {subModules.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn(
                    'hover:bg-gray-50',
                    editingSubModuleId === item.id && 'bg-brand-soft',
                  )}
                >
                  <td className={cn(tdClass, 'text-muted')}>{idx + 1}</td>
                  <td className={cn(tdClass, 'font-semibold')}>{item.name}</td>
                  <td className={tdClass}>
                    <Pill tone="blue">
                      {labelFor(modules.find((m) => m.id === item.moduleId)?.name ?? '')}
                    </Pill>
                  </td>
                  <td className={tdClass}>
                    <RowActions
                      onEdit={() => {
                        setEditingSubModuleId(item.id);
                        setSubModuleName(item.name);
                      }}
                      onDelete={() => deleteSubModule(item.id)}
                    />
                  </td>
                </tr>
              ))}
            </SimpleTable>
          </Panel>
        </div>
      )}

      {/* ── CONTENTS ────────────────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="flex items-start gap-3 max-lg:flex-col max-lg:items-stretch">
          <FormPanel title="content" editing={!!editingContentId} onReset={resetContentEdit}>
            {moduleSelect((id) => {
              setSelectedModuleId(id);
              setSelectedSubModuleId(0);
              setContentName('');
              setSelectedContentItemIds(new Set());
            })}
            {selectedModuleId > 0 && (
              <Field
                label={
                  <>
                    Sub module <span className="font-normal text-muted">(optional)</span>
                  </>
                }
              >
                <select
                  value={selectedSubModuleId}
                  onChange={(e) => {
                    setSelectedSubModuleId(Number(e.target.value));
                    setContentName('');
                    setSelectedContentItemIds(new Set());
                  }}
                  className={controlClass}
                >
                  <option value="0">None (direct pages)</option>
                  {subModules.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {editingContentId && (
              <Field label="Content key">
                <input
                  value={contentName}
                  onChange={(e) => setContentName(e.target.value)}
                  className={controlClass}
                />
              </Field>
            )}
            {renderContentPicker()}
            <SaveButton
              label={editingContentId ? 'content' : 'selected pages'}
              editing={!!editingContentId}
              disabled={
                !selectedModuleId ||
                (editingContentId ? !contentName.trim() : selectedContentItemIds.size === 0)
              }
              onClick={handleSaveContent}
            />
          </FormPanel>

          <Panel
            className="flex-1"
            title={
              <>
                Contents <Count>{contents.length}</Count>
              </>
            }
            subtitle={selectedModuleId ? undefined : 'Pick a module on the left to see its pages'}
          >
            <SimpleTable
              headers={['#', 'Page', 'Key', 'Sub module', 'Actions']}
              empty={contents.length === 0}
              emptyText={selectedModuleId ? 'No pages added yet' : 'Select a module first'}
            >
              {contents.map((item, idx) => {
                const sub = item.subModuleId
                  ? subModules.find((s) => s.id === item.subModuleId)?.name
                  : null;
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-gray-50',
                      editingContentId === item.id && 'bg-brand-soft',
                    )}
                  >
                    <td className={cn(tdClass, 'text-muted')}>{idx + 1}</td>
                    <td className={cn(tdClass, 'font-semibold')}>{labelFor(item.name)}</td>
                    <td className={cn(tdClass, 'text-xs text-muted')}>{item.name}</td>
                    <td className={tdClass}>
                      {sub ? <Pill>{sub}</Pill> : <span className="text-muted">—</span>}
                    </td>
                    <td className={tdClass}>
                      <RowActions
                        onEdit={() => {
                          setEditingContentId(item.id);
                          setContentName(item.name);
                        }}
                        onDelete={() => deleteContent(item.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </SimpleTable>
          </Panel>
        </div>
      )}

      {/* ── STRUCTURE (tree) ────────────────────────────────────────────── */}
      {activeTab === 'view' && (
        <Panel
          title={
            <>
              Sidebar structure <Count>{menu.length}</Count>
            </>
          }
          subtitle="Expand a module to see its sub modules and pages"
          action={
            menu.length > 0 && (
              <button
                type="button"
                className="shrink-0 text-[11px] font-semibold whitespace-nowrap text-brand hover:underline"
                onClick={() => {
                  const all = expandedModules.size === menu.length;
                  setExpandedModules(all ? new Set() : new Set(menu.map((m) => m.id)));
                  setExpandedSubModules(
                    all ? new Set() : new Set(menu.flatMap((m) => m.subModule.map((s) => s.id))),
                  );
                }}
              >
                {expandedModules.size === menu.length ? 'Collapse all' : 'Expand all'}
              </button>
            )
          }
        >
          {menu.length === 0 ? (
            <p className="px-3 py-10 text-center text-[13px] text-muted">No modules set up yet</p>
          ) : (
            <ul className="divide-y divide-line">
              {menu.map((mod) => {
                const modOpen = expandedModules.has(mod.id);
                return (
                  <li key={mod.id}>
                    <button
                      type="button"
                      aria-expanded={modOpen}
                      onClick={() => setExpandedModules(toggle(expandedModules, mod.id))}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <ChevronRight
                        size={14}
                        className={cn(
                          'shrink-0 text-muted transition-transform',
                          modOpen && 'rotate-90',
                        )}
                      />
                      <Database size={14} className="shrink-0 text-brand" />
                      <span className="flex-1 truncate text-[13px] font-semibold text-ink">
                        {labelFor(mod.name)}
                      </span>
                      <span className="text-[11px] text-muted">
                        {mod.subModule.length} sub · {totalContents(mod)} pages
                      </span>
                    </button>
                    {modOpen && (
                      <div className="grid gap-1 border-t border-line bg-gray-50 py-2 pr-3 pl-9">
                        {mod.moduleContent.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 py-0.5 text-[13px] text-ink"
                          >
                            <FileText size={12} className="text-muted" />
                            {labelFor(c.name)}
                          </div>
                        ))}
                        {mod.subModule.map((sub) => {
                          const subOpen = expandedSubModules.has(sub.id);
                          return (
                            <div key={sub.id}>
                              <button
                                type="button"
                                aria-expanded={subOpen}
                                onClick={() =>
                                  setExpandedSubModules(toggle(expandedSubModules, sub.id))
                                }
                                className="flex w-full items-center gap-2 rounded py-0.5 text-left text-[13px] hover:text-brand"
                              >
                                <ChevronRight
                                  size={12}
                                  className={cn(
                                    'shrink-0 text-muted transition-transform',
                                    subOpen && 'rotate-90',
                                  )}
                                />
                                <Layers size={12} className="shrink-0 text-muted" />
                                <span className="font-semibold">{sub.name}</span>
                                <span className="text-[11px] text-muted">
                                  ({sub.moduleContent.length})
                                </span>
                              </button>
                              {subOpen && (
                                <div className="ml-[7px] grid gap-0.5 border-l border-line py-1 pl-5">
                                  {sub.moduleContent.length > 0 ? (
                                    sub.moduleContent.map((c) => (
                                      <div
                                        key={c.id}
                                        className="flex items-center gap-2 text-[13px] text-ink"
                                      >
                                        <FileText size={12} className="text-muted" />
                                        {labelFor(c.name)}
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted">No pages</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {mod.moduleContent.length === 0 && mod.subModule.length === 0 && (
                          <span className="text-xs text-muted">Nothing inside this module yet</span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
