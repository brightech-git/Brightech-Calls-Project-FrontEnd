"use client";

// hooks/ApiHooks/Menu/useAccessibleMenu.ts
//
// Resolves which sidebar entries (from config/menu/menuConfig.ts) and which
// routes the currently logged-in user is allowed to see/visit, based on:
//   1) which ROLEID their USERID is mapped to (UserRoleMasterService)
//   2) whether that role has ADMINACCESS = "Y" (RoleMasterService) -> full access
//   3) otherwise, the set of active CONTENTID's granted to that role (RoleTranService)
// Content names in menuConfig are matched (case-insensitive) against the live
// /menu tree to resolve their real backend CONTENTID before checking access.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUserRoles } from "@/services/UserRoleMasterService";
import { fetchRoles } from "@/services/RoleMasterService";
import { getActiveRoleTransactionsByRoleId, getMenu } from "@/services/RoleTranService";
import { menuConfig, isMenuGroup, MenuEntryConfig } from "@/config/menu/menuConfig";

function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("userId");
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) ? id : null;
}

export function useAccessibleMenu() {
  const userId = getUserId();

  const { data: userRoles, isLoading: userRolesLoading } = useQuery({
    queryKey: ["userroles"],
    queryFn: fetchUserRoles,
    enabled: !!userId,
  });

  const roleId = useMemo(
    () => userRoles?.find((ur) => ur.USERID === userId)?.ROLEID,
    [userRoles, userId]
  );

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    enabled: !!roleId,
  });

  const isAdmin = useMemo(
    () => roles?.find((r) => r.ROLEID === roleId)?.ADMINACCESS === "Y",
    [roles, roleId]
  );

  const { data: perms, isLoading: permsLoading } = useQuery({
    queryKey: ["roleTran", "active", roleId],
    queryFn: () => getActiveRoleTransactionsByRoleId(roleId!),
    enabled: !!roleId && !isAdmin,
  });

  const { data: menuTree, isLoading: menuLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: getMenu,
  });

  const contentIdByName = useMemo(() => {
    const map = new Map<string, number>();
    const addContents = (contents: { ID: number; NAME: string }[] | undefined) =>
      contents?.forEach((c) => map.set(c.NAME.trim().toLowerCase(), c.ID));

    (menuTree ?? []).forEach((mod: any) => {
      addContents(mod.CONTENTS ?? mod.contents);
      const subModules = mod.SUBMODULES ?? mod.subModules ?? [];
      subModules.forEach((sub: any) => addContents(sub.CONTENTS ?? sub.contents));
    });
    return map;
  }, [menuTree]);

  const allowedContentIds = useMemo(() => {
    const set = new Set<number>();
    perms?.forEach((p) => {
      if (p.ACTIVE !== false) set.add(p.CONTENTID);
    });
    return set;
  }, [perms]);

  const loading =
    userRolesLoading || rolesLoading || menuLoading || (!isAdmin && !!roleId && permsLoading);

  const isAllowed = (contentName: string): boolean => {
    if (isAdmin) return true;
    const id = contentIdByName.get(contentName.trim().toLowerCase());
    if (id === undefined) return false;
    return allowedContentIds.has(id);
  };

  const accessibleMenu = useMemo(() => {
    if (loading) return [];
    return menuConfig
      .map((entry) => {
        if (isMenuGroup(entry)) {
          const children = entry.children.filter((c) => isAllowed(c.contentName));
          return children.length ? { ...entry, children } : null;
        }
        return isAllowed(entry.contentName) ? entry : null;
      })
      .filter((e): e is MenuEntryConfig => e !== null);
  }, [loading, isAdmin, allowedContentIds, contentIdByName]);

  const isRouteAllowed = (pathname: string): boolean => {
    if (loading) return true; // don't bounce the user while permissions are still loading
    for (const entry of menuConfig) {
      if (isMenuGroup(entry)) {
        const match = entry.children.find((c) => c.href === pathname);
        if (match) return isAllowed(match.contentName);
      } else if (entry.href === pathname) {
        return isAllowed(entry.contentName);
      }
    }
    return true; // pages not tracked in menuConfig are not gated
  };

  return { loading, isAdmin, accessibleMenu, isRouteAllowed };
}
