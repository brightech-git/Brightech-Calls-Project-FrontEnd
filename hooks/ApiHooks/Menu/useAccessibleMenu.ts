"use client";

// hooks/ApiHooks/Menu/useAccessibleMenu.ts
//
// Resolves which sidebar entries (from config/menu/menuConfig.ts) and which
// routes the currently logged-in user is allowed to see/visit.
//
// The backend returns the allowed menu ids at login (AuthResponse.menuIds),
// which useAuth() persists to localStorage as "menuIds" — a JSON array of
// menuConfig `id` slugs (e.g. ["company-master", "client-master"]). Access is
// checked by id only, nothing else. Until the backend starts sending that
// list, "menuIds" is absent and every entry is shown.

import { useMemo } from "react";
import { menuConfig, MenuEntryConfig } from "@/config/menu/menuConfig";

function getAllowedMenuIds(): string[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("menuIds");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function useAccessibleMenu() {
  const allowedIds = useMemo(getAllowedMenuIds, []);

  // No ids stored yet -> nothing to restrict against, show everything.
  const isAllowed = (id: string): boolean => !allowedIds || allowedIds.includes(id);

  // An entry survives if its own id is allowed (link/self), or it has at
  // least one surviving child (group). A combination entry (own href +
  // children) survives on either condition independently.
  const filterEntries = (entries: MenuEntryConfig[]): MenuEntryConfig[] => {
    const result: MenuEntryConfig[] = [];
    for (const entry of entries) {
      const children = entry.children ? filterEntries(entry.children) : undefined;
      const selfAllowed = isAllowed(entry.id);
      if (!selfAllowed && (!children || children.length === 0)) continue;
      result.push(children ? { ...entry, children } : entry);
    }
    return result;
  };

  const accessibleMenu = useMemo(() => filterEntries(menuConfig), [allowedIds]);

  const findById = (entries: MenuEntryConfig[], pathname: string): MenuEntryConfig | null => {
    for (const entry of entries) {
      if (entry.href === pathname) return entry;
      if (entry.children) {
        const match = findById(entry.children, pathname);
        if (match) return match;
      }
    }
    return null;
  };

  const isRouteAllowed = (pathname: string): boolean => {
    const match = findById(menuConfig, pathname);
    return match ? isAllowed(match.id) : true; // pages not tracked in menuConfig are not gated
  };

  return { loading: false, isAdmin: !allowedIds, accessibleMenu, isRouteAllowed };
}
