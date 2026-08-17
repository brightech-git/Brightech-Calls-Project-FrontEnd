import {
  LayoutDashboard, Database, UserCheck, Users, Briefcase,
  FileBarChart, ShieldCheck, KeyRound,
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
    id: "master", label: "Master", icon: Database,
    children: [
      { id: "user-master", label: "User Master", href: "/Master/UserMaster", icon: UserCheck },
      // { id: "staff-master", label: "Staff Master", href: "/Master/StaffMaster", icon: Users },
      { id: "company-master", label: "Company Master", href: "/Master/CompanyMaster", icon: Users },
      { id: "client-master", label: "Client Master", href: "/Master/ClientMaster", icon: Briefcase },
      { id: "client-visit-master", label: "Client Visit Master", href: "/Master/ClientVisitMaster", icon: Briefcase },
    ],
  },
  {
    id: "project-management", label: "Project Management", icon: FileBarChart,
    children: [
      { id: "project-master", label: "Project Master", href: "/ProjectManagement/ProjectMaster", icon: Briefcase },
      { id: "project-type-master", label: "Project Type Master", href: "/ProjectManagement/ProjectTypeMaster", icon: Briefcase },
      { id: "module-master", label: "Module Master", href: "/ProjectManagement/ModuleMaster", icon: Briefcase },
      { id: "task-assignment", label: "Calls Booking", href: "/ProjectManagement/TaskAssignment", icon: Briefcase },
      { id: "call-status", label: "Call Status", href: "/ProjectManagement/CallStatus", icon: Briefcase },
      { id: "project-links", label: "Project Links", href: "/ProjectManagement/ProjectLink", icon: Briefcase },
    ],
  },
  {
    id: "role-based-access", label: "Role Based Access", icon: ShieldCheck,
    children: [
      // { id: "user-role", label: "User Role", href: "/Master/RoleBased/UserRole", icon: KeyRound },
      { id: "role-master", label: "Role Master", href: "/Master/RoleBased/RoleMaster", icon: KeyRound },
      { id: "role-transaction", label: "Role Transaction", href: "/Master/RoleBased/RoleTranCreation", icon: KeyRound },
      { id: "module", label: "Module Creation", href: "/Master/RoleBased/Module", icon: KeyRound },
    ],
  },
];
