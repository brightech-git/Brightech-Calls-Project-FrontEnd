"use client";

import { ui } from "@/utils/ui";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Search, ArrowUpRight, ChevronRight, LayoutDashboard } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/context/layout/SideBarContext';
import AppearanceSettings from '@/components/AppearanceSettings';
import { useCurrentPageHeader } from '@/context/PageHeaderContext';
import { useAccessibleMenu } from '@/hooks/ApiHooks/Menu/useAccessibleMenu';
import { MenuEntryConfig, menuConfig } from '@/config/menu/menuConfig';
import { PAGE_CONFIG } from '@/config/pageConfig';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import QueryErrorNotice from '@/components/QueryErrorNotice';
function flatten(entries: MenuEntryConfig[]): MenuEntryConfig[] {
  return entries.flatMap(entry => [...(entry.href ? [entry] : []), ...flatten(entry.children ?? [])]);
}
function Topbar({
  onMenuClick
}: {
  onMenuClick: () => void;
}) {
  const {
    title
  } = useCurrentPageHeader();
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const {
    accessibleMenu
  } = useAccessibleMenu();
  const pathname = usePathname();
  const input = useRef<HTMLInputElement>(null);
  const results = flatten(accessibleMenu).filter(entry => entry.label.toLowerCase().includes(search.toLowerCase())).slice(0, 8);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key === 'Escape') {
        setFocused(false);
        input.current?.blur();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  return <header className={ui("topbar-root")}>
    <button className={ui("shell-icon-button mobile-menu")} aria-label="Open navigation" onClick={onMenuClick}><Menu size={20} /></button>
    <div className={ui("shell-breadcrumb")}><span>{PAGE_CONFIG[pathname]?.group || 'Workspace'}</span><ChevronRight size={14} /><strong>{PAGE_CONFIG[pathname]?.title || title || 'Overview'}</strong></div>
    <div className={ui("workspace-search")} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    }}>
      <Search size={16} /><input ref={input} aria-label="Search pages" placeholder="Find a page…" value={search} onChange={event => setSearch(event.target.value)} onFocus={() => setFocused(true)} /><kbd>Ctrl K</kbd>
      {focused && <div className={ui("workspace-search-results")}><div className={ui("ui-eyebrow")}>{search ? 'Matching pages' : 'Quick navigation'}</div>{results.length ? results.map(entry => <Link key={entry.id} href={entry.href!} onClick={() => {
          setSearch('');
          setFocused(false);
        }}><entry.icon size={16} />{entry.label}<ArrowUpRight size={14} /></Link>) : <p>No pages found. Try another name.</p>}</div>}
    </div>
    <AppearanceSettings />
  </header>;
}
export default function AppShell({
  children
}: {
  children: React.ReactNode;
}) {
  useDialogFocus();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { sidebarCollapsed: collapsed, toggleSidebar: toggleCollapsed } = useSidebar();
  const {
    title,
    subtitle
  } = useCurrentPageHeader();
  const pathname = usePathname();
  const page = PAGE_CONFIG[pathname];
  const PageIcon = flatten(menuConfig).find(entry => entry.href === pathname)?.icon || LayoutDashboard;
  return <div className={ui("app-shell")}>
    <a className={ui("skip-link")} href="#main-content">Skip to content</a>
    <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
    <div className={ui("app-main")}><Topbar onMenuClick={() => setMobileNavOpen(true)} />
      <main id="main-content" className={ui("app-content")} tabIndex={-1}>
        {/* {pathname !== '/Home' && 
        <div className={ui("page-heading")}><span className={ui("page-title-mark")}><PageIcon size={20} /></span><div>
        <div className={ui("ui-eyebrow")}>{page?.group || 'Brightech Calls'}</div>
          <h1>{page?.title || title || 'Workspace'}</h1>{(page?.description || subtitle) && <p>{page?.description || subtitle}</p>}
          </div>
        </div>} */}
        {pathname !== '/Home' && <QueryErrorNotice />}
        {children}
      </main>
    </div>
  </div>;
}
