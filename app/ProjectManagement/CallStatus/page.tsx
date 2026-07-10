"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import { CallStatusDetail } from "@/components/CallStatusDetail";
import { StatusFilterBar, ALL_FILTER, CUSTOM_FILTER } from "@/components/StatusFilterBar";
import { usePageHeader } from "@/context/PageHeaderContext";
import { COLORS } from "@/utils/theme";

import { useMyBookings } from "@/hooks/TaskAssignment/useTaskAssignment";
import { FIXED_CALL_STATUSES, getCallStatusStyle, normalizeStatus } from "@/utils/callStatus";

import {
  CallsBookingRecord,
  CallsBookingRecord_Table,
} from "@/types/TaskAssignment/TaskAssignment";

// ─── Table columns ──────────────────────────────────────────────

const COLUMNS: TableColumn<CallsBookingRecord_Table>[] = [
  { key: "TKTID", header: "Ticket", sortable: true, width: "80px" },
  { key: "PROJECTNAME", header: "Project", sortable: true },
  {
    key: "STAFFMAP",
    header: "Assigned To",
    render: (row) => {
      const map = row.STAFFMAP as Record<string, string> | null;
      if (!map || Object.keys(map).length === 0) return "-";
      return Object.values(map).join(", ");
    },
  },
  {
    key: "STATUS", header: "Current Status", sortable: true,
    render: (row) => {
      const s = normalizeStatus(row.STATUS as string);
      const style = getCallStatusStyle(s);
      return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: style.bg, color: style.color }}>{s}</span>;
    },
  },
  {
    key: "TKTDATE", header: "Date", sortable: true,
    render: (row) => row.TKTDATE ? new Date(row.TKTDATE as string).toLocaleDateString() : "-",
  },
];

// ─── Page ───────────────────────────────────────────────────────

export default function CallStatusPage() {
  usePageHeader({ title: "Call Status", subtitle: "View & reply to call status updates" });

  const [selectedTicket, setSelectedTicket] = useState<CallsBookingRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [customQuery, setCustomQuery] = useState("");

  const { data: bookings = [], isLoading } = useMyBookings();

  const openView = (row: CallsBookingRecord_Table) => {
    setSelectedTicket(row as CallsBookingRecord);
  };

  // ── Filter bookings by status tab / typed search ──
  const filteredBookings = useMemo(() => {
    if (statusFilter === CUSTOM_FILTER) {
      if (!customQuery.trim()) return bookings;
      const q = customQuery.trim().toLowerCase();
      return bookings.filter((b) => normalizeStatus(b.STATUS).toLowerCase().includes(q));
    }
    if (statusFilter === ALL_FILTER) return bookings;
    return bookings.filter((b) => normalizeStatus(b.STATUS) === statusFilter);
  }, [bookings, statusFilter, customQuery]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { [ALL_FILTER]: bookings.length };
    for (const s of FIXED_CALL_STATUSES) {
      map[s.value] = bookings.filter((b) => normalizeStatus(b.STATUS) === s.value).length;
    }
    return map;
  }, [bookings]);

  // ── DETAIL VIEW ──
  if (selectedTicket) {
    return (
      <CallStatusDetail
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  // ── LIST VIEW ──
  return (
    <>
      <CustomTable
        title="Call Bookings"
        columns={COLUMNS}
        data={filteredBookings as CallsBookingRecord_Table[]}
        rowKey="SNO"
        isLoading={isLoading}
        extraActions={[
          {
            label: "View Status",
            icon: <Eye size={13} />,
            onClick: openView,
          },
        ]}
        searchPlaceholder="Search ticket, project..."
        emptyMessage="No bookings found."
        filterSlot={
          <StatusFilterBar
            statuses={FIXED_CALL_STATUSES}
            active={statusFilter}
            onSelect={setStatusFilter}
            customQuery={customQuery}
            onCustomQueryChange={setCustomQuery}
            counts={counts}
          />
        }
      />
    </>
  );
}
