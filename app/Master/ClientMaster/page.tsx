export default function ClientMasterPage() {
  const clients = [
    { id: 1, name: "David Lee",   company: "TechCorp",      phone: "+1 234 567 890", status: "Active" },
    { id: 2, name: "Sara Connor", company: "BizSolutions",  phone: "+1 987 654 321", status: "Active" },
    { id: 3, name: "Tom Hardy",   company: "GlobalTrade",   phone: "+1 456 789 012", status: "Inactive" },
  ];

  return (
    <>
      <style>{`
        .cm-page { font-family: 'DM Sans', 'Inter', sans-serif; }
        .cm-header { margin-bottom: 20px; }
        .cm-title { font-size: 18px; font-weight: 700; color: #1e3a5f; letter-spacing: -0.02em; }
        .cm-subtitle { font-size: 12px; color: #93c5fd; margin-top: 2px; }
        .cm-card {
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(59,130,246,0.07);
        }
        .cm-table { width: 100%; border-collapse: collapse; }
        .cm-table th {
          font-size: 10px; font-weight: 700; letter-spacing: 0.09em;
          text-transform: uppercase; color: #3b82f6;
          padding: 11px 18px; text-align: left; background: #eff6ff;
          border-bottom: 1px solid #dbeafe;
        }
        .cm-table td {
          font-size: 13px; color: #64748b;
          padding: 11px 18px; border-top: 1px solid #f0f6ff;
        }
        .cm-table tbody tr:hover td { background: #f8faff; }
        .cm-td-name { color: #1e3a5f !important; font-weight: 600; }
        .badge {
          font-size: 11px; font-weight: 600;
          padding: 3px 10px; border-radius: 20px;
        }
        .badge-green { background: #dcfce7; color: #16a34a; }
        .badge-red   { background: #fee2e2; color: #ef4444; }
      `}</style>

      <div className="cm-page">
        <div className="cm-header">
          <div className="cm-title">Client Master</div>
          <div className="cm-subtitle">Manage your client records</div>
        </div>
        <div className="cm-card">
          <table className="cm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client Name</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td className="cm-td-name">{c.name}</td>
                  <td>{c.company}</td>
                  <td>{c.phone}</td>
                  <td>
                    <span className={`badge ${c.status === "Active" ? "badge-green" : "badge-red"}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
