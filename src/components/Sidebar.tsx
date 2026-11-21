'use client';

import { clearSession } from '@/lib/auth/session';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Drawer, Popover, Portal } from '@chakra-ui/react';
import {
  Headphones,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  X,
} from 'lucide-react';
import { useAccessibleMenu } from '@/src/module/auth/hook/use-accessible-menu';
import { useQueryClient } from '@tanstack/react-query';
import type { MenuEntryConfig } from '@/src/config/menu/menuConfig';

function CollapsedGroup({
  entry,
  pathname,
}: {
  entry: MenuEntryConfig;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const Icon = entry.icon;
  const active = entry.children?.some((child) => child.href === pathname);
  return (
    <Popover.Root
      open={open}
      onOpenChange={(event) => setOpen(event.open)}
      positioning={{ placement: 'right-start', gutter: 12 }}
    >
      <Popover.Trigger asChild>
        <button
          className={cn(
            'flex size-9 w-full items-center justify-center rounded-md text-ink transition-colors hover:bg-gray-100',
            active && 'bg-brand-soft font-semibold text-brand hover:bg-brand-soft',
          )}
          aria-label={entry.label}
          title={entry.label}
        >
          <Icon size={16} />
        </button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className="z-50 w-56 max-w-[calc(100vw-110px)] rounded-lg border border-line bg-white p-1.5 shadow-lg outline-none">
            <Popover.Title className="mb-1 border-b border-line px-2.5 py-2 text-[13px] font-semibold text-ink">
              {entry.label}
            </Popover.Title>
            <nav aria-label={`${entry.label} submenu`}>
              {entry.children?.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.id}
                    href={child.href || '/Home'}
                    aria-current={pathname === child.href ? 'page' : undefined}
                    className={cn(
                      'flex min-h-8 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-ink no-underline transition-colors hover:bg-gray-100',
                      pathname === child.href && 'bg-brand-soft font-semibold text-brand hover:bg-brand-soft',
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <ChildIcon size={15} />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </nav>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
function SidebarBody({
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { accessibleMenu } = useAccessibleMenu();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  let name = 'Your account';
  let role = 'Workspace member';
  if (typeof window !== 'undefined') {
    try {
      name = localStorage.getItem('username') || name;
      role = localStorage.getItem('role') || role;
    } catch {
      /* Use account placeholders. */
    }
  }
  const logout = () => {
    clearSession();
    queryClient.clear();
    window.dispatchEvent(new Event('calls-session-change'));
    window.location.assign('/Login');
  };
  return (
    <>
      <div
        className={cn(
          'flex h-12 shrink-0 items-center gap-2 border-b border-line px-3',
          collapsed && 'justify-center px-2',
        )}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand text-white">
          <Headphones size={16} />
        </span>
        {!collapsed && (
          <strong className="min-w-0 truncate text-base font-bold text-ink">
            Brightech<span className="ml-1 text-brand">Calls</span>
          </strong>
        )}
        {onNavigate ? (
          <button
            className="ml-auto grid size-7 shrink-0 place-items-center rounded-md text-ink hover:bg-gray-100"
            aria-label="Close navigation"
            onClick={onNavigate}
          >
            <X size={16} />
          </button>
        ) : (
          !collapsed && (
            <button
              className="ml-auto grid size-7 shrink-0 place-items-center rounded-md text-ink hover:bg-gray-100"
              aria-label="Collapse navigation"
              onClick={onToggleCollapse}
            >
              <PanelLeftClose size={16} />
            </button>
          )
        )}
      </div>
      {collapsed && !onNavigate && (
        <button
          className="mx-auto mt-2 grid size-7 shrink-0 place-items-center rounded-md text-ink hover:bg-gray-100"
          aria-label="Expand navigation"
          onClick={onToggleCollapse}
        >
          <PanelLeftOpen size={16} />
        </button>
      )}
      <nav
        className={cn(
          'flex-1 overflow-x-hidden overflow-y-auto px-2 py-3 [scrollbar-width:thin]',
          collapsed && 'px-1.5',
        )}
        aria-label="Main navigation"
      >
        {!collapsed && (
          <span className="block px-2.5 pb-2 text-[10px] font-semibold tracking-wider text-muted uppercase">
            Workspace
          </span>
        )}
        {accessibleMenu.map((entry) => {
          const Icon = entry.icon;
          const active = pathname === entry.href;
          const hasActiveChild = entry.children?.some((child) => child.href === pathname);
          const open = expanded[entry.id] ?? true;
          if (!entry.children?.length)
            return (
              <Link
                key={entry.id}
                className={cn(
                  'flex min-h-8 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-ink no-underline transition-colors hover:bg-gray-100',
                  collapsed && 'justify-center px-0',
                  active && 'bg-brand-soft font-semibold text-brand hover:bg-brand-soft',
                )}
                aria-current={active ? 'page' : undefined}
                href={entry.href || '/Home'}
                title={entry.label}
                onClick={onNavigate}
              >
                <Icon size={16} />
                <span className={cn(collapsed && 'sr-only')}>{entry.label}</span>
              </Link>
            );
          if (collapsed)
            return (
              <div
                className="mt-1"
                key={entry.id}
              >
                <CollapsedGroup
                  entry={entry}
                  pathname={pathname}
                />
              </div>
            );
          return (
            <div
              className="mt-1"
              key={entry.id}
            >
              <button
                className={cn(
                  'flex min-h-8 w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-gray-100',
                  hasActiveChild && 'font-semibold',
                )}
                aria-expanded={!collapsed && open}
                aria-controls={`nav-${entry.id}`}
                title={entry.label}
                onClick={() => {
                  setExpanded((previous) => ({
                    ...previous,
                    [entry.id]: !open,
                  }));
                }}
              >
                <Icon size={16} />
                <span className="flex-1">{entry.label}</span>
                <ChevronDown
                  size={14}
                  className={cn('shrink-0 transition-transform', open && 'rotate-180')}
                />
              </button>
              {!collapsed && open && (
                <div
                  className="mt-0.5 mb-1 ml-5 border-l border-line pl-1.5"
                  id={`nav-${entry.id}`}
                >
                  {entry.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href || '/Home'}
                      onClick={onNavigate}
                      aria-current={pathname === child.href ? 'page' : undefined}
                      className={cn(
                        'my-px flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-ink no-underline transition-colors hover:bg-gray-100',
                        pathname === child.href && 'bg-brand-soft font-semibold text-brand hover:bg-brand-soft',
                      )}
                    >
                      <span className="size-1 shrink-0 rounded-full bg-current opacity-50" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-line p-2">
        <div className={cn('flex items-center gap-2 rounded-md p-1.5', collapsed && 'justify-center')}>
          {!collapsed && (
            <>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gray-100 text-[11px] font-semibold text-ink">
                {name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-xs font-semibold text-ink">{name}</strong>
                <small className="block truncate text-[11px] text-muted">{role}</small>
              </div>
            </>
          )}
          <button
            className="grid size-7 shrink-0 place-items-center rounded-md text-ink hover:bg-rose-50 hover:text-rose-600"
            aria-label="Sign out"
            title="Sign out"
            onClick={logout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <>
      <aside
        className={cn(
          'flex h-dvh w-56 shrink-0 flex-col border-r border-line bg-white text-ink transition-[width] max-md:hidden',
          collapsed && 'w-16',
        )}
      >
        <SidebarBody
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>
      <Drawer.Root
        open={isOpen}
        onOpenChange={(event) => {
          if (!event.open) onClose();
        }}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content className="flex h-dvh w-60 max-w-[88vw] flex-col bg-white text-ink">
              <Drawer.Title className="sr-only">Workspace navigation</Drawer.Title>
              <SidebarBody onNavigate={onClose} />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}
