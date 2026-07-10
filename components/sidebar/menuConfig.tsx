import { ReactNode } from "react";
import {
  LayoutDashboard, ClipboardList, Image, Tag,
  MapPin, Shield, Bell, Settings,
} from "lucide-react";

export interface MenuNode {
  id: string;
  title: string;
  icon?: ReactNode;
  path?: string;
  badge?: number;
  children?: MenuNode[];
}

export const MENU_CONFIG: MenuNode[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: <LayoutDashboard size={16} />,
    path: "/dashboard",
  },
  {
    id: "orders",
    title: "Orders",
    icon: <ClipboardList size={16} />,
    children: [
      { id: "order-all",               title: "All Orders",         path: "/dashboard/order" },
      { id: "order-pending",           title: "Order Placed",       path: "/dashboard/order" },
      { id: "order-placed",            title: "Order Placed",       path: "/dashboard/order?status=created" },
      { id: "order-packing",           title: "Packing",            path: "/dashboard/order/detail" },
      { id: "order-ready-to-ship",     title: "Ready to Ship",      path: "/dashboard/order?status=ready_to_ship" },
      { id: "order-shipped",           title: "Shipped",            path: "/dashboard/order?status=shipped" },
      { id: "order-out",               title: "Out for Delivery",   path: "/dashboard/order?status=out_for_delivery" },
      { id: "order-delivered",         title: "Delivered",          path: "/dashboard/order?status=delivered" },
      { id: "order-cancelled",         title: "Cancelled",          path: "/dashboard/order?status=cancelled" },
      { id: "order-return",            title: "Return Requested",   path: "/dashboard/order?status=return" },
      { id: "order-cancel-by-admin",   title: "Cancelled by Admin", path: "/dashboard/order?status=cancel_by_admin" },
    ],
  },
  {
    id: "images",
    title: "Images",
    icon: <Image size={16} />,
    children: [
      { id: "image-add",    title: "Tag Image Updater", path: "/dashboard/media" },
      { id: "image-manage", title: "Tag Image View",    path: "/dashboard/product" },
    ],
  },
  {
    id: "banner",
    title: "Banner",
    icon: <Image size={16} />,
    children: [
      { id: "banner-add",          title: "Add Banners",         path: "/dashboard/banner/create" },
      { id: "banner-manage",       title: "Manage Banners",      path: "/dashboard/banner" },
      { id: "breadcrumb-add",      title: "Add BreadCrumb",      path: "/dashboard/breadcrumbbanner/add" },
      { id: "breadcrumb-manage",   title: "Manage BreadCrumb",   path: "/dashboard/breadcrumbbanner/manage" },
    ],
  },
  {
    id: "category",
    title: "Category",
    icon: <Tag size={16} />,
    children: [
      { id: "header-add",      title: "Manage Header",     path: "/dashboard/header" },
      // { id: "header-manage",   title: "Manage Header",  path: "/dashboard/header/manage" },
      { id: "footer-add",      title: "Manage Footer",     path: "/dashboard/footer" },
      //{ id: "footer-manage",   title: "Manage Footer",  path: "/dashboard/category/footer/manage" },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: <Settings size={16} />,
    children: [
      // {
      //   id: "settings-banner",
      //   title: "Banner Settings",
      //   children: [
      //     { id: "banner-setting-add",    title: "Add Banner Setting",      path: "/dashboard/banner/setting/add" },
      //     { id: "banner-setting-manage", title: "Manage Banner Settings",  path: "/dashboard/banner/setting/manage" },
      //   ],
      // },
      { id: "filter-setting-add", title: "Manage Filter Setting", path: "/dashboard/filter" },
      // {
      //   id: "settings-filter",
      //   title: "Filter Settings",
      //   children: [
         
      //     { id: "filter-setting-manage", title: "Manage Filter Settings",  path: "/dashboard/filter/setting/manage" },
      //   ],
      // },
      // {
      //   id: "settings-header",
      //   title: "Header Key",
      //   children: [
      //     { id: "header-key-add",    title: "Add Header Key",    path: "/dashboard/header" },
      //     { id: "header-key-manage", title: "Manage Header Keys",path: "/dashboard/header/manage" },
      //   ],
      // },
    ],
  },
  {
    id: "notification",
    title: "Notification",
    icon: <Bell size={16} />,
    children: [
      { id: "notification-send", title: "Send Notification", path: "/dashboard/notification" },
    ],
  },
  {
    id: "company",
    title: "Company",
    icon: <MapPin size={16} />,
    children: [
      { id: "address-manage", title: "Company", path: "/dashboard/company" },
    ],
  },
  // {
  //   id: "filter",
  //   title: "Filter",
  //   icon: <Filter size={16} />,
  //   children: [
  //     { id: "filter-manage", title: "Manage Filter Content", path: "/dashboard/filter/manage" },
  //     { id: "filter-add",    title: "Add Filter Content",    path: "/dashboard/filter/add" },
  //   ],
  // },
  {
    id: "role-master",
    title: "Role Master",
    icon: <Shield size={16} />,
    children: [
      { id: "user-master",      title: "User Master",      path: "/dashboard/master/user" },
      { id: "role-master-item", title: "Role Master",      path: "/dashboard/master/role" },
      { id: "role-mapping",     title: "Role Mapping",     path: "/dashboard/role/mapping" },
      { id: "role-permission",  title: "Role Permission",  path: "/dashboard/role/permission" },
      { id: "role-transaction", title: "Role Transaction", path: "/dashboard/role/transaction" },
    ],
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

interface Crumb { id: string; title: string; path?: string }

export function flattenMenu(items: MenuNode[] = MENU_CONFIG, ancestors: Crumb[] = []) {
  const flat: { id: string; title: string; path: string; ancestors: Crumb[] }[] = [];
  for (const item of items) {
    const crumb: Crumb = { id: item.id, title: item.title, path: item.path };
    if (item.children?.length) {
      flat.push(...flattenMenu(item.children, [...ancestors, crumb]));
      if (item.path) flat.push({ id: item.id, title: item.title, path: item.path, ancestors });
    } else if (item.path) {
      flat.push({ id: item.id, title: item.title, path: item.path, ancestors });
    }
  }
  return flat;
}

export function getPageTitle(pathname: string): string {
  return flattenMenu().find(i => i.path === pathname)?.title ?? "admin Panel";
}

export function getBreadcrumbs(pathname: string) {
  const entry = flattenMenu().find(i => i.path === pathname);
  if (!entry) return [];
  return [...entry.ancestors, { id: entry.id, title: entry.title, path: entry.path }];
}

export function filterMenuByIds(userIds: string[] = [], items: MenuNode[] = MENU_CONFIG): MenuNode[] {
  const ids = userIds.includes("dashboard") ? userIds : ["dashboard", ...userIds];
  return items
    .map(item => {
      // Node's own ID is explicitly allowed → include it entirely (with all descendants)
      if (ids.includes(item.id)) return item;
      // Group node: keep it if any children survive the filter
      if (item.children) {
        const children = filterMenuByIds(ids, item.children);
        return children.length ? { ...item, children } : null;
      }
      return null;
    })
    .filter(Boolean) as MenuNode[];
}
