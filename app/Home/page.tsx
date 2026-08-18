"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {  ChevronRightCircle } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import { usePageHeader } from "@/context/PageHeaderContext";
import { COLORS, FONT } from "@/utils/theme";

import { useMyTasks } from "@/hooks/TaskAssignment/useTaskAssignment";
import { CallsBookingRecord_Table } from "@/types/TaskAssignment/TaskAssignment";

// ─── Columns — active tasks assigned to the logged-in user ──────────────────

const COLUMNS: TableColumn<CallsBookingRecord_Table>[] = [
  { key: "tktId",       header: "Ticket ID", sortable: true, width: "90px" },
  { key: "clientName",  header: "Client",    sortable: true, render: (row) => (row.clientName as string) || "-" },
  { key: "projectName", header: "Project",   sortable: true },
  { key: "moduleName",  header: "Module",    sortable: true },
  {
    key: "tktDate",
    header: "Date",
    sortable: true,
    render: (row) => (row.tktDate ? new Date(row.tktDate as string).toLocaleDateString() : "-"),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => {
      const s = (row.status as string) ?? "";
      const bg = s === "C" || s === "COMPLETED" ? COLORS.successBg : s === "X" || s === "CANCELLED" ? COLORS.errorBg : COLORS.warningBg;
      const color = s === "C" || s === "COMPLETED" ? COLORS.success : s === "X" || s === "CANCELLED" ? COLORS.error : COLORS.warning;
      const label = s === "O" ? "Open" : s === "I" || s === "INPROGRESS" ? "In Progress" : s === "C" || s === "COMPLETED" ? "Completed" : s === "X" || s === "CANCELLED" ? "Cancelled" : s || "—";
      return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: FONT.size.xs, fontWeight: 600, background: bg, color }}>{label}</span>;
    },
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  usePageHeader({
    title: "Home",
    subtitle: "Active tasks assigned to you",
  });

  const router = useRouter();

  // Read the logged-in user's id client-side (localStorage isn't available
  // during SSR), then load only the bookings assigned to them.
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setUserId(localStorage.getItem("userId") ?? "");
  }, []);

  const { data: myTasks = [], isLoading } = useMyTasks(userId);

  // Home only shows ACTIVE tasks — inactive ones stay visible in the full
  // Task Assignment list, but don't belong on the "what's on my plate" view.
  const activeTasks = useMemo(
    () => myTasks.filter((t) => t.active === "Y"),
    [myTasks]
  );

  // Click through to that ticket's Call Status log/detail view.
  const openLogs = (row: CallsBookingRecord_Table) => {
    router.push(`/ProjectManagement/CallStatus?tktId=${row.tktId}`);
  };

  return (
    <>
      <style>{`
        .home-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px; border-radius: 8px;
          border: none; background: ${COLORS.btnPrimaryBg}; color: ${COLORS.btnPrimaryText};
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .home-btn-primary:hover { background: ${COLORS.btnPrimaryHover}; }
      `}</style>

      <CustomTable
        title="My Active Tasks"
        columns={COLUMNS}
        data={activeTasks as CallsBookingRecord_Table[]}
        rowKey="sno"
        isLoading={isLoading}
        extraActions={[
          {
            label: "View Logs",
            icon: <ChevronRightCircle size={20} />,
            onClick: openLogs,
          },
        ]}

      />
    </>
  );
}
