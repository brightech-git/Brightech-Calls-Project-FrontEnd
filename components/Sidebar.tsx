"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Drawer, Portal } from "@chakra-ui/react";
import { Bolt, ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useAccessibleMenu } from "@/hooks/ApiHooks/Menu/useAccessibleMenu";
import { isMenuGroup, MenuEntryConfig } from "@/config/menu/menuConfig";

interface NavChild { label: string; href: string; icon?: React.ReactNode; }
interface NavGroup { label: string; icon: React.ReactNode; children: NavChild[]; }
interface NavLink { label: string; href: string; icon: React.ReactNode; }
type NavItem = NavGroup | NavLink;
function isNavGroup(item: NavItem): item is NavGroup { return "children" in item; }

function toNavItems(entries: MenuEntryConfig[]): NavItem[] {
  return entries.map((entry) => {
    if (isMenuGroup(entry)) {
      const Icon = entry.icon;
      return {
        label: entry.label,
        icon: <Icon size={16} />,
        children: entry.children.map((c) => {
          const ChildIcon = c.icon;
          return { label: c.label, href: c.href, icon: <ChildIcon size={13} /> };
        }),
      };
    }
    const Icon = entry.icon;
    return { label: entry.label, href: entry.href, icon: <Icon size={16} /> };
  });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function NavGroupItem({ item, pathname, isOpen, onToggle, onNavigate, collapsed }: { item: NavGroup; pathname: string; isOpen: boolean; onToggle: () => void; onNavigate?: () => void; collapsed?: boolean; }) {
  return (
    <div className="sidebar-group">
      <button onClick={onToggle} className={`sidebar-group-btn ${isOpen ? "open" : ""}`} aria-expanded={isOpen} title={collapsed ? item.label : undefined}>
        <span className="sidebar-group-icon">{item.icon}</span>
        <span className="sidebar-group-label">{item.label}</span>
        <ChevronDown size={13} className={`sidebar-chevron ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`sidebar-children ${isOpen ? "open" : ""}`}>
        {collapsed && <div className="sidebar-flyout-label">{item.label}</div>}
        {item.children.map((child) => {
          const active = pathname === child.href;
          return (
            <Link key={child.href} href={child.href} className={`sidebar-child ${active ? "active" : ""}`} onClick={onNavigate}>
              <span className="sidebar-child-dot" />
              {child.icon && <span className="sidebar-child-icon">{child.icon}</span>}
              {child.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NavLinkItem({ item, pathname, onNavigate, collapsed }: { item: NavLink; pathname: string; onNavigate?: () => void; collapsed?: boolean }) {
  const active = pathname === item.href;
  return (
    <Link href={item.href} className={`sidebar-nav-link ${active ? "active" : ""}`} onClick={onNavigate} title={collapsed ? item.label : undefined}>
      <span className="sidebar-link-icon">{item.icon}</span>
      <span className="sidebar-nav-label">{item.label}</span>
    </Link>
  );
}

function getLoggedUser() {
  if (typeof window === "undefined") return { name: "User", role: "" };
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return { name: "User", role: "" };
    const data = JSON.parse(stored);
    return {
      name: data.staffName || data.username || "User",
      role: data.role || "",
    };
  } catch {
    return { name: "User", role: "" };
  }
}

function SidebarBody({ onNavigate, collapsed, onToggleCollapse }: { onNavigate?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = usePathname();
  const user = getLoggedUser();
  const { accessibleMenu } = useAccessibleMenu();
  const menuItems = toNavItems(accessibleMenu);

  const topLinks = menuItems.filter((item) => !isNavGroup(item)) as NavLink[];
  const groups = menuItems.filter(isNavGroup) as NavGroup[];
  const defaultOpen = groups.find((g) => g.children.some((c) => pathname === c.href))?.label ?? null;
  const [openLabel, setOpenLabel] = useState<string | null>(defaultOpen);

  const handleToggle = (label: string) =>
    setOpenLabel((prev) => (prev === label ? null : label));

  return (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><Bolt size={16} /></div>
        <div className="sidebar-logo-text-wrap">
          <div className="sidebar-logo-text">Brightech</div>
          <div className="sidebar-logo-sub">Calls Dashboard</div>
        </div>
        {onToggleCollapse && (
          <button
            className="sidebar-collapse-btn"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {topLinks.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Overview</div>
            {topLinks.map((item) => (
              <NavLinkItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
            ))}
          </div>
        )}
        {groups.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Management</div>
            {groups.map((item) => (
              <NavGroupItem key={item.label} item={item} pathname={pathname} isOpen={openLabel === item.label} onToggle={() => handleToggle(item.label)} onNavigate={onNavigate} collapsed={collapsed} />
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card" title={collapsed ? user.name : undefined}>
          <div className="sidebar-avatar">{getInitials(user.name)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <button className="sidebar-logout-btn" title="Logout"
            onClick={() => { localStorage.removeItem("isLoggedIn"); window.location.href = "/Login"; }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: { isOpen: boolean; onClose: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  return (
    <>
      <style>{`
        .sidebar-root {
          width: 240px; min-width: 240px; height: 100vh;
          background: ${COLORS.shellBg};
          border-right: 1px solid ${COLORS.shellBorder};
          display: flex; flex-direction: column;
          font-family: ${FONT.family};
          position: sticky; top: 0;
          transition: width 0.2s ease, min-width 0.2s ease;
        }
        .sidebar-logo {
          padding: 18px 16px 14px;
          border-bottom: 1px solid ${COLORS.shellBorder};
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
          position: relative;
        }
        .sidebar-logo-text-wrap { min-width: 0; overflow: hidden; }
        .sidebar-collapse-btn {
          width: 22px; height: 22px; border: 1px solid ${COLORS.shellBorder};
          background: transparent; border-radius: 6px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: ${COLORS.sidebarNavText}; flex-shrink: 0; margin-left: auto;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-collapse-btn:hover { background: ${COLORS.sidebarNavHoverBg}; color: ${COLORS.sidebarNavHoverText}; }
        .sidebar-logo-icon {
          width: 32px; height: 32px; border-radius: ${RADIUS.md};
          background: ${COLORS.sidebarLogoIconBg};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: ${COLORS.sidebarLogoIconColor};
        }
        .sidebar-logo-text {
          font-size: ${FONT.size.xl};
           font-weight: 700;
          color: ${COLORS.sidebarLogoText}; letter-spacing: -0.01em; line-height: 1.2;
        }
        .sidebar-logo-sub {
         font-size: ${FONT.size.sm};color: ${COLORS.sidebarLogoSub}; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px;
        }
        .sidebar-nav {
          flex: 1; overflow-y: auto; padding: 10px 8px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: ${COLORS.sidebarScrollThumb}; border-radius: 2px; }
        .sidebar-section { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-section-label {
          font-size: ${FONT.size.md}; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: ${COLORS.sidebarSectionLabel};
          padding: 0 8px 4px;
        }
        .sidebar-nav-link {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: ${RADIUS.md};
          font-size: ${FONT.size.lg}; font-weight: 500;
          color: ${COLORS.sidebarNavText}; text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-nav-link:hover { background: ${COLORS.sidebarNavHoverBg}; color: ${COLORS.sidebarNavHoverText}; }
        .sidebar-nav-link.active { background: ${COLORS.sidebarNavActiveBg}; color: ${COLORS.sidebarNavActiveText}; font-weight: 600; }
        .sidebar-link-icon { display: flex; align-items: center; flex-shrink: 0; }
        .sidebar-group-btn {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border: none; border-radius: ${RADIUS.md};
          background: transparent; color: ${COLORS.sidebarNavText};
          font-size: ${FONT.size.md}; font-family: inherit; font-weight: 500;
          cursor: pointer; text-align: left; transition: background 0.15s, color 0.15s;
        }
        .sidebar-group-btn:hover, .sidebar-group-btn.open {
          background: ${COLORS.sidebarNavHoverBg}; color: ${COLORS.sidebarNavHoverText};
        }
        .sidebar-group-icon { display: flex; align-items: center; flex-shrink: 0; }
        .sidebar-group-label { flex: 1; }
        .sidebar-chevron { color: ${COLORS.sidebarChevron}; transition: transform 0.2s; flex-shrink: 0; }
        .sidebar-chevron.rotate-180 { transform: rotate(180deg); color: ${COLORS.sidebarChevronActive}; }
        .sidebar-children { overflow: hidden; max-height: 0; transition: max-height 0.25s ease; }
        .sidebar-children.open { max-height: 400px; }
        .sidebar-child {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 10px 7px 24px; border-radius: 7px;
          font-size: ${FONT.size.lg}; font-weight: 400;
          color: ${COLORS.sidebarNavText}; text-decoration: none; position: relative;
          transition: background 0.15s, color 0.15s; margin-top: 1px;
        }
        .sidebar-child:hover { background: ${COLORS.sidebarNavHoverBg}; color: ${COLORS.sidebarNavHoverText}; }
        .sidebar-child.active { background: ${COLORS.sidebarNavActiveBg}; color: ${COLORS.sidebarNavActiveText}; font-weight: 700; }
        .sidebar-child-dot {
          position: absolute; left: 10px; width: 4px; height: 4px;
          border-radius: 50%; background: ${COLORS.sidebarChildDot};
          flex-shrink: 0; transition: background 0.15s;
        }
        .sidebar-child.active .sidebar-child-dot { background: ${COLORS.sidebarChildDotActive}; }
        .sidebar-child:hover .sidebar-child-dot { background: ${COLORS.sidebarChildDotActive}; }
        .sidebar-child-icon { display: flex; align-items: center; }
        .sidebar-footer {
          flex-shrink: 0; border-top: 1px solid ${COLORS.shellBorder}; padding: 10px 8px;
        }
        .sidebar-user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 10px; cursor: pointer;
          transition: background 0.15s;
        }
        .sidebar-user-card:hover { background: ${COLORS.sidebarUserHoverBg}; }
        .sidebar-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: ${COLORS.sidebarLogoIconBg};
          display: flex; align-items: center; justify-content: center;
         font-size: ${FONT.size.xl};font-weight: 700; color: ${COLORS.sidebarLogoIconColor};
          letter-spacing: -0.02em; flex-shrink: 0;
        }
       .sidebar-user-info {
    flex: 1;
    min-width: 0;
}

.sidebar-user-info:hover .sidebar-user-role,
.sidebar-user-info:hover .sidebar-user-name {
    color: ${COLORS.textPrimary};
}

.sidebar-user-name {
    font-size: ${FONT.size.md};
    font-weight: 600;
    color: ${COLORS.sidebarUserName};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
}

.sidebar-user-role {
    font-size: ${FONT.size.lg};
    color: ${COLORS.sidebarUserRole};
    line-height: 1.3;
}
        .sidebar-logout-btn {
          width: 28px; height: 28px; border: none;
          background: ${COLORS.sidebarLogoutBg}; border-radius: 7px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: ${COLORS.sidebarLogoutColor}; transition: background 0.15s, color 0.15s; flex-shrink: 0;
        }
        .sidebar-logout-btn:hover { background: ${COLORS.sidebarLogoutHoverBg}; color: ${COLORS.sidebarLogoutHoverColor}; }

        .sidebar-desktop { display: flex; }
        .sidebar-drawer-content { width: 240px; max-width: 80vw; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none; }
        }

        /* ===== Collapsed (icon-only) desktop sidebar ===== */
        .sidebar-root.collapsed { width: 64px; min-width: 64px; }
        .sidebar-root.collapsed .sidebar-logo { justify-content: center; padding: 18px 8px 14px; }
        .sidebar-root.collapsed .sidebar-logo-text-wrap { display: none; }
        .sidebar-root.collapsed .sidebar-collapse-btn { margin-left: 0; }
        .sidebar-root.collapsed .sidebar-section-label { display: none; }
        .sidebar-root.collapsed .sidebar-nav-link,
        .sidebar-root.collapsed .sidebar-group-btn { justify-content: center; padding: 8px; }
        .sidebar-root.collapsed .sidebar-nav-label,
        .sidebar-root.collapsed .sidebar-group-label,
        .sidebar-root.collapsed .sidebar-chevron { display: none; }
        .sidebar-root.collapsed .sidebar-group { position: relative; }
        .sidebar-root.collapsed .sidebar-children {
          position: absolute; left: calc(100% + 8px); top: 0;
          min-width: 200px; max-height: none;
          background: ${COLORS.shellBg}; border: 1px solid ${COLORS.shellBorder};
          border-radius: ${RADIUS.md}; padding: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          opacity: 0; visibility: hidden; pointer-events: none;
          transition: opacity 0.15s; z-index: 50;
        }
        .sidebar-root.collapsed .sidebar-group:hover .sidebar-children {
          opacity: 1; visibility: visible; pointer-events: auto;
        }
        .sidebar-flyout-label {
          font-size: ${FONT.size.md}; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: ${COLORS.sidebarSectionLabel};
          padding: 4px 8px 6px;
        }
        .sidebar-root.collapsed .sidebar-user-card { justify-content: center; }
        .sidebar-root.collapsed .sidebar-user-info { display: none; }
      `}</style>

      <aside className={`sidebar-root sidebar-desktop ${collapsed ? "collapsed" : ""}`}>
        <SidebarBody collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      <Drawer.Root
        open={isOpen}
        onOpenChange={(e) => { if (!e.open) onClose(); }}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content className="sidebar-root sidebar-drawer-content">
              <SidebarBody onNavigate={onClose} />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}
