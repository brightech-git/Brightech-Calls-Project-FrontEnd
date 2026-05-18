"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, BarChart2, Database, FileBarChart,
  Settings, Bolt, ChevronDown, LogOut, Users, UserCheck,
  Briefcase, Package,
} from "lucide-react";

interface NavChild { label: string; href: string; icon?: React.ReactNode; }
interface NavGroup { label: string; icon: React.ReactNode; children: NavChild[]; }
interface NavLink  { label: string; href: string; icon: React.ReactNode; }
type NavItem = NavGroup | NavLink;
function isNavGroup(item: NavItem): item is NavGroup { return "children" in item; }

const menuItems: NavItem[] = [
  { label: "Home", href: "/Home", icon: <LayoutDashboard size={16} /> },
  {
    label: "Master", icon: <Database size={16} />,
    children: [
      { label: "Staff Master",  href: "/Master/StaffMaster",  icon: <Users size={13} /> },
      { label: "User Master",   href: "/Master/UserMaster",   icon: <UserCheck size={13} /> },
      { label: "Client Master", href: "/Master/ClientMaster", icon: <Briefcase size={13} /> },
    ],
  },
  // {
  //   label: "Reports", icon: <FileBarChart size={16} />,
  //   children: [
  //     { label: "Sales Report",  href: "/reports/sales", icon: <BarChart2 size={13} /> },
  //     { label: "Stock Summary", href: "/reports/stock", icon: <Package size={13} /> },
  //   ],
  // },
  // { label: "Settings", href: "/settings", icon: <Settings size={16} /> },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function NavGroupItem({ item, pathname }: { item: NavGroup; pathname: string }) {
  const isChildActive = item.children.some((c) => pathname === c.href);
  const [open, setOpen] = useState(isChildActive);
  return (
    <div>
      <button onClick={() => setOpen((p) => !p)} className={`sidebar-group-btn ${open ? "open" : ""}`} aria-expanded={open}>
        <span className="sidebar-group-icon">{item.icon}</span>
        <span className="sidebar-group-label">{item.label}</span>
        <ChevronDown size={13} className={`sidebar-chevron ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`sidebar-children ${open ? "open" : ""}`}>
        {item.children.map((child) => {
          const active = pathname === child.href;
          return (
            <Link key={child.href} href={child.href} className={`sidebar-child ${active ? "active" : ""}`}>
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

function NavLinkItem({ item, pathname }: { item: NavLink; pathname: string }) {
  const active = pathname === item.href;
  return (
    <Link href={item.href} className={`sidebar-nav-link ${active ? "active" : ""}`}>
      <span className="sidebar-link-icon">{item.icon}</span>
      {item.label}
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

export default function Sidebar() {
  const pathname = usePathname();
  const user = getLoggedUser();

  return (
    <>
      <style>{`
        .sidebar-root {
          width: 240px;
          min-width: 240px;
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid #dbeafe;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', 'Inter', sans-serif;
          position: sticky;
          top: 0;
        }
        .sidebar-logo {
          padding: 18px 16px 14px;
          border-bottom: 1px solid #dbeafe;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .sidebar-logo-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: #fff;
        }
        .sidebar-logo-text {
          font-size: 13.5px; font-weight: 700;
          color: #1e3a5f; letter-spacing: -0.01em; line-height: 1.2;
        }
        .sidebar-logo-sub {
          font-size: 9.5px; color: #93c5fd; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px;
        }
        .sidebar-nav {
          flex: 1; overflow-y: auto;
          padding: 10px 8px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 2px; }
        .sidebar-section { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-section-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #93c5fd;
          padding: 0 8px 4px;
        }
        .sidebar-nav-link {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          color: #64748b; text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-nav-link:hover { background: #eff6ff; color: #3b82f6; }
        .sidebar-nav-link.active { background: #dbeafe; color: #1d4ed8; font-weight: 600; }
        .sidebar-link-icon { display: flex; align-items: center; flex-shrink: 0; }
        .sidebar-group-btn {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border: none; border-radius: 8px;
          background: transparent; color: #64748b;
          font-size: 13px; font-family: inherit; font-weight: 500;
          cursor: pointer; text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-group-btn:hover, .sidebar-group-btn.open {
          background: #eff6ff; color: #3b82f6;
        }
        .sidebar-group-icon { display: flex; align-items: center; flex-shrink: 0; }
        .sidebar-group-label { flex: 1; }
        .sidebar-chevron { color: #bfdbfe; transition: transform 0.2s; flex-shrink: 0; }
        .sidebar-chevron.rotate-180 { transform: rotate(180deg); color: #3b82f6; }
        .sidebar-children { overflow: hidden; max-height: 0; transition: max-height 0.25s ease; }
        .sidebar-children.open { max-height: 400px; }
        .sidebar-child {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 10px 7px 24px; border-radius: 7px;
          font-size: 12.5px; font-weight: 400;
          color: #64748b; text-decoration: none; position: relative;
          transition: background 0.15s, color 0.15s; margin-top: 1px;
        }
        .sidebar-child:hover { background: #eff6ff; color: #3b82f6; }
        .sidebar-child.active { background: #dbeafe; color: #1d4ed8; font-weight: 600; }
        .sidebar-child-dot {
          position: absolute; left: 10px;
          width: 4px; height: 4px; border-radius: 50%;
          background: #bfdbfe; flex-shrink: 0; transition: background 0.15s;
        }
        .sidebar-child.active .sidebar-child-dot { background: #3b82f6; }
        .sidebar-child:hover .sidebar-child-dot { background: #60a5fa; }
        .sidebar-child-icon { display: flex; align-items: center; }
        .sidebar-footer {
          flex-shrink: 0; border-top: 1px solid #dbeafe; padding: 10px 8px;
        }
        .sidebar-user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 10px; cursor: pointer;
          transition: background 0.15s;
        }
        .sidebar-user-card:hover { background: #eff6ff; }
        .sidebar-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          display: flex; align-items: center; justify-content: center;
          font-size: 11.5px; font-weight: 700; color: #fff;
          letter-spacing: -0.02em; flex-shrink: 0;
        }
        .sidebar-user-info { flex: 1; min-width: 0; }
        .sidebar-user-name {
          font-size: 12.5px; font-weight: 600; color: #1e3a5f;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;
        }
        .sidebar-user-role { font-size: 10.5px; color: #93c5fd; line-height: 1.3; }
        .sidebar-logout-btn {
          width: 28px; height: 28px; border: none;
          background: #eff6ff; border-radius: 7px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #93c5fd; transition: background 0.15s, color 0.15s; flex-shrink: 0;
        }
        .sidebar-logout-btn:hover { background: #fee2e2; color: #ef4444; }
      `}</style>

      <aside className="sidebar-root">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Bolt size={16} /></div>
          <div>
            <div className="sidebar-logo-text">Brightech</div>
            <div className="sidebar-logo-sub">Calls Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Overview</div>
            {menuItems.slice(0, 1).map((item) =>
              !isNavGroup(item) ? <NavLinkItem key={item.href} item={item} pathname={pathname} /> : null
            )}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-label">Management</div>
            {menuItems.slice(1).map((item) =>
              isNavGroup(item)
                ? <NavGroupItem key={item.label} item={item} pathname={pathname} />
                : <NavLinkItem key={item.href} item={item} pathname={pathname} />
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
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
      </aside>
    </>
  );
}
