"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Search, Bell } from "lucide-react";

function buildBreadcrumb(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));
}

function Topbar() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumb(pathname);

  return (
    <>
      <style>{`
        .topbar-root {
          height: 52px;
          flex-shrink: 0;
          border-bottom: 1px solid #dbeafe;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 10px;
          background: #ffffff;
        }
        .topbar-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-family: 'DM Sans', 'Inter', sans-serif;
        }
        .topbar-crumb {
          color: #93c5fd;
          text-decoration: none;
          font-weight: 400;
          transition: color 0.15s;
        }
        .topbar-crumb:hover { color: #3b82f6; }
        .topbar-crumb.active { color: #1e3a5f; font-weight: 600; }
        .topbar-sep { color: #bfdbfe; font-size: 11px; }
        .topbar-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .topbar-icon-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #f0f6ff;
          color: #93c5fd;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .topbar-icon-btn:hover { background: #dbeafe; color: #3b82f6; }
      `}</style>

      <header className="topbar-root">
        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <Link href="/Home" className="topbar-crumb">Home</Link>
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="topbar-sep">›</span>
              <Link href={crumb.href} className={`topbar-crumb ${i === crumbs.length - 1 ? "active" : ""}`}>
                {crumb.label}
              </Link>
            </span>
          ))}
        </nav>
        <div className="topbar-right">
          <button className="topbar-icon-btn" title="Search"><Search size={14} /></button>
          <button className="topbar-icon-btn" title="Notifications"><Bell size={14} /></button>
        </div>
      </header>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .app-shell {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #f0f6ff;
        }
        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
        .app-content {
          flex: 1;
          overflow-y: auto;
          padding: 28px;
          background: #f0f6ff;
        }
        .app-content::-webkit-scrollbar { width: 4px; }
        .app-content::-webkit-scrollbar-thumb {
          background: #bfdbfe;
          border-radius: 2px;
        }
      `}</style>

      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <Topbar />
          <main className="app-content">{children}</main>
        </div>
      </div>
    </>
  );
}
