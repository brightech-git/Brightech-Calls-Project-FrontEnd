"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Phone, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useDashboardBookings } from "@/hooks/TaskAssignment/useTaskAssignment";
import { CallsBookingRecord } from "@/types/TaskAssignment/TaskAssignment";

// ─────────────────────────────────────────────

function getStatusInfo(status: string | null | undefined) {
  const s = (status || "").toUpperCase();
  if (s === "COMPLETED" || s === "C") return { label: "Completed", color: COLORS.success, bg: COLORS.successBg, icon: <CheckCircle size={12} /> };
  if (s === "CANCELLED" || s === "X") return { label: "Cancelled", color: COLORS.error, bg: COLORS.errorBg, icon: <XCircle size={12} /> };
  if (s === "INPROGRESS" || s === "I") return { label: "In Progress", color: COLORS.warning, bg: COLORS.warningBg, icon: <Clock size={12} /> };
  return { label: s || "Open", color: COLORS.info, bg: COLORS.infoBg, icon: <AlertCircle size={12} /> };
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: bookings = [], isLoading } = useDashboardBookings();

  const stats = useMemo(() => {
    const total = bookings.length;
    const open = bookings.filter((b) => {
      const s = (b.STATUS || "").toUpperCase();
      return s === "OPEN" || s === "O" || s === "";
    }).length;
    const inProgress = bookings.filter((b) => {
      const s = (b.STATUS || "").toUpperCase();
      return s === "INPROGRESS" || s === "I";
    }).length;
    const completed = bookings.filter((b) => {
      const s = (b.STATUS || "").toUpperCase();
      return s === "COMPLETED" || s === "C";
    }).length;

    return [
      { label: "Total Bookings", value: total, icon: <Phone size={18} />, color: "#3b82f6", bg: "#dbeafe" },
      { label: "Open", value: open, icon: <AlertCircle size={18} />, color: "#0ea5e9", bg: "#e0f2fe" },
      { label: "In Progress", value: inProgress, icon: <Clock size={18} />, color: "#f59e0b", bg: "#fef3c7" },
      { label: "Completed", value: completed, icon: <CheckCircle size={18} />, color: "#16a34a", bg: "#dcfce7" },
    ];
  }, [bookings]);

  // Recent bookings (latest 10)
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const da = a.TKTDATE ? new Date(a.TKTDATE).getTime() : 0;
        const db = b.TKTDATE ? new Date(b.TKTDATE).getTime() : 0;
        return db - da;
      })
      .slice(0, 10);
  }, [bookings]);

  return (
    <>
      <style>{`
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 900px) { .dash-grid { grid-template-columns: repeat(2, 1fr); } }

        .stat-card {
          background: #ffffff;
          border: 1px solid ${COLORS.cardBorder};
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
          display: flex; align-items: flex-start; gap: 14px;
        }
        .stat-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .stat-label {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: ${COLORS.textMuted}; margin-bottom: 4px;
        }
        .stat-value {
          font-size: 28px; font-weight: 700;
          color: ${COLORS.textPrimary}; letter-spacing: -0.03em; line-height: 1;
        }

        .dash-card {
          background: #ffffff;
          border: 1px solid ${COLORS.cardBorder};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .dash-card-head {
          padding: 14px 18px;
          border-bottom: 1px solid ${COLORS.cardBorder};
          display: flex; align-items: center; justify-content: space-between;
          background: ${COLORS.gray50};
        }
        .dash-card-title { font-size: 13.5px; font-weight: 700; color: ${COLORS.textPrimary}; }
        .dash-card-action {
          font-size: 11px; font-weight: 600; color: ${COLORS.btnPrimaryBg};
          cursor: pointer; text-decoration: none;
        }
        .dash-card-action:hover { text-decoration: underline; }

        .dash-table { width: 100%; border-collapse: collapse; }
        .dash-table th {
          font-size: 10px; font-weight: 700; letter-spacing: 0.09em;
          text-transform: uppercase; color: ${COLORS.textMuted};
          padding: 10px 18px; text-align: left;
        }
        .dash-table td {
          font-size: 13px; color: ${COLORS.textSecondary};
          padding: 10px 18px; border-top: 1px solid ${COLORS.cardBorder};
        }
        .dash-table tbody tr:hover td { background: ${COLORS.gray50}; }
        .td-primary { color: ${COLORS.textPrimary} !important; font-weight: 600; }

        .status-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600;
          padding: 2px 10px; border-radius: 20px;
        }

        .dash-empty {
          padding: 40px 18px; text-align: center;
          font-size: 13px; color: ${COLORS.textMuted};
        }

        .dash-loading {
          padding: 40px 18px; text-align: center;
          font-size: 13px; color: ${COLORS.textMuted};
        }
      `}</style>

      {/* Stats */}
      <div className="dash-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{isLoading ? "..." : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="dash-card">
        <div className="dash-card-head">
          <div className="dash-card-title">Recent Call Bookings</div>
          <span
            className="dash-card-action"
            onClick={() => router.push("/ProjectManagement/TaskAssignment")}
          >
            View All
          </span>
        </div>

        {isLoading ? (
          <div className="dash-loading">Loading bookings...</div>
        ) : recentBookings.length === 0 ? (
          <div className="dash-empty">No call bookings assigned to you.</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Project</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => {
                const si = getStatusInfo(b.STATUS);
                const staffNames = b.STAFFMAP
                  ? Object.values(b.STAFFMAP).join(", ")
                  : "-";

                return (
                  <tr key={b.SNO}>
                    <td className="td-primary">#{b.TKTID}</td>
                    <td>{b.PROJECTNAME || "-"}</td>
                    <td>{staffNames}</td>
                    <td>
                      <span className="status-badge" style={{ background: si.bg, color: si.color }}>
                        {si.icon} {si.label}
                      </span>
                    </td>
                    <td>
                      {b.TKTDATE ? new Date(b.TKTDATE).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
