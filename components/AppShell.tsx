"use client";

import Link from "next/link";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Bell, Menu } from "lucide-react";
import { useCurrentPageHeader } from "@/context/PageHeaderContext";
import { COLORS, FONT } from "@/utils/theme";

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { title, subtitle } = useCurrentPageHeader();

  return (
    <>
      <style>{`
        .topbar-root {
          height: 52px; flex-shrink: 0;
          border-bottom: 1px solid ${COLORS.shellBorder};
          display: flex; align-items: center;
          padding: 0 24px; gap: 10px;
          background: ${COLORS.shellBg};
        }
        .topbar-menu-btn {
          display: none;
          width: 32px; height: 32px;
          border: 1px solid ${COLORS.shellBorder};
          border-radius: 8px;
          background: ${COLORS.topbarIconBg};
          color: ${COLORS.topbarIconColor};
          align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .topbar-menu-btn:hover { background: ${COLORS.topbarIconHoverBg}; color: ${COLORS.topbarIconHoverColor}; }
        @media (max-width: 768px) {
          .topbar-menu-btn { display: flex; }
        }
        .topbar-title {
          font-size: 14px; font-weight: 700;
          color: ${COLORS.topbarTitle};
          font-family: ${FONT.family};
        }
        .topbar-subtitle {
          font-size: 12px; color: ${COLORS.topbarSubtitle};
          font-family: ${FONT.family};
          margin-left: 8px; padding-left: 8px;
          border-left: 1px solid ${COLORS.topbarDivider};
        }
        .topbar-right {
          margin-left: auto; display: flex; align-items: center; gap: 6px;
        }
        .topbar-icon-btn {
          width: 32px; height: 32px;
          border: 1px solid ${COLORS.shellBorder};
          border-radius: 8px;
          background: ${COLORS.topbarIconBg};
          color: ${COLORS.topbarIconColor};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .topbar-icon-btn:hover { background: ${COLORS.topbarIconHoverBg}; color: ${COLORS.topbarIconHoverColor}; }
      `}</style>

      <header className="topbar-root">
        <button className="topbar-menu-btn" title="Menu" onClick={onMenuClick}>
          <Menu size={16} />
        </button>
        <div style={{ display: "flex", alignItems: "center" }}>
          {title && <span className="topbar-title">{title}</span>}
          {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
        </div>
        <div className="topbar-right">
          <button className="topbar-icon-btn" title="Notifications"><Bell size={14} /></button>
        </div>
      </header>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .app-shell {
          display: flex; height: 100vh; overflow: hidden;
          background: ${COLORS.contentBg};
        }
        .app-main {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden; min-width: 0;
        }
        .app-content {
          flex: 1; overflow-y: auto; padding: 12px;
          background: ${COLORS.contentBg};
        }
        .app-content::-webkit-scrollbar { width: 4px; }
        .app-content::-webkit-scrollbar-thumb {
          background: ${COLORS.gray300}; border-radius: 2px;
        }
      `}</style>

      <div className="app-shell">
        <Sidebar
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <div className="app-main">
          <Topbar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="app-content">{children}</main>
        </div>
      </div>
    </>
  );
}
