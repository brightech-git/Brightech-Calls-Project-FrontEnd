// config/menu/menuConfig.ts
//
// Single source of truth connecting every sidebar page to its backend
// "Content" record (Master > Role Based Access > Content). `contentName`
// MUST exactly match the NAME of the Content row created there — that is
// what role permissions (RoleTran) are stored against, and it's how
// useAccessibleMenu() decides whether the logged-in user's role can see
// (and navigate to) a given page.
import {
  LayoutDashboard, Database, UserCheck, Users, Briefcase,
  FileBarChart, ShieldCheck, KeyRound,
} from "lucide-react";
import type { ComponentType } from "react";

export interface MenuLinkConfig {
  contentName: string;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
}

export interface MenuGroupConfig {
  label: string;
  icon: ComponentType<{ size?: number }>;
  children: MenuLinkConfig[];
}

export type MenuEntryConfig = MenuLinkConfig | MenuGroupConfig;

export function isMenuGroup(entry: MenuEntryConfig): entry is MenuGroupConfig {
  return "children" in entry;
}

export const menuConfig: MenuEntryConfig[] = [
  { contentName: "Home", label: "Home", href: "/Home", icon: LayoutDashboard },
  {
    label: "Master", icon: Database,
    children: [
      { contentName: "User Master", label: "User Master", href: "/Master/UserMaster", icon: UserCheck },
      { contentName: "Staff Master", label: "Staff Master", href: "/Master/StaffMaster", icon: Users },
      { contentName: "Company Master", label: "Company Master", href: "/Master/CompanyMaster", icon: Users },
      { contentName: "Client Master", label: "Client Master", href: "/Master/ClientMaster", icon: Briefcase },
    ],
  },
  {
    label: "Project Management", icon: FileBarChart,
    children: [
      { contentName: "Project Master", label: "Project Master", href: "/ProjectManagement/ProjectMaster", icon: Briefcase },
      { contentName: "Project Type Master", label: "Project Type Master", href: "/ProjectManagement/ProjectTypeMaster", icon: Briefcase },
      { contentName: "Module Master", label: "Module Master", href: "/ProjectManagement/ModuleMaster", icon: Briefcase },
      { contentName: "Task Assignment", label: "Task Assignment", href: "/ProjectManagement/TaskAssignment", icon: Briefcase },
      { contentName: "Call Status", label: "Call Status", href: "/ProjectManagement/CallStatus", icon: Briefcase },
      { contentName: "Project Links", label: "Project Links", href: "/ProjectManagement/ProjectLink", icon: Briefcase },
    ],
  },
  {
    label: "Role Based Access", icon: ShieldCheck,
    children: [
      { contentName: "Role Master", label: "Role Master", href: "/Master/RoleBased/RoleMaster", icon: KeyRound },
      { contentName: "Role Transaction", label: "Role Transaction", href: "/Master/RoleBased/RoleTranCreation", icon: KeyRound },
      { contentName: "User Role", label: "User Role", href: "/Master/RoleBased/UserRole", icon: KeyRound },
    ],
  },
];
