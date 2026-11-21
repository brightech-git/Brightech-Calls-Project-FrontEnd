'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Search, ArrowUpRight, ChevronRight } from 'lucide-react';
import Sidebar from '@/src/components/Sidebar';
import { useSidebar } from '@/src/context/layout/SideBarContext';
import { ThemeStudioDock } from '@/src/theme';
import { useCurrentPageHeader } from '@/src/context/PageHeaderContext';
import { useAccessibleMenu } from '@/src/module/auth/hook/use-accessible-menu';
import type { MenuEntryConfig } from '@/src/config/menu/menuConfig';
import { PAGE_CONFIG } from '@/src/config/pageConfig';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import QueryErrorNotice from '@/src/components/QueryErrorNotice';
function flatten(entries: MenuEntryConfig[]): MenuEntryConfig[] {
  return entries.flatMap((entry) => [
    ...(entry.href ? [entry] : []),
    ...flatten(entry.children ?? []),
  ]);
}
function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { title } = useCurrentPageHeader();
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const { accessibleMenu } = useAccessibleMenu();
  const pathname = usePathname();
  const input = useRef<HTMLInputElement>(null);
  const results = flatten(accessibleMenu)
    .filter((entry) => entry.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);
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
  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center gap-3 border-b border-line bg-white px-4 max-md:px-3">
      <button
        className="hidden size-8 shrink-0 items-center justify-center rounded-md text-ink transition-colors hover:bg-gray-100 max-md:inline-flex"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu size={18} />
      </button>
      <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted max-md:hidden">
        <span>{PAGE_CONFIG[pathname]?.group || 'Workspace'}</span>
        <ChevronRight size={14} />
        <strong className="truncate font-semibold text-ink">{PAGE_CONFIG[pathname]?.title || title || 'Overview'}</strong>
      </div>
      <div
        className="relative ml-auto flex w-72 items-center gap-2 rounded-md border border-line bg-white px-2.5 text-muted focus-within:border-brand max-md:w-auto max-md:flex-1"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        <Search size={14} />
        <input
          className="h-8 w-full min-w-0 border-0 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
          ref={input}
          aria-label="Search pages"
          placeholder="Find a page…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onFocus={() => setFocused(true)}
        />
        <kbd className="rounded border border-line px-1 text-[10px] whitespace-nowrap text-muted max-md:hidden">Ctrl K</kbd>
        {focused && (
          <div className="absolute top-[calc(100%+6px)] right-0 w-80 max-w-[calc(100vw-32px)] rounded-lg border border-line bg-white p-1.5 shadow-lg [&>a]:flex [&>a]:items-center [&>a]:gap-2 [&>a]:rounded-md [&>a]:px-2.5 [&>a]:py-1.5 [&>a]:text-[13px] [&>a]:text-ink [&>a:hover]:bg-gray-100 [&>a>svg:last-child]:ml-auto [&>p]:p-2.5 [&>p]:text-[13px]">
            <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
              {search ? 'Matching pages' : 'Quick navigation'}
            </div>
            {results.length ? (
              results.map((entry) => (
                <Link
                  key={entry.id}
                  href={entry.href!}
                  onClick={() => {
                    setSearch('');
                    setFocused(false);
                  }}
                >
                  <entry.icon size={16} />
                  {entry.label}
                  <ArrowUpRight size={14} />
                </Link>
              ))
            ) : (
              <p>No pages found. Try another name.</p>
            )}
          </div>
        )}
      </div>
      <ThemeStudioDock />
    </header>
  );
}
export default function AppShell({ children }: { children: React.ReactNode }) {
  useDialogFocus();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { sidebarCollapsed: collapsed, toggleSidebar: toggleCollapsed } = useSidebar();
  const pathname = usePathname();
  return (
    <div className="flex h-dvh overflow-hidden bg-white font-sans text-ink">
      <a
        className="fixed -top-24 left-4 z-[2000] rounded-md bg-white px-4 py-2 text-brand shadow focus:top-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <Sidebar
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-auto p-3 max-md:p-2"
          tabIndex={-1}
        >
          {pathname !== '/Home' && <QueryErrorNotice />}
          {children}
        </main>
      </div>
    </div>
  );
}
