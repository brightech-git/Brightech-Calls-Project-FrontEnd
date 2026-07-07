"use client";

import { useState } from "react";
import { Controller, useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Pencil, Plus } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { DatePickerInput } from "@/components/ui/DatePicker";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { FileUploader } from "@/components/ui/FileUploadInput";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, RADIUS, FONT } from "@/utils/theme";

import { useCallsBookingList } from "@/hooks/TaskAssignment/useTaskAssignment";
import { useCreateCallStatus, useGetCallStatusById } from "@/hooks/CallStatus/useCallStatus";

import {
  CallsBookingRecord,
  CallsBookingRecord_Table,
} from "@/types/TaskAssignment/TaskAssignment";

// ─── Schema (only user-entered fields) ───────────────────────────────────────

const schema = z.object({
  TKTDATE:     z.string().min(1, "Date is required"),
  STATUS:      z.enum(["OPEN", "PROCESS", "CLOSED"]),
  DESCRIPTION: z.string().optional(),
  REMARK:      z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_ITEMS = [
  { label: "Open",    value: "OPEN"    },
  { label: "Process", value: "PROCESS" },
  { label: "Closed",  value: "CLOSED"  },
];

const DEFAULTS: FormValues = {
  TKTDATE:     "",
  STATUS:      "OPEN",
  DESCRIPTION: "",
  REMARK:      "",
};

// ─── Table columns (from booking list) ───────────────────────────────────────

const COLUMNS: TableColumn<CallsBookingRecord_Table>[] = [
  { key: "TKTID",       header: "Ticket ID",  sortable: true, width: "90px" },
  // { key: "COMPANYNAME", header: "Company",    sortable: true },
  { key: "PROJECTNAME", header: "Project",    sortable: true },
  { key: "MODULENAME",  header: "Module",     sortable: true },
  { key: "STAFFNAME",   header: "Staff",      sortable: true },
  {
    key: "TKTDATE", header: "Date", sortable: true,
    render: (row) => row.TKTDATE ? new Date(row.TKTDATE as string).toLocaleDateString() : "—",
  },
  {
    key: "STATUS", header: "Status", sortable: true,
    render: (row) => {
      const s = row.STATUS as string;
      const bg    = s === "CLOSED" || s === "C" ? COLORS.errorBg   : s === "PROCESS" || s === "I" ? COLORS.warningBg : COLORS.successBg;
      const color = s === "CLOSED" || s === "C" ? COLORS.error      : s === "PROCESS" || s === "I" ? COLORS.warning   : COLORS.success;
      const label = s === "O" ? "Open" : s === "I" ? "In Progress" : s === "C" ? "Completed" : s;
      return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>{label}</span>;
    },
  },
  {
    key: "ACTIVE", header: "Active",
    render: (row) => (
      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.ACTIVE === "Y" ? COLORS.successBg : COLORS.errorBg,
        color:      row.ACTIVE === "Y" ? COLORS.success   : COLORS.error,
      }}>
        {row.ACTIVE === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CallStatusPage() {
  usePageHeader({ title: "Call Status", subtitle: "Manage call ticket status" });

  const toast = useToast();

  // form modal state
  const [formOpen,   setFormOpen]   = useState(false);
  const [activeRow,  setActiveRow]  = useState<CallsBookingRecord | null>(null);
  const [image,      setImage]      = useState<File | null>(null);

  // view section state
  const [viewId, setViewId] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useCallsBookingList();
  const createMutation = useCreateCallStatus();
  const { data: viewList, isLoading: viewLoading } = useGetCallStatusById(viewId ?? "");

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver:      zodResolver(schema) as Resolver<FormValues>,
    defaultValues: DEFAULTS,
  });

  // Edit → open form pre-filling from booking row
  const openEdit = (row: CallsBookingRecord_Table) => {
    const r = row as CallsBookingRecord;
    setActiveRow(r);
    reset({
      TKTDATE:     r.TKTDATE || "",
      STATUS:      "OPEN",
      DESCRIPTION: r.DESCRIPTION || "",
      REMARK:      r.REMARK      || "",
    });
    setImage(null);
    setFormOpen(true);
  };

  // Eye → switch to detail view
  const openView = (row: CallsBookingRecord_Table) => {
    setViewId(String((row as CallsBookingRecord).TKTID ?? ""));
  };

  const onSubmit = async (values: FormValues) => {
    if (!activeRow) return;
    try {
      await createMutation.mutateAsync({
        payload: {
          TKTID:       activeRow.TKTID       ?? 0,
          COMPID:      activeRow.COMPID       ?? 0,
          USERID:      Number(activeRow.USERID ?? 0),
          PROJECTID:   activeRow.PROJECTID   ?? "",
          PROJECTNAME: activeRow.PROJECTNAME ?? "",
          MODULEID:    activeRow.MODULEID    ?? "",
          MODULENAME:  activeRow.MODULENAME  ?? "",
          STAFFID:     activeRow.STAFFID     ?? "",
          ACTIVE:      activeRow.ACTIVE      ?? "Y",
          TKTDATE:     values.TKTDATE,
          STATUS:      values.STATUS,
          DESCRIPTION: values.DESCRIPTION,
          REMARK:      values.REMARK,
        },
        image,
      });
      toast.success("Saved", "Call status created successfully");
      setFormOpen(false);
      reset(DEFAULTS);
      setImage(null);
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to save");
    }
  };

  // ── Detail view (full page replace) ──
  if (viewId !== null) {
    return (
      <>
        <style>{`
          .cs-detail-wrap {
            background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder};
            border-radius: ${RADIUS.xl}; font-family: ${FONT.family};
            box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          }
          .cs-head {
            padding: 10px 14px; border-bottom: 1px solid ${COLORS.cardBorder};
            display: flex; align-items: center; justify-content: space-between;
            background: ${COLORS.gray50}; border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
          }
          .cs-title { font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary}; }
          .cs-sub   { font-size: 11px; color: ${COLORS.textMuted}; margin-top: 2px; }
          .cs-body  { padding: 16px; }
          .cs-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .cs-view-row {
            display: flex; gap: 8px; padding: 8px 0;
            border-bottom: 1px solid ${COLORS.cardBorder}; font-size: 13px;
          }
          .cs-view-row:last-child { border-bottom: none; }
          .cs-view-label { width: 140px; font-weight: 600; color: ${COLORS.textSecondary}; flex-shrink: 0; font-size: 12px; }
          .cs-view-val   { color: ${COLORS.textPrimary}; }
          .cs-file-label {
            font-size: 11px; font-weight: 700; color: ${COLORS.textSecondary};
            letter-spacing: 0.05em; text-transform: uppercase; display: block; margin-bottom: 4px;
          }
          .cs-back-btn {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 0 14px; height: 32px; border-radius: ${RADIUS.md};
            border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
            color: ${COLORS.textSecondary}; font-size: 12px; cursor: pointer;
            font-family: ${FONT.family};
          }
          .cs-back-btn:hover { background: ${COLORS.gray50}; }
        `}</style>

        <div className="cs-detail-wrap">
          <div className="cs-head">
            <div>
              <div className="cs-title">Call Status Details</div>
              <div className="cs-sub">Ticket ID: {viewId}</div>
            </div>
            <button className="cs-back-btn" onClick={() => setViewId(null)}>
              ← Back to List
            </button>
          </div>

          <div className="cs-body">
            {viewLoading ? (
              <div style={{ padding: 48, textAlign: "center", color: COLORS.textMuted }}>Loading...</div>
            ) : viewList && viewList.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {viewList.map((viewData, idx) => (
                  <div key={viewData.SNO ?? idx} style={{
                    border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: RADIUS.md,
                    padding: 14,
                    background: COLORS.contentBg,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted,
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                      Entry #{idx + 1}
                    </div>
                    <div className="cs-grid">
                      {([
                        ["Ticket ID",    viewData.TKTID],
                        ["Ticket Date",  viewData.TKTDATE],
                        ["Project",      viewData.PROJECTNAME],
                        ["Module",       viewData.MODULENAME],
                        ["Staff ID",     viewData.STAFFID],
                        ["Status",       viewData.STATUS],
                        ["Active",       viewData.ACTIVE],
                        ["Description",  viewData.DESCRIPTION],
                        ["Remark",       viewData.REMARK],
                        ["Updated",      viewData.UPDATED],
                      ] as [string, unknown][]).map(([label, val]) => (
                        <div key={label} className="cs-view-row">
                          <span className="cs-view-label">{label}</span>
                          <span className="cs-view-val">{String(val ?? "—")}</span>
                        </div>
                      ))}
                    </div>
                    {viewData.IMAGE && (
                      <div style={{ marginTop: 10 }}>
                        <span className="cs-file-label">Image</span>
                        {console.log("[Image URL]:", `${process.env.NEXT_PUBLIC_IMAGE_URL}${viewData.IMAGE}`) as any}
                        <img src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${viewData.IMAGE}`}
                          alt="status"
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_IMAGE_URL}${viewData.IMAGE}`, "_blank")}
                          style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, marginTop: 4, cursor: "pointer" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 48, textAlign: "center", color: COLORS.textMuted }}>No status found for this ticket.</div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .cs-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: flex-start; justify-content: center;
          z-index: 1000; padding: 20px 16px; overflow-y: auto;
        }
        .cs-box {
          background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl}; width: 100%; max-width: 700px;
          display: flex; flex-direction: column; font-family: ${FONT.family};
          box-shadow: 0 8px 32px rgba(0,0,0,0.16); animation: cs-up 0.18s ease;
        }
        .cs-box form { display: flex; flex-direction: column; }
        @keyframes cs-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .cs-head {
          padding: 10px 14px; border-bottom: 1px solid ${COLORS.cardBorder};
          display: flex; align-items: center; justify-content: space-between;
          background: ${COLORS.gray50}; border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
        }
        .cs-title { font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary}; }
        .cs-sub   { font-size: 11px; color: ${COLORS.textMuted}; margin-top: 2px; }
        .cs-body  { padding: 14px 16px; }
        .cs-footer {
          padding: 8px 14px; border-top: 1px solid ${COLORS.cardBorder};
          display: flex; justify-content: flex-end; gap: 8px;
          background: ${COLORS.gray50}; border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
        }
        .cs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
        .cs-field-row { display: flex; flex-direction: column; gap: 4px; }
        .cs-field-label { font-size: 12px; font-weight: 600; color: ${COLORS.textSecondary}; }
        .cs-field-error { font-size: 11px; color: ${COLORS.error}; }
        .cs-info-bar {
          display: flex; flex-wrap: wrap; gap: 6px 20px;
          background: ${COLORS.gray50}; border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.md}; padding: 8px 12px; margin-bottom: 12px; font-size: 12px;
        }
        .cs-info-item { color: ${COLORS.textSecondary}; }
        .cs-info-item b { color: ${COLORS.textPrimary}; }
        .cs-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px; border-radius: ${RADIUS.md}; border: none;
          background: ${COLORS.btnPrimaryBg}; color: ${COLORS.btnPrimaryText};
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .cs-btn-primary:hover:not(:disabled) { background: ${COLORS.btnPrimaryHover}; }
        .cs-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cs-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px; border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
          color: ${COLORS.textSecondary}; font-size: 12px; cursor: pointer;
        }
        .cs-close {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg}; cursor: pointer;
          font-size: 14px;
        }
        .cs-view-section {
          margin-top: 16px;
          background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl}; font-family: ${FONT.family};
          box-shadow: 0 2px 12px rgba(0,0,0,0.07); animation: cs-up 0.18s ease;
        }
        .cs-view-row {
          display: flex; gap: 8px; padding: 7px 0;
          border-bottom: 1px solid ${COLORS.cardBorder}; font-size: 13px;
        }
        .cs-view-row:last-child { border-bottom: none; }
        .cs-view-label { width: 140px; font-weight: 600; color: ${COLORS.textSecondary}; flex-shrink: 0; font-size: 12px; }
        .cs-view-val   { color: ${COLORS.textPrimary}; }
        .cs-file-label {
          font-size: 11px; font-weight: 700; color: ${COLORS.textSecondary};
          letter-spacing: 0.05em; text-transform: uppercase; display: block; margin-bottom: 4px;
        }
      `}</style>

      {/* ── Booking Table ── */}
      <CustomTable
        title="Calls Booking"
        columns={COLUMNS}
        data={bookings as CallsBookingRecord_Table[]}
        rowKey="SNO"
        isLoading={isLoading}
        onEdit={openEdit}
        extraActions={[{ label: "View Status", icon: <Eye size={13} />, onClick: openView }]}
        searchPlaceholder="Search ticket, project, staff..."
        emptyMessage="No bookings found."
      />

      {/* ── Create Status Form Modal ── */}
      {formOpen && activeRow && (
        <div className="cs-overlay" onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}>
          <div className="cs-box">
            <div className="cs-head">
              <div>
                <div className="cs-title">Create Call Status</div>
                <div className="cs-sub">Ticket: {activeRow.TKTID} — {activeRow.PROJECTNAME || "—"}</div>
              </div>
              <button className="cs-close" onClick={() => setFormOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="cs-body">
                {/* Read-only info from booking */}
                <div className="cs-info-bar">
                  <span className="cs-info-item">Company: <b>{activeRow.COMPANYNAME || "—"}</b></span>
                  <span className="cs-info-item">Project: <b>{activeRow.PROJECTNAME || "—"}</b></span>
                  <span className="cs-info-item">Module: <b>{activeRow.MODULENAME || "—"}</b></span>
                  <span className="cs-info-item">Staff: <b>{activeRow.STAFFNAME || activeRow.STAFFID || "—"}</b></span>
                </div>

                {/* User-entered fields */}
                <div className="cs-grid">
                  <div className="cs-field-row">
                    <label className="cs-field-label">Date *</label>
                    <Controller
                      name="TKTDATE"
                      control={control}
                      render={({ field }) => (
                        <DatePickerInput
                          value={field.value}
                          onChange={(iso) => field.onChange(iso)}
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.TKTDATE && <span className="cs-field-error">{errors.TKTDATE.message}</span>}
                  </div>

                  <div className="cs-field-row">
                    <label className="cs-field-label">Status *</label>
                    <Controller
                      name="STATUS"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          items={STATUS_ITEMS}
                          placeholder="Select status"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.STATUS && <span className="cs-field-error">{errors.STATUS.message}</span>}
                  </div>

                  <div className="cs-field-row">
                    <label className="cs-field-label">Description</label>
                    <Controller
                      name="DESCRIPTION"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="DESCRIPTION"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter description"
                          mode="inline"
                          rows={3}
                        />
                      )}
                    />
                    {errors.DESCRIPTION && <span className="cs-field-error">{errors.DESCRIPTION.message}</span>}
                  </div>

                  <div className="cs-field-row">
                    <label className="cs-field-label">Remark</label>
                    <Controller
                      name="REMARK"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="REMARK"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter remark"
                          mode="inline"
                          rows={3}
                        />
                      )}
                    />
                    {errors.REMARK && <span className="cs-field-error">{errors.REMARK.message}</span>}
                  </div>

                  <div className="cs-field-row">
                    <label className="cs-field-label">Image</label>
                    <FileUploader
                      mode="single"
                      acceptTypes="image"
                      compact
                      showPreview
                      buttonText="Choose Image"
                      onFilesChange={(files) => setImage(files[0] ?? null)}
                      onError={(msg) => toast.error("Error", msg)}
                    />
                  </div>
                </div>
              </div>

              <div className="cs-footer">
                <button type="button" className="cs-btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="cs-btn-primary" disabled={createMutation.isPending}>
                  <Pencil size={12} />
                  {createMutation.isPending ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
