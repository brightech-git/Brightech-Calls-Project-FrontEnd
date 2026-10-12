"use client";

import { ui } from "@/utils/ui";
import { useState } from "react";
import { Box, Button, Grid, VStack, Text, HStack, Badge, Table } from "@chakra-ui/react";
import { Database, Layers, FileText, Pencil, Trash2, ChevronDown, Eye, Plus, RefreshCw } from "lucide-react";
import { useModules, useMenu, useSubModules, useContents, useCreateModule, useUpdateModule, useDeleteModule, useCreateSubModule, useUpdateSubModule, useDeleteSubModule, useCreateContent, useUpdateContent, useDeleteContent } from "@/hooks/ApiHooks/RoleTran/useRoleTran";
import { useSidebar, type DirectMenuItem, type SectionDirectItem, type MenuGroup } from "@/context/layout/SideBarContext";
import { menuConfig } from "@/config/menu/menuConfig";
// import { useTheme } from "@/context/theme/themeContext";
import { toastError } from "@/components/toast/toast";

// Module options come straight from the static sidebar config — the value
// stored (and sent to the API as `name`) is always the stable `id` slug,
// never the display label.
const moduleOptions = menuConfig.map(m => ({
  label: m.label,
  value: m.id
}));

// ─── Types ──────────────────────────────────────────────────────────────────

type TabKey = "module" | "submodule" | "content" | "view";

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [{
  key: "module",
  label: "Module",
  icon: <Database size={14} />,
  color: "#2563EB",
  bg: "#EFF6FF"
}, {
  key: "submodule",
  label: "Sub Module",
  icon: <Layers size={14} />,
  color: "#059669",
  bg: "#ECFDF5"
}, {
  key: "content",
  label: "Content",
  icon: <FileText size={14} />,
  color: "#7C3AED",
  bg: "#F5F3FF"
}, {
  key: "view",
  label: "View",
  icon: <Eye size={14} />,
  color: "#D97706",
  bg: "#FFFBEB"
}];

// ─── Shared styles ──────────────────────────────────────────────────────────

const selectClasses = "h-control! w-full! cursor-pointer! rounded-lg! border! border-line! bg-white! px-3! text-sm! text-ink! outline-none! focus:border-brand! focus:ring-3! focus:ring-brand-soft!";

// ─── Sub-components ──────────────────────────────────────────────────────────

const FormPanel = ({
  children
}: {
  children: React.ReactNode;
}) => <Box className={ui("module-form-panel role-panel" + " " + "[width:340px]! [flex-shrink:0]! [background:white]! [padding:20px]! [border-radius:20px]! [border-width:1px]! [border-color:var(--color-gray-100)]! [box-shadow:0_1px_8px_rgba(0,0,0,0.05)]! [height:fit-content]! [position:sticky]! [top:20px]!")}>
    {children}
  </Box>;
const DataPanel = ({
  children
}: {
  children: React.ReactNode;
}) => <Box className={ui("module-list-panel" + " " + "[flex:1]! [min-width:0]! [background:white]! [border-radius:20px]! [border-width:1px]! [border-color:var(--color-gray-100)]! [box-shadow:0_1px_8px_rgba(0,0,0,0.05)]! [overflow:hidden]!")}>
    {children}
  </Box>;
const FieldLabel = ({
  children
}: {
  children: React.ReactNode;
}) => <Text className={ui("[font-size:var(--font-sm)]! font-normal! [color:var(--text-main)]! [margin-bottom:4px]!")}>
    {children}
  </Text>;
