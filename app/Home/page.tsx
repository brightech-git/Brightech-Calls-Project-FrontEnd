"use client";

export default function DashboardPage() {
  const stats = [
    { label: "Total Clients",  value: "1,248", change: "+12%",    up: true },
    { label: "Revenue",        value: "₹4.2L", change: "+8.4%",   up: true },
    { label: "Pending Calls",  value: "37",    change: "+3 today", up: false },
    { label: "Active Staff",   value: "14",    change: "No change",up: true },
  ];

  const recentUsers = [
    { name: "Arun Kumar",   role: "Staff",    status: "Active" },
    { name: "Priya Nair",   role: "Manager",  status: "Active" },
    { name: "Rajan Pillai", role: "Operator", status: "Pending" },
    { name: "Deepa Menon",  role: "Staff",    status: "Active" },
    { name: "Suresh Babu",  role: "Staff",    status: "Inactive" },
  ];

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
          border: 1px solid #dbeafe;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 1px 6px rgba(59,130,246,0.07);
        }
        .stat-label {
          font-size: 10.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #93c5fd; margin-bottom: 8px;
        }
        .stat-value {
          font-size: 26px; font-weight: 700;
          color: #1e3a5f; letter-spacing: -0.03em;
        }
        .stat-change { font-size: 11px; margin-top: 5px; font-weight: 500; }
        .stat-up   { color: #16a34a; }
        .stat-down { color: #ef4444; }

        .dash-card {
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(59,130,246,0.07);
        }
        .dash-card-head {
          padding: 14px 18px;
          border-bottom: 1px solid #dbeafe;
          display: flex; align-items: center; justify-content: space-between;
          background: #eff6ff;
        }
        .dash-card-title { font-size: 13.5px; font-weight: 700; color: #1e3a5f; }

        .badge {
          font-size: 10.5px; font-weight: 600;
          padding: 3px 10px; border-radius: 20px; letter-spacing: 0.02em;
        }
        .badge-blue   { background: #dbeafe; color: #1d4ed8; }
        .badge-green  { background: #dcfce7; color: #16a34a; }
        .badge-amber  { background: #fef9c3; color: #b45309; }
        .badge-gray   { background: #f1f5f9; color: #64748b; }

        .dash-table { width: 100%; border-collapse: collapse; }
        .dash-table th {
          font-size: 10px; font-weight: 700; letter-spacing: 0.09em;
          text-transform: uppercase; color: #3b82f6;
          padding: 10px 18px; text-align: left;
          background: #eff6ff;
        }
        .dash-table td {
          font-size: 13px; color: #64748b;
          padding: 10px 18px; border-top: 1px solid #f0f6ff;
        }
        .dash-table tbody tr:hover td { background: #f8faff; }
        .td-name { color: #1e3a5f !important; font-weight: 600; }
      `}</style>

      <div className="dash-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-change ${s.up ? "stat-up" : "stat-down"}`}>
              {s.up ? "↑" : "↓"} {s.change}
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <div className="dash-card-title">Recent Users</div>
          <span className="badge badge-blue">User Master</span>
        </div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.name}>
                <td className="td-name">{u.name}</td>
                <td>{u.role}</td>
                <td>
                  <span className={`badge ${
                    u.status === "Active"   ? "badge-green" :
                    u.status === "Pending"  ? "badge-amber" : "badge-gray"
                  }`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
