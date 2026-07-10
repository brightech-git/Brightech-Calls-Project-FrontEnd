"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Database,
  Settings, Bolt, ChevronDown, LogOut, Users, UserCheck,
  Briefcase, FileBarChart, Phone, MessageSquare
} from "lucide-react";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { getRoleTranByRoleId, RoleTranRecord } from "@/services/RoleTranService";

interface NavChild { label: string; href: string; icon?: React.ReactNode; contentName?: string; }
interface NavGroup { label: string; icon: React.ReactNode; children: NavChild[]; }
interface NavLink { label: string; href: string; icon: React.ReactNode; contentName?: string; }
type NavItem = NavGroup | NavLink;
function isNavGroup(item: NavItem): item is NavGroup { return "children" in item; }

// CONTENT NAME MAPS TO ROLETRAN CONTENTNAME
const allMenuItems: NavItem[] = [
  { label: "Home", href: "/Home", icon: <LayoutDashboard size={16} />, contentName: "Home" },
  {
    label: "Master", icon: <Database size={16} />,
    children: [
      { label: "User Master", href: "/Master/UserMaster", icon: <UserCheck size={13} />, contentName: "User Master" },
      { label: "Company Master", href: "/Master/CompanyMaster", icon: <Users size={13} />, contentName: "Company Master" },
      { label: "Client Master", href: "/Master/ClientMaster", icon: <Briefcase size={13} />, contentName: "Client Master" },
    ],
  },
  {
    label: "Project Management", icon: <FileBarChart size={16} />,
    children: [
      { label: "Project Master", href: "/ProjectManagement/ProjectMaster", icon: <Briefcase size={13} />, contentName: "Project Master" },
      { label: "Project Type Master", href: "/ProjectManagement/ProjectTypeMaster", icon: <Briefcase size={13} />, contentName: "Project Type Master" },
      { label: "Module Master", href: "/ProjectManagement/ModuleMaster", icon: <Briefcase size={13} />, contentName: "Module Master" },
      { label: "Call Booking", href: "/ProjectManagement/TaskAssignment", icon: <Phone size={13} />, contentName: "Call Booking" },
      { label: "Call Status", href: "/ProjectManagement/CallStatus", icon: <MessageSquare size={13} />, contentName: "Call Status" },
      { label: "Project Links", href: "/ProjectManagement/ProjectLink", icon: <Briefcase size={13} />, contentName: "Project Links" },
    ],
  },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function NavGroupItem({ item, pathname, isOpen, onToggle }: { item: NavGroup; pathname: string; isOpen: boolean; onToggle: () => void; }) {
  return (
    <div>
      <button onClick={onToggle} className={`sidebar-group-btn ${isOpen ? "open" : ""}`} aria-expanded={isOpen}>
        <span className="sidebar-group-icon">{item.icon}</span>
        <span className="sidebar-group-label">{item.label}</span>
        <ChevronDown size={13} className={`sidebar-chevron ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`sidebar-children ${isOpen ? "open" : ""}`}>
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
  if (typeof window === "undefined") return { name: "User", role: "", roleId: 0, isClient: false };
  try {
    const stored = localStorage.getItem("user");
    const sessionType = localStorage.getItem("sessionType");
    if (!stored) return { name: "User", role: "", roleId: 0, isClient: false };
    const data = JSON.parse(stored);
    return {
      name: data.staffName || data.username || "User",
      role: data.roleName || "",
      roleId: data.roleId || 0,
      isClient: sessionType === "CLIENT" || data.sessionType === "CLIENT",
    };
  } catch {
    return { name: "User", role: "", roleId: 0, isClient: false };
  }
}

// MINIMAL MENU FOR CLIENT SESSIONS (NO RoleTran WIRING - CLIENTS ONLY EVER
// SEE THEIR OWN DATA, SCOPED SERVER-SIDE BY CLIENTID)
const clientMenuItems: NavItem[] = [
  { label: "Home", href: "/Home", icon: <LayoutDashboard size={16} />, contentName: "Home" },
  {
    label: "Calls", icon: <Phone size={16} />,
    children: [
      { label: "Call Booking", href: "/ProjectManagement/TaskAssignment", icon: <Phone size={13} />, contentName: "Call Booking" },
      { label: "Call Status", href: "/ProjectManagement/CallStatus", icon: <MessageSquare size={13} />, contentName: "Call Status" },
    ],
  },
];

// FILTER MENU BASED ON ROLE PERMISSIONS
function filterMenuByPermissions(items: NavItem[], allowedContentNames: Set<string>, isAdmin: boolean): NavItem[] {
  if (isAdmin) return items; // Admin sees everything

  return items
    .map((item) => {
      if (isNavGroup(item)) {
        const filteredChildren = item.children.filter(
          (child) => !child.contentName || allowedContentNames.has(child.contentName)
        );
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      } else {
        if (!item.contentName || allowedContentNames.has(item.contentName)) return item;
        return null;
      }
    })
    .filter(Boolean) as NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getLoggedUser();

  const [menuItems, setMenuItems] = useState<NavItem[]>(
    user.isClient ? clientMenuItems : allMenuItems
  );
  const [loaded, setLoaded] = useState(false);

  const isAdmin = user.roleId === 2 && !user.isClient;

  // LOAD ROLE PERMISSIONS
  useEffect(() => {
    // CLIENT SESSIONS DON'T GO THROUGH ROLEMASTER/ROLETRAN - FIXED MENU
    if (user.isClient) {
      setMenuItems(clientMenuItems);
      setLoaded(true);
      return;
    }

    if (isAdmin) {
      setMenuItems(allMenuItems);
      setLoaded(true);
      return;
    }

    if (user.roleId > 0) {
      getRoleTranByRoleId(user.roleId)
        .then((permissions: RoleTranRecord[]) => {
          const allowedNames = new Set(
            permissions
              .filter((p) => p.ACTIVE)
              .map((p) => p.CONTENTNAME)
          );
          // Always allow Home
          allowedNames.add("Home");
          const filtered = filterMenuByPermissions(allMenuItems, allowedNames, false);
          setMenuItems(filtered);
          setLoaded(true);
        })
        .catch(() => {
          // On error, show only Home
          setMenuItems([allMenuItems[0]]);
          setLoaded(true);
        });
    } else {
      setMenuItems([allMenuItems[0]]);
      setLoaded(true);
    }
  }, [user.roleId, isAdmin]);

  const groups = menuItems.filter(isNavGroup) as NavGroup[];
  const defaultOpen = groups.find((g) => g.children.some((c) => pathname === c.href))?.label ?? null;
  const [openLabel, setOpenLabel] = useState<string | null>(defaultOpen);

  const handleToggle = (label: string) =>
    setOpenLabel((prev) => (prev === label ? null : label));

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("sessionType");
    localStorage.removeItem("calls_token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("staffName");
    localStorage.removeItem("roleId");
    localStorage.removeItem("roleName");
    localStorage.removeItem("mobileNo");
    localStorage.removeItem("active");
    localStorage.removeItem("user");
    window.location.href = "/Login";
  };

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
        }
        .sidebar-logo {
          padding: 18px 16px 14px;
          border-bottom: 1px solid ${COLORS.shellBorder};
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }
        .sidebar-logo-icon {
          width: 32px; height: 32px; border-radius: ${RADIUS.md};
          background: ${COLORS.sidebarLogoIconBg};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: ${COLORS.sidebarLogoIconColor};
        }
        .sidebar-logo-text {
          font-size: 13.5px;
           font-weight: 700;
          color: ${COLORS.sidebarLogoText}; letter-spacing: -0.01em; line-height: 1.2;
        }
        .sidebar-logo-sub {
          font-size: 9.5px; color: ${COLORS.sidebarLogoSub}; font-weight: 500;
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
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${COLORS.sidebarSectionLabel};
          padding: 0 8px 4px;
        }
        .sidebar-nav-link {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: ${RADIUS.md};
          font-size: ${FONT.size.md}; font-weight: 500;
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
          font-size: 12.5px; font-weight: 400;
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
          font-size: 11.5px; font-weight: 700; color: ${COLORS.sidebarLogoIconColor};
          letter-spacing: -0.02em; flex-shrink: 0;
        }
        .sidebar-user-info { flex: 1; min-width: 0; }
        .sidebar-user-name {
          font-size: 12.5px; font-weight: 600; color: ${COLORS.sidebarUserName};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;
        }
        .sidebar-user-role { font-size: 10.5px; color: ${COLORS.sidebarUserRole}; line-height: 1.3; }
        .sidebar-logout-btn {
          width: 28px; height: 28px; border: none;
          background: ${COLORS.sidebarLogoutBg}; border-radius: 7px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: ${COLORS.sidebarLogoutColor}; transition: background 0.15s, color 0.15s; flex-shrink: 0;
        }
        .sidebar-logout-btn:hover { background: ${COLORS.sidebarLogoutHoverBg}; color: ${COLORS.sidebarLogoutHoverColor}; }
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
          {menuItems.length > 1 && (
            <div className="sidebar-section">
              <div className="sidebar-section-label">Management</div>
              {menuItems.slice(1).map((item) =>
                isNavGroup(item)
                  ? <NavGroupItem key={item.label} item={item} pathname={pathname} isOpen={openLabel === item.label} onToggle={() => handleToggle(item.label)} />
                  : <NavLinkItem key={item.href} item={item} pathname={pathname} />
              )}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{getInitials(user.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button className="sidebar-logout-btn" title="Logout" onClick={handleLogout}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
