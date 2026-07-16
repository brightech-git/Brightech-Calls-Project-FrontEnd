"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  menuConfig as APP_MENU_CONFIG,
  hasChildren,
  type MenuEntryConfig,
} from "@/config/menu/menuConfig";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// A leaf route at section level (no group wrapper)
export type SectionDirectItem = {
  id : string;
  type: "direct";
  label: string;
  route: string;
  icon: React.ElementType;
  title?: string;
  description?:string;
};

// A group with icon and items
export type MenuGroup = {
  icon: React.ElementType;
  items: MenuItem[];
};

// Union type for section content - can be either a direct item or a group
export type SectionContent = MenuGroup | SectionDirectItem;

// Keep existing types
export type DirectMenuItem = {
  id: string;
  type: "direct";
  label: string;
  route: string;
  icon: React.ElementType;
  title?:string;
  description?: string;
};

export type ParentMenuItem = {
  id: string;
  title?: string;
  description?: string;
  type: "parent";
  label: string;
  icon: React.ElementType;
  children: ChildMenuItem[];
};

export type ChildMenuItem = {
  id: string;
  title?: string;
  description?: string;
  label: string;
  route: string;
  icon: React.ElementType;
};

export type MenuItem = DirectMenuItem | ParentMenuItem;

// Updated SidebarMenu - each section maps group names to SectionContent
export type SidebarMenu = Record<string, Record<string, SectionContent>>;

/** Sidebar visual configuration (widths can be overridden at runtime). */
export type SidebarConfig = {
  collapsedWidth: string;
  expandedWidth: string;
};

/** Everything a consumer component can read / call. */
export type SidebarContextType = {
  currentSection: string|null;
  setCurrentSection: (section: string) => void;
  multiWindow: boolean ;
  handleMultiWindow: () => void;
  expandedNodes: Record<string, boolean>;
  toggleNode: (key: string) => void;
  menuData: SidebarMenu;
  sidebarConfig: SidebarConfig;
  updateSidebarConfig: (config: Partial<SidebarConfig>) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = (): SidebarContextType => {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error(
      "[useSidebar] must be called inside <SidebarProvider>. " +
      "Wrap your layout root with <SidebarProvider>."
    );
  }
  return ctx;
};

/**
 * Builds the SidebarContext's SidebarMenu shape from config/menu/menuConfig.ts —
 * the single source of truth also used by the live sidebar (components/Sidebar.tsx)
 * and role-based access checks (useAccessibleMenu). Content keys are the
 * stable `id` slug so items created here line up with the ids role
 * permissions are checked against. An entry with both `href` and `children`
 * (a group whose own label is also a link) contributes both: itself under
 * its own id, and each child under theirs.
 */
function buildMenuFromConfig(entries: MenuEntryConfig[]): SidebarMenu {
  const menu: SidebarMenu = {};

  for (const entry of entries) {
    if (hasChildren(entry)) {
      const section: Record<string, SectionContent> = {};
      if (entry.href) {
        section[entry.id] = {
          type: "direct",
          id : entry.id,
          label: entry.label,
          route: entry.href,
          icon: entry.icon,
        };
      }
      entry.children!.forEach((child) => {
        section[child.id] = {
          id : child.id,
          type: "direct",
          label: child.label,
          route: child.href ?? "",
          icon: child.icon,
        };
      });
      menu[entry.label] = section;
    } else {
      menu[entry.label] = {
        [entry.id]: {
          id : entry.id,
          type: "direct",
          label: entry.label,
          route: entry.href ?? "",
          icon: entry.icon,
        },
      };
    }
  }

  return menu;
}

const STATIC_MENU: SidebarMenu = buildMenuFromConfig(APP_MENU_CONFIG);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

/** localStorage key used to persist the sidebar collapsed state. */
const LS_COLLAPSED_KEY = "sidebar-collapsed";

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [menuData] = useState<SidebarMenu>(STATIC_MENU);

  const [multiWindow , setMultiWindow] = useState<boolean>(false);

  const [currentSection, _setCurrentSection] = useState<string|null>(null);


  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>({
    collapsedWidth: "64px",
    expandedWidth: "260px",
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate sidebar-collapsed state from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LS_COLLAPSED_KEY);
    if (stored !== null) setSidebarCollapsed(stored === "true");
    setIsHydrated(true);
  }, []);

  const handleMultiWindow = () => {
    setMultiWindow(prev => !prev);
  };

  const setCurrentSection = useCallback(
    (section: string) => {
      _setCurrentSection((prev) => (prev === section ? "" : section));
      setExpandedNodes({});
    },
    []
  );

  const toggleNode = useCallback((key: string) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(LS_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const updateSidebarConfig = useCallback(
    (config: Partial<SidebarConfig>) => {
      setSidebarConfig((prev) => ({ ...prev, ...config }));
    },
    []
  );

  if (!isHydrated) return null;

  return (
    <SidebarContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        multiWindow,
        handleMultiWindow,
        expandedNodes,
        toggleNode,
        menuData,
        sidebarConfig,
        updateSidebarConfig,
        sidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};