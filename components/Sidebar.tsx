"use client";

import { ui } from "@/utils/ui";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Drawer, Popover, Portal } from '@chakra-ui/react';
import { Headphones, ChevronDown, PanelLeftClose, PanelLeftOpen, LogOut, X } from 'lucide-react';
import { useAccessibleMenu } from '@/hooks/ApiHooks/Menu/useAccessibleMenu';
import { useQueryClient } from '@tanstack/react-query';
import type { MenuEntryConfig } from '@/config/menu/menuConfig';

function CollapsedGroup({ entry, pathname }: { entry: MenuEntryConfig; pathname: string }) {
  const [open, setOpen] = useState(false);
  const Icon = entry.icon;
  const active = entry.children?.some(child => child.href === pathname);
  return <Popover.Root open={open} onOpenChange={event => setOpen(event.open)} positioning={{ placement: 'right-start', gutter: 12 }}>
    <Popover.Trigger asChild><button className={ui(`sidebar-group-btn sidebar-collapsed-group ${active ? 'active' : ''}`)} aria-label={entry.label} title={entry.label}><Icon size={19} /></button></Popover.Trigger>
    <Portal><Popover.Positioner><Popover.Content className={ui('sidebar-flyout')}>
      <Popover.Title className={ui('sidebar-flyout-title')}>{entry.label}</Popover.Title>
      <nav aria-label={`${entry.label} submenu`}>{entry.children?.map(child => {
        const ChildIcon = child.icon;
        return <Link key={child.id} href={child.href || '/Home'} aria-current={pathname === child.href ? 'page' : undefined} className={ui(`sidebar-nav-link ${pathname === child.href ? 'active' : ''}`)} onClick={() => setOpen(false)}><ChildIcon size={17} /><span>{child.label}</span></Link>;
      })}</nav>
    </Popover.Content></Popover.Positioner></Portal>
  </Popover.Root>;
}
function SidebarBody({
  onNavigate,
  collapsed,
  onToggleCollapse
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const {
    accessibleMenu
  } = useAccessibleMenu();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  let name = 'Your account';
  let role = 'Workspace member';
  if (typeof window !== 'undefined') {
    try {
      name = localStorage.getItem('username') || name;
      role = localStorage.getItem('role') || role;
    } catch {/* Use account placeholders. */}
  }
  const logout = () => {
    for (const key of ['isLoggedIn', 'calls_token', 'userId', 'staffId', 'username', 'staffName', 'role', 'mobileNo', 'active', 'isClient', 'clientId', 'user', 'menuIds']) localStorage.removeItem(key);
    queryClient.clear();
    window.dispatchEvent(new Event('calls-session-change'));
    window.location.assign('/Login');
  };
  return <>
    <div className={ui("sidebar-brand")}><span className={ui("sidebar-brand-mark")}><Headphones size={22} /></span><div className={ui("sidebar-brand-copy")}><strong>brightech<span>calls</span></strong><small>YOUR SERVICE WORKSPACE</small></div>{onNavigate ? <button className={ui("sidebar-toggle")} aria-label="Close navigation" onClick={onNavigate}><X size={18} /></button> : <button className={ui("sidebar-toggle")} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={onToggleCollapse}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>}</div>
    <nav className={ui("sidebar-nav")} aria-label="Main navigation"><span className={ui("sidebar-section-label")}>Workspace</span>{accessibleMenu.map(entry => {
        const Icon = entry.icon;
        const active = pathname === entry.href;
        const hasActiveChild = entry.children?.some(child => child.href === pathname);
        const open = expanded[entry.id] ?? true;
        if (!entry.children?.length) return <Link key={entry.id} className={ui(`sidebar-nav-link ${active ? 'active' : ''}`)} aria-current={active ? 'page' : undefined} href={entry.href || '/Home'} title={entry.label} onClick={onNavigate}><Icon size={19} /><span>{entry.label}</span></Link>;
        if (collapsed) return <div className={ui('sidebar-group')} key={entry.id}><CollapsedGroup entry={entry} pathname={pathname} /></div>;
        return <div className={ui("sidebar-group")} key={entry.id}><button className={ui(`sidebar-group-btn ${hasActiveChild ? 'current-group' : ''}`)} aria-expanded={!collapsed && open} aria-controls={`nav-${entry.id}`} title={entry.label} onClick={() => {
            setExpanded(previous => ({
              ...previous,
              [entry.id]: !open
            }));
          }}><Icon size={19} /><span>{entry.label}</span><ChevronDown size={15} className={ui(open ? 'rotated' : '')} /></button>{!collapsed && open && <div className={ui("sidebar-children")} id={`nav-${entry.id}`}>{entry.children.map(child => <Link key={child.id} href={child.href || '/Home'} onClick={onNavigate} aria-current={pathname === child.href ? 'page' : undefined} className={ui(`sidebar-child ${pathname === child.href ? 'active' : ''}`)}><span className={ui("sidebar-child-dot")} />{child.label}</Link>)}</div>}</div>;
      })}</nav>
    <div className={ui("sidebar-footer")}><div className={ui("sidebar-user-card")}><span className={ui("sidebar-avatar")}>{name.slice(0, 2).toUpperCase()}</span><div className={ui("sidebar-user-info")}><strong>{name}</strong><small>{role}</small></div><button className={ui("sidebar-logout-btn")} aria-label="Sign out" title="Sign out" onClick={logout}><LogOut size={17} /></button></div></div>
  </>;
}
export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse
}: {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return <><aside className={ui(`sidebar-root sidebar-desktop ${collapsed ? 'collapsed' : ''}`)}><SidebarBody collapsed={collapsed} onToggleCollapse={onToggleCollapse} /></aside>
    <Drawer.Root open={isOpen} onOpenChange={event => {
      if (!event.open) onClose();
    }} placement="start"><Portal><Drawer.Backdrop /><Drawer.Positioner><Drawer.Content className={ui("sidebar-root sidebar-drawer-content")}><Drawer.Title className={ui("sr-only")}>Workspace navigation</Drawer.Title><SidebarBody onNavigate={onClose} /></Drawer.Content></Drawer.Positioner></Portal></Drawer.Root>
  </>;
}
