"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { FormField, FieldConfig } from "@/components/FormField";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePageHeader } from "@/context/PageHeaderContext";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useToast } from "@/components/Toast";
import {
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
} from "@/hooks/StaffMaster/useStaffMaster";
import { StaffRecord, StaffRecord_Table } from "@/types/StaffMaster/StaffMaster";

// ─── Schema ───────────────────────────────────────────────────────────────────

const staffSchema = z.object({
  STAFFNAME: z.string().min(1, "Name is required"),
  MOBILENO:  z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  ROLE:      z.string().min(1, "Role is required"),
  ADDRESS1:  z.string().optional(),
  ADDRESS2:  z.string().optional(),
  ADDRESS3:  z.string().optional(),
  DOJ:       z.string().optional(),
  ACTIVE:    z.enum(["Y", "N"]),
});

type StaffForm = z.infer<typeof staffSchema>;

// ─── Fields ───────────────────────────────────────────────────────────────────

const FIELDS: FieldConfig<StaffForm>[] = [
  { name: "STAFFNAME", label: "Staff Name",     type: "text",   placeholder: "Enter staff name",  required: true,  tabIndex: 1, inline: true, labelWidth: "110px", capitalize: true },
  { name: "MOBILENO",  label: "Mobile No",      type: "tel",    placeholder: "e.g. 9659721856",   required: true,  tabIndex: 2, inline: true, labelWidth: "110px" },
  { name: "ROLE",      label: "Role",           type: "select", placeholder: "Select role",        required: true,  tabIndex: 3, inline: true, labelWidth: "110px",
    options: [
      { label: "Admin",    value: "ADMIN" },
      { label: "Manager",  value: "MANAGER" },
      { label: "Operator", value: "OPERATOR" },
      { label: "Staff",    value: "STAFF" },
    ],
  },
  { name: "ACTIVE",    label: "Status",         type: "select", placeholder: "Select status",      required: true,  tabIndex: 4, inline: true, labelWidth: "110px",
    options: [
      { label: "Active",   value: "Y" },
      { label: "Inactive", value: "N" },
    ],
  },
  { name: "DOJ",       label: "Date of Join",   type: "date",   tabIndex: 5, inline: true, labelWidth: "110px" },
  { name: "ADDRESS1",  label: "Address 1",      type: "text",   placeholder: "Street",             tabIndex: 6, inline: true, labelWidth: "110px" },
  { name: "ADDRESS2",  label: "Address 2",      type: "text",   placeholder: "Area",               tabIndex: 7, inline: true, labelWidth: "110px" },
  { name: "ADDRESS3",  label: "City",           type: "text",   placeholder: "City",               tabIndex: 8, inline: true, labelWidth: "110px" },
];

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<StaffRecord_Table>[] = [
  { key: "SNO",       header: "#",        align: "center", width: "50px" },
  { key: "STAFFID",   header: "Staff ID", sortable: true,  width: "90px" },
  { key: "STAFFNAME", header: "Name",     sortable: true },
  { key: "MOBILENO",  header: "Mobile",   sortable: true },
  { key: "ROLE",      header: "Role",     sortable: true },
  { key: "DOJ",       header: "DOJ",      sortable: true },
  { key: "ACTIVE",    header: "Status",   sortable: true,
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20,
        fontSize: 11, fontWeight: 600,
        background: row.ACTIVE === "Y" ? COLORS.successBg : COLORS.errorBg,
        color:      row.ACTIVE === "Y" ? COLORS.success   : COLORS.error,
      }}>
        {row.ACTIVE === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffMasterPage() {
  usePageHeader({ title: "Staff Master", subtitle: "Manage your staff records" });

  const toast = useToast();

  const [open, setOpen]           = useState(false);
  const [editRow, setEditRow]     = useState<StaffRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<StaffRecord | null>(null);

  const { data: staffList = [], isLoading } = useStaffList();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    control, handleSubmit, reset,
    formState: { errors },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: { STAFFNAME: "", MOBILENO: "", ROLE: "", ADDRESS1: "", ADDRESS2: "", ADDRESS3: "", DOJ: "", ACTIVE: "Y" },
  });

  const openCreate = () => {
    setEditRow(null);
    reset({ STAFFNAME: "", MOBILENO: "", ROLE: "", ADDRESS1: "", ADDRESS2: "", ADDRESS3: "", DOJ: "", ACTIVE: "Y" });
    setOpen(true);
  };

  const openEdit = (row: StaffRecord_Table) => {
    const r = row as StaffRecord;
    setEditRow(r);
    reset({
      STAFFNAME: r.STAFFNAME ?? "",
      MOBILENO:  r.MOBILENO  ?? "",
      ROLE:      r.ROLE      ?? "",
      ADDRESS1:  r.ADDRESS1  ?? "",
      ADDRESS2:  r.ADDRESS2  ?? "",
      ADDRESS3:  r.ADDRESS3  ?? "",
      DOJ:       r.DOJ       ?? "",
      ACTIVE:    r.ACTIVE === "N" ? "N" : "Y",
    });
    setOpen(true);
  };

  const onSubmit = async (data: StaffForm) => {
    try {
      const formatDOJ = (d?: string) => {
        if (!d) return null;
        const [y, m, day] = d.split("-");
        if (!y || !m || !day) return d;
        return `${m}-${day}-${y}`;
      };

      if (editRow) {
        const payload = {
          ...data,
          DOJ:     formatDOJ(data.DOJ),
          SNO:     editRow.SNO,
          STAFFID: editRow.STAFFID,
          USERID:  editRow.USERID ?? null,
        };
        console.log("[StaffMaster] UPDATE payload:", payload);
        const res = await updateMutation.mutateAsync({ id: editRow.STAFFID, payload });
        console.log("[StaffMaster] UPDATE response:", res);
        toast.success("Staff Updated", `"${res.STAFFNAME}" updated successfully.`);
      } else {
        const payload = { ...data, DOJ: formatDOJ(data.DOJ) };
        console.log("[StaffMaster] CREATE payload:", payload);
        const res = await createMutation.mutateAsync(payload);
        console.log("[StaffMaster] CREATE response:", res);
        toast.success("Staff Created", `"${res.STAFFNAME}" created successfully.`);
      }
      setOpen(false);
      reset();
    } catch (err: any) {
      console.error("[StaffMaster] ERROR:", err?.response ?? err);
      const msg = err?.response?.data?.message || err?.message || "Operation failed.";
      toast.error(editRow ? "Update Failed" : "Create Failed", msg);
    }
  };

  const handleDelete = (row: StaffRecord_Table) => setDeleteRow(row as StaffRecord);

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(deleteRow.STAFFID, {
      onSuccess: () => {
        toast.success("Staff Deleted", `"${deleteRow.STAFFNAME}" deleted successfully.`);
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      },
    });
  };

  return (
    <>
      <style>{`
        .sm-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 16px;
        }
        .sm-modal-box {
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl};
          width: 100%; max-width: 480px;
          max-height: 88vh;
          display: flex; flex-direction: column;
          font-family: ${FONT.family};
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
          animation: sm-slide-up 0.18s ease;
        }
        @keyframes sm-slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .sm-modal-head {
          padding: 10px 14px 8px;
          border-bottom: 1px solid ${COLORS.cardBorder};
          display: flex; align-items: center; justify-content: space-between;
          background: ${COLORS.gray50};
          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
          flex-shrink: 0;
        }
        .sm-modal-title { font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary}; }
        .sm-modal-sub   { font-size: 10px; color: ${COLORS.textMuted}; margin-top: 1px; }
        .sm-modal-body  { padding: 10px 14px; overflow-y: auto; flex: 1; min-height: 0; }
        .sm-modal-footer {
          padding: 8px 14px;
          border-top: 1px solid ${COLORS.cardBorder};
          display: flex; justify-content: flex-end; gap: 8px;
          background: ${COLORS.gray50};
          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
          flex-shrink: 0;
        }
        .sm-section-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${COLORS.textMuted};
          padding-bottom: 4px; border-bottom: 1px solid ${COLORS.cardBorder};
          margin-bottom: 6px; margin-top: 10px;
        }
        .sm-section-label:first-of-type { margin-top: 0; }
        .sm-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 18px; height: 36px; border-radius: ${RADIUS.md};
          border: none; background: ${COLORS.btnPrimaryBg};
          color: ${COLORS.btnPrimaryText};
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.15s; font-family: inherit;
        }
        .sm-btn-primary:hover { background: ${COLORS.btnPrimaryHover}; }
        .sm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .sm-btn-secondary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 18px; height: 36px; border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.btnSecondaryBorder};
          background: ${COLORS.btnSecondaryBg};
          color: ${COLORS.btnSecondaryText};
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.15s; font-family: inherit;
        }
        .sm-btn-secondary:hover { background: ${COLORS.btnSecondaryHover}; }
        .sm-close-btn {
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid ${COLORS.cardBorder};
          background: ${COLORS.cardBg}; color: ${COLORS.textMuted};
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .sm-close-btn:hover { background: ${COLORS.errorBg}; color: ${COLORS.error}; }
        .sm-modal-box input, .sm-modal-box textarea, .sm-modal-box select {
          background: ${COLORS.inputBg} !important;
          border: 1px solid ${COLORS.inputBorder} !important;
          color: ${COLORS.inputText} !important;
        }
        .sm-modal-box input::placeholder, .sm-modal-box textarea::placeholder {
          color: ${COLORS.inputPlaceholder} !important;
        }
        .sm-modal-box input:focus, .sm-modal-box textarea:focus {
          border-color: ${COLORS.inputBorderFocus} !important;
          box-shadow: 0 0 0 2px rgba(107,114,128,0.15) !important;
        }
      `}</style>

      {/* Table */}
      <CustomTable
        title="All Staff"
        columns={COLUMNS}
        data={staffList as StaffRecord_Table[]}
        rowKey="SNO"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search by name, role, mobile..."
        emptyMessage="No staff found. Add your first record."
        toolbarRight={
          <button className="sm-btn-primary" onClick={openCreate}>
            <Plus size={14} /> Add Staff
          </button>
        }
      />

      {/* Modal */}
      {open && (
        <div className="sm-modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sm-modal-box">
            <div className="sm-modal-head">
              <div>
                <div className="sm-modal-title">{editRow ? "Edit Staff" : "Add New Staff"}</div>
                <div className="sm-modal-sub">
                  {editRow ? `Editing: ${editRow.STAFFNAME}` : "Fill in the details below"}
                </div>
              </div>
              <button className="sm-close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="sm-modal-body">
                <div className="sm-section-label">Basic Information</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {FIELDS.filter((f) => ["STAFFNAME","MOBILENO","ROLE","ACTIVE","DOJ"].includes(f.name)).map((f) => (
                    <FormField key={f.name} field={f} control={control} errors={errors} />
                  ))}
                </div>

                <div className="sm-section-label">Address</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {FIELDS.filter((f) => ["ADDRESS1","ADDRESS2","ADDRESS3"].includes(f.name)).map((f) => (
                    <FormField key={f.name} field={f} control={control} errors={errors} />
                  ))}
                </div>
              </div>

              <div className="sm-modal-footer">
                <button type="button" className="sm-btn-secondary" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="sm-btn-primary" disabled={isPending}>
                  <Pencil size={13} />
                  {isPending ? "Saving..." : editRow ? "Update Staff" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete staff "${deleteRow?.STAFFNAME}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
