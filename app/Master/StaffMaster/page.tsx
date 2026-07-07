"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SwitchInput } from "@/components/ui/SwitchInput";
import { DatePickerInput } from "@/components/ui/DatePicker";
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

// ─── Field Options ────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { label: "Admin",     value: "ADMIN" },
  { label: "Manager",   value: "MANAGER" },
  { label: "Operator",  value: "OPERATOR" },
  { label: "Staff",     value: "STAFF" },
  { label: "Developer", value: "DEVELOPER" },
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
        .sm-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sm-field-label {
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }
        .sm-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }
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
                  <div className="sm-field-row">
                    <label className="sm-field-label">Staff Name *</label>
                    <Controller
                      name="STAFFNAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="STAFFNAME"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter staff name"
                          isCapitalized
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.STAFFNAME && <span className="sm-field-error">{errors.STAFFNAME.message}</span>}
                  </div>

                  <div className="sm-field-row">
                    <label className="sm-field-label">Mobile No *</label>
                    <Controller
                      name="MOBILENO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="MOBILENO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. 9659721856"
                          inputModeType="mobile"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.MOBILENO && <span className="sm-field-error">{errors.MOBILENO.message}</span>}
                  </div>

                  <div className="sm-field-row">
                    <label className="sm-field-label">Role *</label>
                    <Controller
                      name="ROLE"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          items={ROLE_OPTIONS}
                          placeholder="Select role"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.ROLE && <span className="sm-field-error">{errors.ROLE.message}</span>}
                  </div>

                  <div className="sm-field-row">
                    <label className="sm-field-label">Status</label>
                    <Controller
                      name="ACTIVE"
                      control={control}
                      render={({ field }) => (
                        <SwitchInput
                          value={field.value}
                          onChange={field.onChange}
                          trueValue="Y"
                          falseValue="N"
                          labels={{ on: "Active", off: "Inactive" }}
                          size="sm"
                        />
                      )}
                    />
                    {errors.ACTIVE && <span className="sm-field-error">{errors.ACTIVE.message}</span>}
                  </div>

                  <div className="sm-field-row">
                    <label className="sm-field-label">Date of Join</label>
                    <Controller
                      name="DOJ"
                      control={control}
                      render={({ field }) => (
                        <DatePickerInput
                          value={field.value}
                          onChange={(iso) => field.onChange(iso)}
                          placeholder="dd-mm-yyyy"
                        />
                      )}
                    />
                    {errors.DOJ && <span className="sm-field-error">{errors.DOJ.message}</span>}
                  </div>
                </div>

                <div className="sm-section-label">Address</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="sm-field-row">
                    <label className="sm-field-label">Address 1</label>
                    <Controller
                      name="ADDRESS1"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS1"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Street"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.ADDRESS1 && <span className="sm-field-error">{errors.ADDRESS1.message}</span>}
                  </div>

                  <div className="sm-field-row">
                    <label className="sm-field-label">Address 2</label>
                    <Controller
                      name="ADDRESS2"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS2"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Area"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.ADDRESS2 && <span className="sm-field-error">{errors.ADDRESS2.message}</span>}
                  </div>

                  <div className="sm-field-row">
                    <label className="sm-field-label">City</label>
                    <Controller
                      name="ADDRESS3"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS3"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="City"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.ADDRESS3 && <span className="sm-field-error">{errors.ADDRESS3.message}</span>}
                  </div>
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
