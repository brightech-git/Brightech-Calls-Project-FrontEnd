import {
  LayoutDashboard, Database, UserCheck, Users, Briefcase,
  FileBarChart, ShieldCheck, KeyRound, Server,
} from "lucide-react";
import type { ComponentType } from "react";

export interface MenuEntryConfig {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  href?: string;
  children?: MenuEntryConfig[];
}

export function hasChildren(entry: MenuEntryConfig): boolean {
  return !!entry.children && entry.children.length > 0;
}

// Alias kept for readability at call sites that only care about the
// "renders as an expandable group" question.
export const isMenuGroup = hasChildren;

export const menuConfig: MenuEntryConfig[] = [
  { id: "home", label: "Home", href: "/Home", icon: LayoutDashboard },
  {
    id: "master", label: "Clients & team", icon: Database,
    children: [
      { id: "user-master", label: "Users", href: "/Master/UserMaster", icon: UserCheck },
      // { id: "staff-master", label: "Staff", href: "/Master/StaffMaster", icon: Users },
      { id: "company-master", label: "Companies", href: "/Master/CompanyMaster", icon: Users },
      { id: "client-master", label: "Clients", href: "/Master/ClientMaster", icon: Briefcase },
      { id: "client-visit-master", label: "Client visits", href: "/Master/ClientVisitMaster", icon: Briefcase },
      { id: "client-server-master", label: "Client Servers", href: "/Master/ClientServerMaster", icon: Server },
    ],
  },
  {
    id: "project-management", label: "Projects & calls", icon: FileBarChart,
    children: [
      { id: "project-master", label: "Projects", href: "/ProjectManagement/ProjectMaster", icon: Briefcase },
      { id: "project-type-master", label: "Project types", href: "/ProjectManagement/ProjectTypeMaster", icon: Briefcase },
      { id: "module-master", label: "Project modules", href: "/ProjectManagement/ModuleMaster", icon: Briefcase },
      { id: "task-assignment", label: "Calls Booking", href: "/ProjectManagement/TaskAssignment", icon: Briefcase },
      { id: "call-status", label: "Call history", href: "/ProjectManagement/CallStatus", icon: Briefcase },
      { id: "project-links", label: "Project Links", href: "/ProjectManagement/ProjectLink", icon: Briefcase },
    ],
  },
  {
    id: "role-based-access", label: "Access management", icon: ShieldCheck,
    children: [
      // { id: "user-role", label: "User Role", href: "/Master/RoleBased/UserRole", icon: KeyRound },
      { id: "role-master", label: "Roles", href: "/Master/RoleBased/RoleMaster", icon: KeyRound },
      { id: "role-transaction", label: "Role permissions", href: "/Master/RoleBased/RoleTranCreation", icon: KeyRound },
      { id: "module", label: "Navigation modules", href: "/Master/RoleBased/Module", icon: KeyRound },
    ],
  },
];
