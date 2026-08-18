"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Drawer, Portal } from "@chakra-ui/react";
import { Bolt, ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useAccessibleMenu } from "@/hooks/ApiHooks/Menu/useAccessibleMenu";
import { hasChildren, MenuEntryConfig } from "@/config/menu/menuConfig";

interface NavChild { label: string; href: string; icon?: React.ReactNode; }
// `href` is optional: a group's own label can also be a direct link
// (the "combination" case) in addition to expanding its children.
interface NavGroup { label: string; icon: React.ReactNode; href?: string; children: NavChild[]; }
interface NavLink { label: string; href: string; icon: React.ReactNode; }
type NavItem = NavGroup | NavLink;
function isNavGroup(item: NavItem): item is NavGroup { return "children" in item; }

function toNavItems(entries: MenuEntryConfig[]): NavItem[] {
  return entries.map((entry) => {
    if (hasChildren(entry)) {
      const Icon = entry.icon;
      return {
        label: entry.label,
        icon: <Icon size={16} />,
        href: entry.href,
        children: entry.children!.map((c) => {
          const ChildIcon = c.icon;
          return { label: c.label, href: c.href ?? "", icon: <ChildIcon size={13} /> };
        }),
      };
    }
    const Icon = entry.icon;
    return { label: entry.label, href: entry.href ?? "", icon: <Icon size={16} /> };
  });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function NavGroupItem({ item, pathname, isOpen, onToggle, onNavigate, collapsed }: { item: NavGroup; pathname: string; isOpen: boolean; onToggle: () => void; onNavigate?: () => void; collapsed?: boolean; }) {
  const active = item.href === pathname;
  return (
    <div className="sidebar-group">
      <div className={`sidebar-group-btn ${isOpen ? "open" : ""} ${active ? "active" : ""}`} aria-expanded={isOpen} title={collapsed ? item.label : undefined}>
        {item.href ? (
          <Link href={item.href} className="sidebar-group-link" onClick={onNavigate} >
            <span className="sidebar-group-icon">{item.icon}</span>
            <span className="sidebar-group-label">{item.label}</span>
          </Link>
        ) : (
          <>
          
            <span className="sidebar-group-icon" onClick={onToggle}>{item.icon}</span>
            <span className="sidebar-group-label" onClick={onToggle}>{item.label}</span>
          </>
        )}
        <button onClick={onToggle} className="sidebar-group-toggle" aria-label="Toggle submenu">
          <ChevronDown size={13} className={`sidebar-chevron ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div className={`sidebar-children ${isOpen ? "open" : ""}`}>
        {collapsed && <div className="sidebar-flyout-label">{item.label}</div>}
        {item.children.map((child) => {
          const active = pathname === child.href;
          return (
            <Link key={child.href} href={child.href} className={`sidebar-child ${active ? "active" : ""}`} onClick={onNavigate}>
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
    console.log(stored,'stored')
    if (!stored) return { name: "User", role: "" };
    const {data} = JSON.parse(stored);
    console.log(data,'datadata')

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

  console.log(user ,'userDetails');
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
            onClick={() => { localStorage.removeItem("isLoggedIn"); localStorage.removeItem("menuIds"); window.location.href = "/Login"; }}>
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
          background: linear-gradient(180deg, ${COLORS.shellBg} 0%, #050f2c 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          font-family: ${FONT.family};
          position: sticky; top: 0;
          transition: width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 2px 0 12px rgba(0,0,0,0.15);
        }
        .sidebar-logo {
          padding: 18px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
          position: relative;
        }
        .sidebar-logo-text-wrap { min-width: 0; overflow: hidden; }
        .sidebar-collapse-btn {
          width: 24px; height: 24px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04); border-radius: 7px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: ${COLORS.sidebarNavText}; flex-shrink: 0; margin-left: auto;
          transition: background 0.15s, color 0.15s, transform 0.15s;
        }
        .sidebar-collapse-btn:hover { background: ${COLORS.sidebarNavHoverBg}; color: ${COLORS.sidebarNavHoverText}; transform: scale(1.06); }
        .sidebar-logo-icon {
          width: 34px; height: 34px; border-radius: ${RADIUS.md};
          background: linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.sidebarLogoIconBg} 100%);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: ${COLORS.sidebarLogoIconColor};
          box-shadow: 0 2px 8px rgba(33,111,236,0.35);
        }
        .sidebar-logo-text {
          font-size: ${FONT.size.xl};
           font-weight: 700;
          color: ${COLORS.sidebarLogoText}; letter-spacing: -0.01em; line-height: 1.2;
        }
        .sidebar-logo-sub {
         font-size: ${FONT.size.sm};color: ${COLORS.sidebarLogoSub}; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px; opacity: 0.7;
        }
        .sidebar-nav {
          flex: 1; overflow-y: auto; overflow-x: hidden; padding: 14px 8px;
          display: flex; flex-direction: column; gap: 22px;
        }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
        .sidebar-section { display: flex; flex-direction: column; gap: 3px; }
        .sidebar-section-label {
          font-size: ${FONT.size.sm}; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: ${COLORS.sidebarSectionLabel};
          padding: 0 10px 6px; opacity: 0.45;
        }
        .sidebar-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: ${RADIUS.md};
          font-size: ${FONT.size.lg}; font-weight: 500;
          color: ${COLORS.sidebarNavText}; text-decoration: none; position: relative;
          transition: background 0.15s, color 0.15s, transform 0.1s;
        }
        .sidebar-nav-link:hover { background: rgba(255,255,255,0.07); color: ${COLORS.sidebarNavHoverText}; }
        .sidebar-nav-link.active { background: ${COLORS.sidebarNavActiveBg}; color: ${COLORS.sidebarNavActiveText}; font-weight: 600; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
        .sidebar-nav-link.active::before, .sidebar-group-btn.active::before {
          content: ""; position: absolute; left: -8px; top: 50%; transform: translateY(-50%);
          width: 3px; height: 60%; border-radius: 0 3px 3px 0; background: ${COLORS.secondary};
        }
        .sidebar-link-icon { display: flex; align-items: center; flex-shrink: 0; }
        .sidebar-group-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border: none; border-radius: ${RADIUS.md};
          background: transparent; color: ${COLORS.sidebarNavText}; position: relative;
          font-size: ${FONT.size.md}; font-family: inherit; font-weight: 500;
          cursor: pointer; text-align: left; transition: background 0.15s, color 0.15s;
        }
        .sidebar-group-btn:hover, .sidebar-group-btn.open {
          background: rgba(255,255,255,0.07); color: ${COLORS.sidebarNavHoverText};
        }
        .sidebar-group-btn.active {
          background: ${COLORS.sidebarNavActiveBg}; color: ${COLORS.sidebarNavActiveText};
        }
        .sidebar-group-link {
          display: flex; align-items: center; gap: 10px; flex: 1;
          color: inherit; text-decoration: none; min-width: 0;
        }
        .sidebar-group-toggle {
          border: none; background: transparent; color: inherit;
          cursor: pointer; flex-shrink: 0; display: flex; align-items: center;
          padding: 3px; border-radius: 5px; transition: background 0.15s;
        }
        .sidebar-group-toggle:hover { background: rgba(255,255,255,0.12); }
        .sidebar-group-icon { display: flex; align-items: center; flex-shrink: 0; }
        .sidebar-group-label { flex: 1; }
        .sidebar-chevron { color: ${COLORS.sidebarChevron}; transition: transform 0.2s; flex-shrink: 0; opacity: 0.7; }
        .sidebar-chevron.rotate-180 { transform: rotate(180deg); color: ${COLORS.sidebarChevronActive}; opacity: 1; }
        .sidebar-children { overflow: hidden; max-height: 0; transition: max-height 0.25s ease; }
        .sidebar-children.open { max-height: 400px; }
        .sidebar-child {
          display: flex; align-items: center; gap: 8px;
          margin: 1px 10px 1px 20px;
          padding: 7px 10px; border-radius: 7px;
          font-size: ${FONT.size.md}; font-weight: 400;
          color: ${COLORS.sidebarNavText}; text-decoration: none; position: relative;
          transition: background 0.15s, color 0.15s;
          border-left: 2px solid rgba(255,255,255,0.08);
        }
        .sidebar-child:hover { background: rgba(255,255,255,0.06); color: ${COLORS.sidebarNavHoverText}; border-left-color: rgba(255,255,255,0.2); }
        .sidebar-child.active { background: ${COLORS.sidebarNavActiveBg}; color: ${COLORS.sidebarNavActiveText}; font-weight: 600; border-left-color: ${COLORS.secondary}; }
        .sidebar-child-icon { display: flex; align-items: center; opacity: 0.85; }
        .sidebar-footer {
          flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.06); padding: 10px 8px;
        }
        .sidebar-user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 10px; cursor: pointer;
          transition: background 0.15s;
        }
        .sidebar-user-card:hover { background: rgba(255,255,255,0.07); }
        .sidebar-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.sidebarLogoIconBg} 100%);
          display: flex; align-items: center; justify-content: center;
         font-size: ${FONT.size.md};font-weight: 700; color: ${COLORS.sidebarLogoIconColor};
          letter-spacing: -0.02em; flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
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
          position: absolute; left: calc(100% + 10px); top: 0;
          min-width: 200px; max-height: none;
          background: #0a1c47; border: 1px solid rgba(255,255,255,0.1);
          border-radius: ${RADIUS.md}; padding: 6px; box-shadow: 0 12px 28px rgba(0,0,0,0.4);
          opacity: 0; visibility: hidden; pointer-events: none;
          transform: translateX(-4px);
          transition: opacity 0.15s, transform 0.15s; z-index: 50;
        }
        .sidebar-root.collapsed .sidebar-group:hover .sidebar-children {
          opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(0);
        }
        .sidebar-root.collapsed .sidebar-child { margin-left: 4px; border-left: none; }
        .sidebar-flyout-label {
          font-size: ${FONT.size.sm}; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: ${COLORS.sidebarSectionLabel};
          padding: 4px 8px 6px; opacity: 0.5;
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