const ActionButton = ({
  onClick,
  color = "#2563eb",
  className = "",
  children
}: {
  onClick: () => void;
  color?: string;
  className?: string;
  children: React.ReactNode;
}) => <button onClick={onClick} style={{
  background: `${color}15`,
  color
}} onMouseEnter={e => {
  (e.currentTarget as HTMLButtonElement).style.background = `${color}25`;
}} onMouseLeave={e => {
  (e.currentTarget as HTMLButtonElement).style.background = `${color}15`;
}} className={ui(className + " [display:inline-flex] [align-items:center] [justify-content:center] [width:28px] [height:28px] [border-radius:7px] [border:none] [cursor:pointer] [transition:all_0.15s]")}>
    {children}
  </button>;

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function RoleTranPage() {
  const {
    menuData
  } = useSidebar();
  // const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>("module");
  const [moduleName, setModuleName] = useState("");
  const [subModuleName, setSubModuleName] = useState("");
  const [contentName, setContentName] = useState("");
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
  const [isDirectItem, setIsDirectItem] = useState<boolean>(false);
  const toggle = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  // ── API ──────────────────────────────────────────────────────────────────

  const {
    data: menu = []
  } = useMenu();
  console.log(menu, 'menudetails');
  const {
    data: modules = []
  } = useModules();
  const {
    data: subModules = []
  } = useSubModules(selectedModuleId);
  const {
    data: contents = []
  } = useContents(selectedModuleId, selectedSubModuleId);
  const {
    mutate: createModule
  } = useCreateModule();
  const {
    mutate: updateModule
  } = useUpdateModule();
  const {
    mutate: deleteModule
  } = useDeleteModule();
  const {
    mutate: createSubModule
  } = useCreateSubModule();
  const {
    mutate: updateSubModule
  } = useUpdateSubModule();
  const {
    mutate: deleteSubModule
  } = useDeleteSubModule();
  const {
    mutate: createContent
  } = useCreateContent();
  const {
    mutate: updateContent
  } = useUpdateContent();
  const {
    mutate: deleteContent
  } = useDeleteContent();

  // ── Handlers ──────────────────────────────────────────────────────────────

  // moduleName holds a menuConfig `id` (e.g. "master"), not the display label —
  // that id is what gets stored via the API, matching moduleOptions above.
  const handleSaveModule = () => {
    if (!moduleName) return;
    if (modules.some(m => m.name === moduleName && m.id !== editingModuleId)) {
      return toastError("Already Added Module");
    }
    if (editingModuleId) {
      updateModule({
        id: editingModuleId,
        body: {
          name: moduleName,
          displayOrder: 1,
          active: true
        }
      });
      setEditingModuleId(null);
    } else {
      createModule({
        name: moduleName,
        displayOrder: 1
      });
    }
    setModuleName("");
  };
  const handleSaveSubModule = () => {
    if (!subModuleName.trim() || !selectedModuleId) return;
    if (subModules.some(m => m.name.toLowerCase() === subModuleName.toLowerCase() && m.moduleId === Number(selectedModuleId))) {
      return toastError("Already Added Sub Module");
    }
    if (editingSubModuleId) {
      updateSubModule({
        id: editingSubModuleId,
        body: {
          name: subModuleName,
          displayOrder: 1,
          active: true
        }
      });
      setEditingSubModuleId(null);
    } else {
      createSubModule({
        moduleId: selectedModuleId,
        body: {
          name: subModuleName,
          displayOrder: 1
        }
      });
    }
    setSubModuleName("");
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
          active: true
        }
      });
      setEditingContentId(null);
      setContentName("");
      return;
    }

    // Creating: names come from whichever sidebar items are checked, looked
    // up by id — not typed in, and not matched by label.
    const items = getSidebarItems(selectedModuleId, selectedSubModuleId);
    const selectedItems = items.filter(i => selectedContentItemIds.has(i.id));
    if (!selectedItems.length) return;
    selectedItems.forEach((item, i) => createContent({
      moduleId: selectedModuleId,
      subModuleId: selectedSubModuleId > 0 ? selectedSubModuleId : undefined,
      body: {
        name: item.id,
        displayOrder: i + 1
      }
    }));
    setSelectedContentItemIds(new Set());
  };
  const resetModuleEdit = () => {
    setEditingModuleId(null);
    setModuleName("");
  };
  const resetSubEdit = () => {
    setEditingSubModuleId(null);
    setSubModuleName("");
  };
  const resetContentEdit = () => {
    setEditingContentId(null);
    setContentName("");
  };

  // ── Sidebar helpers ───────────────────────────────────────────────────────

  // Module.name stores a menuConfig `id` (e.g. "master"), but menuData is
  // still keyed by the config entry's display label — resolve id -> label
  // before indexing into it.
  const getMenuSection = (moduleConfigId: string) => {
    const entry = menuConfig.find(m => m.id === moduleConfigId);
    if (!entry) return null;
    return menuData[entry.label] ?? null;
  };
  const getSidebarSubModules = (moduleId: number): string[] => {
    const apiModule = modules.find(m => m.id === moduleId);
    if (!apiModule) return [];
    const section = getMenuSection(apiModule.name);
    if (!section) return [];

    // Return only group names (keys where the value is a MenuGroup, not a direct item)
    return Object.entries(section).filter(([, val]) => !("type" in val)) // MenuGroup has no `type`
    .map(([key]) => key);
  };
  const getSidebarItems = (moduleId: number, subModuleId: number): DirectMenuItem[] => {
    const apiModule = modules.find(m => m.id === moduleId);
    const apiSubModule = subModules.find(s => s.id === subModuleId);
    if (!apiModule) return [];
    const section = getMenuSection(apiModule.name);
    if (!section) return [];
    const values = Object.values(section);
    const directItems = values.filter((v): v is DirectMenuItem => "type" in v && v.type === "direct");

    // CASE 1: no submodule → show direct only
    if (!subModuleId) {
      return directItems;
    }

    // CASE 2: submodule selected → show group items
    if (apiSubModule) {
      const group = section[apiSubModule.name];
      if (group && Array.isArray((group as any).items)) {
        return (group as MenuGroup).items.filter((i): i is DirectMenuItem => i.type === "direct");
      }
    }
    return [];
  };
  const toggleContentItem = (id: string) => {
    setSelectedContentItemIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const activeConfig = TABS.find(t => t.key === activeTab)!;

  // ─── Render ────────────────────────────────────────────────────────────────

  return <Box className={ui("role-workspace")}>
      <VStack className={ui("[align-items:stretch]! [gap:8px]!")}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <Box className={ui("[background:white]! [padding:8px]! [border-radius:20px]! [border-width:1px]! [border-color:var(--color-gray-100)]! [box-shadow:0_1px_8px_rgba(0,0,0,0.05)]! [position:relative]! [overflow:hidden]!")}>
          <Box bg={activeConfig.color} borderLeftRadius="xl" className={ui("[position:absolute]!")} />
          <HStack className={ui("[justify-content:space-between]! [align-items:center]!")}>
            <Box>
              <Text className={ui("[font-size:var(--font-xl)]! font-normal! [color:var(--color-gray-800)]!")}>
                Navigation structure
              </Text>
              <Text className={ui("[color:var(--color-gray-400)]! [font-size:12.5px]!")}>
                Manage Modules, Sub Modules & Contents
              </Text>
            </Box>
            <Badge colorPalette="blue" className={ui("[padding-left:12px]! [padding-right:12px]! [padding-top:4px]! [padding-bottom:4px]! [border-radius:9999px]! [font-size:11px]! font-normal!")}>
              {modules.length} Modules
            </Badge>
          </HStack>
        </Box>

        {/* ── TABS ───────────────────────────────────────────────────────── */}
        <Box className={ui("module-tab-strip" + " " + "[background:white]! [padding-left:8px]! [padding-right:8px]! [padding-top:6px]! [padding-bottom:6px]! [border-radius:20px]! [border-width:1px]! [border-color:var(--color-gray-100)]! [box-shadow:0_1px_8px_rgba(0,0,0,0.05)]!")}>
          <HStack role="tablist" aria-label="Navigation structure" className={ui("[gap:4px]!")}>
            {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return <Box as="button" role="tab" aria-selected={isActive} key={tab.key} bg={isActive ? tab.color : "transparent"} color={isActive ? "white" : "gray.500"} _hover={{
              bg: isActive ? tab.color : tab.bg,
              color: isActive ? "white" : "gray.700"
            }} onClick={() => setActiveTab(tab.key)} className={ui("[flex:1]! [padding-left:12px]! [padding-right:12px]! [padding-top:8px]! [padding-bottom:8px]! [border-radius:14px]! [cursor:pointer]! [transition:all_0.2s]!")}>
                  <HStack className={ui("[justify-content:center]! [gap:6px]!")}>
                    {tab.icon}
                    <Text fontWeight={isActive ? "700" : "500"} className={ui("[font-size:13px]!")}>{tab.label}</Text>
                  </HStack>
                </Box>;
          })}
          </HStack>
        </Box>

        {/* ── MODULE TAB ─────────────────────────────────────────────────── */}
        {activeTab === "module" && <HStack className={ui("module-columns" + " " + "[align-items:flex-start]! [gap:24px]!")}>
            {/* LEFT: Form */}
            <FormPanel>
              <VStack className={ui("[align-items:stretch]! [gap:16px]!")}>
                <HStack className={ui("[justify-content:space-between]! [align-items:center]!")}>
                  <Text className={ui("font-normal! [font-size:13.5px]! [color:var(--color-gray-700)]!")}>
                    {editingModuleId ? "Edit Module" : "New Module"}
                  </Text>
                  {editingModuleId && <button onClick={resetModuleEdit} className={ui("[background:none] [border:none] [cursor:pointer] [color:#9CA3AF] [font-size:11px] [display:flex] [align-items:center] [gap:4px]")}>
                      <RefreshCw size={11} /> Reset
                    </button>}
                </HStack>

                <Box>
                  <FieldLabel>Select Module</FieldLabel>
                  <select value={moduleName} onChange={e => setModuleName(e.target.value)} className={selectClasses}>
                    <option value="">Choose from Sidebar</option>
                    {moduleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </Box>

                <Button _hover={{
              bg: "var(--primary-hover)"
            }} colorScheme={editingModuleId ? "orange" : "blue"} onClick={handleSaveModule}
            // disabled={!moduleName.trim()}
            className={ui("[background:var(--primary)]! [color:white]! [min-height:var(--control-height)]! [height:38px]! [border-radius:8px]! font-normal! [font-size:13px]! [width:100%]!")}>
                  <HStack className={ui("[gap:6px]!")}>
                    {editingModuleId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingModuleId ? "Update Module" : "Create Module"}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack className={ui("[padding-left:20px]! [padding-right:20px]! [padding-top:14px]! [padding-bottom:14px]! [border-bottom:1px_solid_#F1F5F9]! [justify-content:space-between]!")}>
                <Text className={ui("font-normal! [font-size:13px]! [color:var(--color-gray-600)]!")}>All Modules</Text>
                <Badge colorPalette="blue" className={ui("[padding-left:10px]! [padding-right:10px]! [padding-top:2px]! [padding-bottom:2px]! [border-radius:9999px]! [font-size:11px]!")}>
                  {modules.length} records
                </Badge>
              </HStack>
              <StyledTable headers={["#", "Module Name", "Status", "Actions"]} empty={modules.length === 0}>
                {modules.map((item, idx) => <Table.Row key={item.id} _hover={{
              bg: "gray.50"
            }} className={ui("[transition:background_0.15s]!")}>
                    <Table.Cell className={ui("[color:var(--color-gray-400)]! [font-size:12px]! [width:40px]!")}>{idx + 1}</Table.Cell>
                    <Table.Cell className={ui("font-normal! [font-size:13.5px]!")}>{item.name}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={item.active ? "green" : "red"} className={ui("[padding-left:10px]! [padding-right:10px]! [padding-top:2px]! [padding-bottom:2px]! [border-radius:9999px]! [font-size:11px]!")}>
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack className={ui("[gap:6px]!")}>
                        <ActionButton onClick={() => {
                    setEditingModuleId(item.id);
                    setModuleName(item.name);
                  }} className={ui("[color:#2563EB]!")}>
                          <Pencil size={12} />
                        </ActionButton>
                        <ActionButton onClick={() => deleteModule(item.id)} className={ui("[color:#DC2626]!")}>
                          <Trash2 size={12} />
                        </ActionButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>)}
              </StyledTable>
            </DataPanel>
          </HStack>}

        {/* ── SUB MODULE TAB ─────────────────────────────────────────────── */}
        {activeTab === "submodule" && <HStack className={ui("module-columns" + " " + "[align-items:flex-start]! [gap:24px]!")}>
            {/* LEFT: Form */}
            <FormPanel>
              <VStack className={ui("[align-items:stretch]! [gap:16px]!")}>
                <HStack className={ui("[justify-content:space-between]! [align-items:center]!")}>
                  <Text className={ui("font-normal! [font-size:13.5px]! [color:var(--color-gray-700)]!")}>
                    {editingSubModuleId ? "Edit Sub Module" : "New Sub Module"}
                  </Text>
                  {editingSubModuleId && <button onClick={resetSubEdit} className={ui("[background:none] [border:none] [cursor:pointer] [color:#9CA3AF] [font-size:11px] [display:flex] [align-items:center] [gap:4px]")}>
                      <RefreshCw size={11} /> Reset
                    </button>}
                </HStack>

                <Box>
                  <FieldLabel>Module</FieldLabel>
                  <select value={selectedModuleId} onChange={e => {
                setSelectedModuleId(Number(e.target.value));
                setSubModuleName("");
              }} className={selectClasses}>
                    <option value="0">Select Module</option>
                    {modules?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Box>

                {selectedModuleId > 0 && <Box>
                    <FieldLabel>Sub Module</FieldLabel>
                    <select value={subModuleName} onChange={e => setSubModuleName(e.target.value)} className={selectClasses}>
                      <option value="">Choose from Sidebar</option>
                      {getSidebarSubModules(selectedModuleId).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </Box>}

                <Button _hover={{
              bg: "var(--primary-hover)"
            }} colorScheme={editingSubModuleId ? "orange" : "green"} onClick={handleSaveSubModule} disabled={!subModuleName.trim() || !selectedModuleId} className={ui("[background:var(--primary)]! [color:white]! [min-height:var(--control-height)]! [height:38px]! [border-radius:8px]! font-normal! [font-size:13px]! [width:100%]!")}>
                  <HStack className={ui("[gap:6px]!")}>
                    {editingSubModuleId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingSubModuleId ? "Update" : "Create"}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack className={ui("[padding-left:20px]! [padding-right:20px]! [padding-top:14px]! [padding-bottom:14px]! [border-bottom:1px_solid_#F1F5F9]! [justify-content:space-between]!")}>
                <Text className={ui("font-normal! [font-size:13px]! [color:var(--color-gray-600)]!")}>All Sub Modules</Text>
                <Badge colorPalette="green" className={ui("[padding-left:10px]! [padding-right:10px]! [padding-top:2px]! [padding-bottom:2px]! [border-radius:9999px]! [font-size:11px]!")}>
                  {subModules?.length} records
                </Badge>
              </HStack>
              <StyledTable headers={["#", "Sub Module", "Module", "Actions"]} empty={subModules.length === 0}>
                {subModules?.map((item, idx) => <Table.Row key={item.id} _hover={{
              bg: "gray.50"
            }} className={ui("[transition:background_0.15s]!")}>
                    <Table.Cell className={ui("[color:var(--color-gray-400)]! [font-size:12px]! [width:40px]!")}>{idx + 1}</Table.Cell>
                    <Table.Cell className={ui("font-normal! [font-size:13.5px]!")}>{item.name}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette="blue" className={ui("[padding-left:10px]! [padding-right:10px]! [padding-top:2px]! [padding-bottom:2px]! [border-radius:9999px]! [font-size:11px]!")}>
                        {modules.find(m => m.id === item.moduleId)?.name}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack className={ui("[gap:6px]!")}>
                        <ActionButton onClick={() => {
                    setEditingSubModuleId(item.id);
                    setSubModuleName(item.name);
                  }} className={ui("[color:#2563EB]!")}>
                          <Pencil size={12} />
                        </ActionButton>
                        <ActionButton onClick={() => deleteSubModule(item.id)} className={ui("[color:#DC2626]!")}>
                          <Trash2 size={12} />
                        </ActionButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>)}
              </StyledTable>
            </DataPanel>
          </HStack>}

        {/* ── CONTENT TAB ────────────────────────────────────────────────── */}
        {activeTab === "content" && <HStack className={ui("module-columns" + " " + "[align-items:flex-start]! [gap:24px]!")}>
            {/* LEFT: Form */}
            <FormPanel>
              <VStack className={ui("[align-items:stretch]! [gap:16px]!")}>
                <HStack className={ui("[justify-content:space-between]! [align-items:center]!")}>
                  <Text className={ui("font-normal! [font-size:13.5px]! [color:var(--color-gray-700)]!")}>
                    {editingContentId ? "Edit Content" : "New Content"}
                  </Text>
                  {editingContentId && <button onClick={resetContentEdit} className={ui("[background:none] [border:none] [cursor:pointer] [color:#9CA3AF] [font-size:11px] [display:flex] [align-items:center] [gap:4px]")}>
                      <RefreshCw size={11} /> Reset
                    </button>}
                </HStack>

                <Box>
                  <FieldLabel>Module</FieldLabel>
                  <select value={selectedModuleId} onChange={e => {
                setSelectedModuleId(Number(e.target.value));
                setSelectedSubModuleId(0);
                setContentName("");
                setSelectedContentItemIds(new Set());
              }} className={selectClasses}>
                    <option value="0">Select Module</option>
                    {modules?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Box>

                {selectedModuleId > 0 && <Box>
                    <FieldLabel>Sub Module <span className={ui("[color:#9CA3AF] [font-weight:400] [text-transform:none] [letter-spacing:0]")}>(optional)</span></FieldLabel>
                    <select value={selectedSubModuleId} onChange={e => {
                setSelectedSubModuleId(Number(e.target.value));
                setContentName("");
                setSelectedContentItemIds(new Set());
              }} className={selectClasses}>
                      <option value="0">None</option>
                      {subModules.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </Box>}

                {/* Checkbox picker */}
                {selectedModuleId > 0 && (() => {
              const mod = modules.find(m => m.id === selectedModuleId);
              const section = mod ? getMenuSection(mod.name) : null;
              const directItems = Object.values(section ?? {}).filter((v): v is DirectMenuItem => "type" in v && v?.type === "direct");
              const groups = Object.values(section ?? {}).filter((v): v is MenuGroup => "items" in v && Array.isArray(v?.items));
              const showPicker = directItems.length > 0 || groups.length > 0 && selectedSubModuleId > 0;
              if (!showPicker) return null;
              const items = getSidebarItems(selectedModuleId, selectedSubModuleId);
              const selectedCount = items.filter(i => selectedContentItemIds.has(i.id)).length;
              return <Box>
                      <FieldLabel>
                        Select Items
                        {selectedCount > 0 && <span className={ui("[margin-left:6px] [background:#7C3AED] [color:#fff] [border-radius:10px] [padding:1px_7px] [font-size:10px]")}>
                            {selectedCount}
                          </span>}
                      </FieldLabel>
                      <Box className={ui("[border:1px_solid_#E2E8F0]! [border-radius:8px]! [max-height:200px]! [overflow-y:auto]! [background:#FAFAFA]!")}>
                        {items.length > 0 ? <VStack className={ui("[align-items:stretch]! [gap:0]! [padding:8px]!")}>
                            {items.map(item => {
                      const checked = selectedContentItemIds.has(item.id);
                      return <label key={item.id} style={{
                        background: checked ? "#EDE9FE" : "transparent",
                        color: checked ? "#5B21B6" : "#374151",
                        fontWeight: checked ? 600 : 400
                      }} className={ui("[display:flex] [align-items:center] [gap:8px] [cursor:pointer] [padding:5px_8px] [border-radius:6px] [font-size:12.5px] [transition:all_0.15s]")}>
                                  <input type="checkbox" checked={checked} onChange={() => toggleContentItem(item.id)} className={ui("[accent-color:#8B5CF6] [width:13px] [height:13px]")} />
                                  {item.label}
                                </label>;
                    })}
                          </VStack> : <Text className={ui("[color:var(--color-gray-400)]! [font-size:12px]! [text-align:center]! [padding-top:16px]! [padding-bottom:16px]!")}>
                            No items available
                          </Text>}
                      </Box>
                    </Box>;
            })()}

                <Button _hover={{
              bg: "var(--primary-hover)"
            }} colorScheme={editingContentId ? "orange" : "purple"} onClick={handleSaveContent} disabled={!selectedModuleId || (editingContentId ? !contentName.trim() : selectedContentItemIds.size === 0)} className={ui("[background:var(--primary)]! [color:white]! [min-height:var(--control-height)]! [height:38px]! [border-radius:8px]! font-normal! [font-size:13px]! [width:100%]!")}>
                  <HStack className={ui("[gap:6px]!")}>
                    {editingContentId ? <RefreshCw size={13} /> : <Plus size={13} />}
                    <span>{editingContentId ? "Update" : "Create"}</span>
                  </HStack>
                </Button>
              </VStack>
            </FormPanel>

            {/* RIGHT: Data */}
            <DataPanel>
              <HStack className={ui("[padding-left:20px]! [padding-right:20px]! [padding-top:14px]! [padding-bottom:14px]! [border-bottom:1px_solid_#F1F5F9]! [justify-content:space-between]!")}>
                <Text className={ui("font-normal! [font-size:13px]! [color:var(--color-gray-600)]!")}>All Contents</Text>
                <Badge colorPalette="purple" className={ui("[padding-left:10px]! [padding-right:10px]! [padding-top:2px]! [padding-bottom:2px]! [border-radius:9999px]! [font-size:11px]!")}>
                  {contents.length} records
                </Badge>
              </HStack>
              <StyledTable headers={["#", "Content Name", "Sub Module", "Actions"]} empty={contents.length === 0}>
                {contents.map((item, idx) => {
              const subModuleName = item.subModuleId ? subModules.find(s => s.id === item.subModuleId)?.name : null;
              return <Table.Row key={item.id} _hover={{
                bg: "gray.50"
              }} className={ui("[transition:background_0.15s]!")}>
                      <Table.Cell className={ui("[color:var(--color-gray-400)]! [font-size:12px]! [width:40px]!")}>{idx + 1}</Table.Cell>
                      <Table.Cell className={ui("font-normal! [font-size:13.5px]!")}>{item.name}</Table.Cell>
                      <Table.Cell>
                        {subModuleName ? <Badge colorPalette="purple" className={ui("[padding-left:10px]! [padding-right:10px]! [padding-top:2px]! [padding-bottom:2px]! [border-radius:9999px]! [font-size:11px]!")}>{subModuleName}</Badge> : <Text className={ui("[font-size:12px]! [color:var(--color-gray-400)]!")}>—</Text>}
                      </Table.Cell>
                      <Table.Cell>
                        <HStack className={ui("[gap:6px]!")}>
                          <ActionButton onClick={() => {
                      setEditingContentId(item.id);
                      setContentName(item.name);
                    }} className={ui("[color:#2563EB]!")}>
                            <Pencil size={12} />
                          </ActionButton>
                          <ActionButton onClick={() => deleteContent(item.id)} className={ui("[color:#DC2626]!")}>
                            <Trash2 size={12} />
                          </ActionButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>;
            })}
              </StyledTable>
            </DataPanel>
          </HStack>}

        {/* ── VIEW TAB ───────────────────────────────────────────────────── */}
        {activeTab === "view" && <Box>
            <Box className={ui("[background:white]! [border-radius:2xl]! [border-width:1px]! [border-color:var(--color-gray-100)]! [box-shadow:0_4px_18px_rgba(0,0,0,0.05)]! [overflow:hidden]!")}>
              {/* Header */}
              <HStack className={ui("[padding-left:20px]! [padding-right:20px]! [padding-top:16px]! [padding-bottom:16px]! [justify-content:space-between]! [border-bottom:1px_solid_#F1F5F9]! [background:linear-gradient(90deg,#F8FAFC,#FFFFFF)]!")}>
                <Box>
                  <Text className={ui("font-normal! [font-size:15px]! [color:var(--color-gray-700)]!")}>
                    Module Hierarchy
                  </Text>
                  <Text className={ui("[font-size:12px]! [color:var(--color-gray-400)]!")}>
                    Expand modules and sub modules to explore contents
                  </Text>
                </Box>

                <Badge colorPalette="orange" className={ui("[padding-left:12px]! [padding-right:12px]! [padding-top:4px]! [padding-bottom:4px]! [border-radius:9999px]! [font-size:11px]! font-normal!")}>
                  {menu.length} Modules
                </Badge>
              </HStack>

              {/* Body */}
              <VStack className={ui("[align-items:stretch]! [gap:12px]! [padding:16px]!")}>
                {menu.length === 0 && <Box className={ui("[padding-top:48px]! [padding-bottom:48px]! [text-align:center]!")}>
                    <Text className={ui("[color:var(--color-gray-400)]! [font-size:13px]!")}>
                      No hierarchy data available
                    </Text>
                  </Box>}

                {menu.map(mod => {
              const modExpanded = expandedModules.has(mod.id);
              return <Box key={mod.id} borderColor={modExpanded ? "#BFDBFE" : "gray.100"} boxShadow={modExpanded ? "0 6px 18px rgba(37,99,235,0.08)" : "0 1px 4px rgba(0,0,0,0.03)"} className={ui("[border-width:1px]! [border-radius:20px]! [overflow:hidden]! [transition:all_0.2s]!")}>
                      {/* MODULE HEADER */}
                      <HStack bg={modExpanded ? "linear-gradient(90deg,#EFF6FF,#F8FBFF)" : "white"} _hover={{
                  bg: "#F8FAFC"
                }} onClick={() => setExpandedModules(toggle(expandedModules, mod.id))} className={ui("[padding-left:16px]! [padding-right:16px]! [padding-top:12px]! [padding-bottom:12px]! [justify-content:space-between]! [cursor:pointer]! [transition:all_0.2s]!")}>
                        <HStack className={ui("[align-items:flex-start]! [gap:12px]!")}>
                          <Box className={ui("[padding:8px]! [background:#DBEAFE]! [color:#2563EB]! [border-radius:14px]! [margin-top:1px]!")}>
                            <Database size={15} />
                          </Box>

                          <Box>
                            <HStack className={ui("[gap:8px]! [margin-bottom:4px]!")}>
                              <Text className={ui("font-normal! [font-size:14px]! [color:var(--color-gray-800)]!")}>
                                {mod.name}
                              </Text>

                              <Badge colorPalette="blue" className={ui("[border-radius:9999px]! [font-size:10px]! [padding-left:8px]! [padding-right:8px]!")}>
                                {mod.subModule.length} Sub
                              </Badge>

                              <Badge colorPalette="purple" className={ui("[border-radius:9999px]! [font-size:10px]! [padding-left:8px]! [padding-right:8px]!")}>
                                {mod.moduleContent.length + mod.subModule.reduce((acc, s) => acc + s.moduleContent.length, 0)}{" "}
                                Contents
                              </Badge>
                            </HStack>

                            <Text className={ui("[font-size:11px]! [color:var(--color-gray-500)]!")}>
                              Click to expand hierarchy details
                            </Text>
                          </Box>
                        </HStack>

                        <Box transform={modExpanded ? "rotate(0deg)" : "rotate(-90deg)"} className={ui("[transition:all_0.25s]! [color:#2563EB]!")}>
                          <ChevronDown size={18} />
                        </Box>
                      </HStack>

                      {/* MODULE CONTENT */}
                      {modExpanded && <Box className={ui("[padding-left:16px]! [padding-right:16px]! [padding-bottom:16px]! [background:#FCFCFD]! [border-top:1px_solid_#EEF2F7]!")}>
                          {/* DIRECT CONTENTS */}
                          {mod.moduleContent.length > 0 && <Box className={ui("[margin-bottom:16px]! [margin-top:16px]!")}>
                              <Text className={ui("[font-size:10px]! font-normal! [color:var(--color-gray-400)]! [text-transform:uppercase]! [margin-bottom:8px]! [letter-spacing:0.6px]!")}>
                                Direct Contents
                              </Text>

                              <HStack className={ui("[flex-wrap:wrap]! [gap:8px]!")}>
                                {mod.moduleContent.map(c => <Badge key={c.id} className={ui("[padding-left:12px]! [padding-right:12px]! [padding-top:4px]! [padding-bottom:4px]! [border-radius:9999px]! [background:#F3E8FF]! [color:#6B21A8]! [font-size:11px]! font-normal!")}>
                                    {c.name}
                                  </Badge>)}
                              </HStack>
                            </Box>}

                          {/* SUB MODULES */}
                          <VStack className={ui("[align-items:stretch]! [gap:12px]!")}>
                            {mod.subModule.map(sub => {
                      const subExpanded = expandedSubModules.has(sub.id);
                      return <Box key={sub.id} borderColor={subExpanded ? "#A7F3D0" : "#E5E7EB"} className={ui("[border-width:1px]! [border-radius:14px]! [overflow:hidden]! [background:white]!")}>
                                  {/* SUB HEADER */}
                                  <HStack bg={subExpanded ? "#ECFDF5" : "white"} _hover={{
                          bg: "#F9FAFB"
                        }} onClick={() => setExpandedSubModules(toggle(expandedSubModules, sub.id))} className={ui("[padding-left:12px]! [padding-right:12px]! [padding-top:10px]! [padding-bottom:10px]! [justify-content:space-between]! [cursor:pointer]! [transition:all_0.2s]!")}>
                                    <HStack className={ui("[gap:8px]!")}>
                                      <Box className={ui("[padding:6px]! [background:#D1FAE5]! [color:#059669]! [border-radius:10px]!")}>
                                        <Layers size={12} />
                                      </Box>

                                      <Box>
                                        <Text className={ui("[font-size:12.5px]! font-normal! [color:var(--color-gray-700)]!")}>
                                          {sub.name}
                                        </Text>

                                        <Text className={ui("[font-size:10px]! [color:var(--color-gray-400)]!")}>
                                          {sub.moduleContent.length} contents
                                        </Text>
                                      </Box>
                                    </HStack>

                                    <HStack className={ui("[gap:8px]!")}>
                                      <Badge colorPalette="green" className={ui("[border-radius:9999px]! [padding-left:8px]! [padding-right:8px]! [font-size:10px]!")}>
                                        {sub.moduleContent.length}
                                      </Badge>

                                      <Box transform={subExpanded ? "rotate(0deg)" : "rotate(-90deg)"} className={ui("[transition:all_0.25s]! [color:#059669]!")}>
                                        <ChevronDown size={15} />
                                      </Box>
                                    </HStack>
                                  </HStack>

                                  {/* SUB CONTENTS */}
                                  {subExpanded && <Box className={ui("[padding-left:16px]! [padding-right:16px]! [padding-top:12px]! [padding-bottom:12px]! [border-top:1px_solid_#F3F4F6]! [background:#FAFAFA]!")}>
                                      {sub.moduleContent.length > 0 ? <Grid className={ui("[grid-template-columns:repeat(1,1fr)]! md:[grid-template-columns:repeat(2,1fr)]! lg:[grid-template-columns:repeat(3,1fr)]! [gap:8px]!")}>
                                          {sub.moduleContent.map(c => <HStack key={c.id} className={ui("[padding-left:12px]! [padding-right:12px]! [padding-top:8px]! [padding-bottom:8px]! [background:white]! [border-width:1px]! [border-color:var(--color-gray-100)]! [border-radius:14px]! [justify-content:space-between]!")}>
                                              <HStack className={ui("[gap:8px]!")}>
                                                <Box className={ui("[width:7px]! [height:7px]! [background:#8B5CF6]! [border-radius:9999px]!")} />
                                                <Text className={ui("[font-size:12px]! font-normal! [color:var(--color-gray-700)]!")}>
                                                  {c.name}
                                                </Text>
                                              </HStack>

                                              <FileText size={12} className={ui("[color:#8B5CF6]!")} />
                                            </HStack>)}
                                        </Grid> : <Box className={ui("[text-align:center]! [padding-top:16px]! [padding-bottom:16px]! [color:var(--color-gray-400)]! [font-size:12px]!")}>
                                          No contents available
                                        </Box>}
                                    </Box>}
                                </Box>;
                    })}
                          </VStack>
                        </Box>}
                    </Box>;
            })}
              </VStack>
            </Box>
          </Box>}

      </VStack>
    </Box>;
}

// ─── Shared Table wrapper ──────────────────────────────────────────────────

function StyledTable({
  headers,
  children,
  empty
}: {
  headers: string[];
  children: React.ReactNode;
  empty: boolean;
}) {
  return <Table.Root>
      <Table.Header>
        <Table.Row className={ui("[background:var(--color-gray-50)]!")}>
          {headers.map(h => <Table.ColumnHeader key={h} className={ui("[font-size:10.5px]! font-normal! [color:var(--color-gray-400)]! [text-transform:uppercase]! [letter-spacing:0.5px]! [padding-top:10px]! [padding-bottom:10px]! [padding-left:16px]! [padding-right:16px]!")}>
              {h}
            </Table.ColumnHeader>)}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {empty ? <Table.Row>
            <Table.Cell colSpan={headers.length} className={ui("[text-align:center]! [padding-top:40px]! [padding-bottom:40px]! [color:var(--color-gray-400)]! [font-size:13px]!")}>
              No records found
            </Table.Cell>
          </Table.Row> : children}
      </Table.Body>
    </Table.Root>;
}
