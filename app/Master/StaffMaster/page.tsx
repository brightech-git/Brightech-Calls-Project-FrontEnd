"use client";

import { ui } from "@/utils/ui";
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
import { useStaffList, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/hooks/StaffMaster/useStaffMaster";
import { StaffRecord, StaffRecord_Table } from "@/types/StaffMaster/StaffMaster";

// ─── Schema ───────────────────────────────────────────────────────────────────

const staffSchema = z.object({
  STAFFNAME: z.string().min(1, "Name is required"),
  MOBILENO: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  ROLE: z.string().min(1, "Role is required"),
  ADDRESS1: z.string().optional(),
  ADDRESS2: z.string().optional(),
  ADDRESS3: z.string().optional(),
  DOJ: z.string().optional(),
  ACTIVE: z.enum(["Y", "N"])
});
type StaffForm = z.infer<typeof staffSchema>;

// ─── Field Options ────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [{
  label: "Admin",
  value: "ADMIN"
}, {
  label: "Manager",
  value: "MANAGER"
}, {
  label: "Operator",
  value: "OPERATOR"
}, {
  label: "Staff",
  value: "STAFF"
}, {
  label: "Developer",
  value: "DEVELOPER"
}];

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<StaffRecord_Table>[] = [{
  key: "SNO",
  header: "#",
  align: "center",
  width: "50px"
}, {
  key: "STAFFID",
  header: "Staff ID",
  sortable: true,
  width: "90px"
}, {
  key: "STAFFNAME",
  header: "Name",
  sortable: true
}, {
  key: "MOBILENO",
  header: "Mobile",
  sortable: true
}, {
  key: "ROLE",
  header: "Role",
  sortable: true
}, {
  key: "DOJ",
  header: "DOJ",
  sortable: true
}, {
  key: "ACTIVE",
  header: "Status",
  sortable: true,
  render: row => <span style={{
    background: row.ACTIVE === "Y" ? COLORS.successBg : COLORS.errorBg,
    color: row.ACTIVE === "Y" ? COLORS.success : COLORS.error
  }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:var(--font-xs)] [font-weight:600]")}>
        {row.ACTIVE === "Y" ? "Active" : "Inactive"}
      </span>
}];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffMasterPage() {
  usePageHeader({
    title: "Staff Master",
    subtitle: "Manage your staff records"
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<StaffRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<StaffRecord | null>(null);
  const {
    data: staffList = [],
    isLoading
  } = useStaffList();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      STAFFNAME: "",
      MOBILENO: "",
      ROLE: "",
      ADDRESS1: "",
      ADDRESS2: "",
      ADDRESS3: "",
      DOJ: "",
      ACTIVE: "Y"
    }
  });
  const openCreate = () => {
    setEditRow(null);
    reset({
      STAFFNAME: "",
      MOBILENO: "",
      ROLE: "",
      ADDRESS1: "",
      ADDRESS2: "",
      ADDRESS3: "",
      DOJ: "",
      ACTIVE: "Y"
    });
    setOpen(true);
  };
  const openEdit = (row: StaffRecord_Table) => {
    const r = row as StaffRecord;
    setEditRow(r);
    reset({
      STAFFNAME: r.STAFFNAME ?? "",
      MOBILENO: r.MOBILENO ?? "",
      ROLE: r.ROLE ?? "",
      ADDRESS1: r.ADDRESS1 ?? "",
      ADDRESS2: r.ADDRESS2 ?? "",
      ADDRESS3: r.ADDRESS3 ?? "",
      DOJ: r.DOJ ?? "",
      ACTIVE: r.ACTIVE === "N" ? "N" : "Y"
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
          DOJ: formatDOJ(data.DOJ),
          SNO: editRow.SNO,
          STAFFID: editRow.STAFFID,
          USERID: editRow.USERID ?? null
        };
        console.log("[StaffMaster] UPDATE payload:", payload);
        const res = await updateMutation.mutateAsync({
          id: editRow.STAFFID,
          payload
        });
        console.log("[StaffMaster] UPDATE response:", res);
        toast.success("Staff Updated", `"${res.STAFFNAME}" updated successfully.`);
      } else {
        const payload = {
          ...data,
          DOJ: formatDOJ(data.DOJ)
        };
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
      }
    });
  };
  return <>
      

      {/* Table */}
      <CustomTable title="All Staff" columns={COLUMNS} data={staffList as StaffRecord_Table[]} rowKey="SNO" isLoading={isLoading} onEdit={openEdit} onDelete={handleDelete} searchPlaceholder="Search by name, role, mobile..." emptyMessage="No staff found. Add your first record." toolbarRight={<button className={ui("sm-btn-primary")} onClick={openCreate}>
            <Plus size={14} /> Add Staff
          </button>} />

      {/* Modal */}
      {open && <div className={ui("sm-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("sm-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Staff details">
            <div className={ui("sm-modal-head")}>
              <div>
                <div className={ui("sm-modal-title")}>{editRow ? "Edit Staff" : "Add New Staff"}</div>
                <div className={ui("sm-modal-sub")}>
                  {editRow ? `Editing: ${editRow.STAFFNAME}` : "Fill in the details below"}
                </div>
              </div>
              <button className={ui("sm-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={ui("sm-modal-body")}>
                <div className={ui("sm-section-label")}>Basic Information</div>
                <div className={ui("[display:flex] [flex-direction:column] [gap:6px]")}>
                  <div className={ui("sm-field-row")}>
                    <label className={ui("sm-field-label")}>Staff Name *</label>
                    <Controller name="STAFFNAME" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="STAFFNAME" onChange={(_, value) => field.onChange(value)} placeholder="Enter staff name" isCapitalized className={ui("[max-width:100%]!")} />} />
                    {errors.STAFFNAME && <span className={ui("sm-field-error")}>{errors.STAFFNAME.message}</span>}
                  </div>

                  <div className={ui("sm-field-row")}>
                    <label className={ui("sm-field-label")}>Mobile No *</label>
                    <Controller name="MOBILENO" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="MOBILENO" onChange={(_, value) => field.onChange(value)} placeholder="e.g. 9659721856" inputModeType="mobile" className={ui("[max-width:100%]!")} />} />
                    {errors.MOBILENO && <span className={ui("sm-field-error")}>{errors.MOBILENO.message}</span>}
                  </div>

                  <div className={ui("sm-field-row")}>
                    <label className={ui("sm-field-label")}>Role *</label>
                    <Controller name="ROLE" control={control} render={({
                  field
                }) => <SelectCombobox value={field.value || undefined} onChange={val => field.onChange(val)} items={ROLE_OPTIONS} placeholder="Select role" className={ui("[max-width:100%]!")} />} />
                    {errors.ROLE && <span className={ui("sm-field-error")}>{errors.ROLE.message}</span>}
                  </div>

                  <div className={ui("sm-field-row")}>
                    <label className={ui("sm-field-label")}>Status</label>
                    <Controller name="ACTIVE" control={control} render={({
                  field
                }) => <SwitchInput value={field.value} onChange={field.onChange} trueValue="Y" falseValue="N" labels={{
                  on: "Active",
                  off: "Inactive"
                }} size="sm" />} />
                    {errors.ACTIVE && <span className={ui("sm-field-error")}>{errors.ACTIVE.message}</span>}
                  </div>

                  <div className={ui("sm-field-row")}>
                    <label className={ui("sm-field-label")}>Date of Join</label>
                    <Controller name="DOJ" control={control} render={({
                  field
                }) => <DatePickerInput value={field.value} onChange={iso => field.onChange(iso)} placeholder="dd-mm-yyyy" />} />
                    {errors.DOJ && <span className={ui("sm-field-error")}>{errors.DOJ.message}</span>}
                  </div>
                </div>

                <div className={ui("sm-section-label")}>Address</div>
                <div className={ui("[display:flex] [flex-direction:column] [gap:6px]")}>
                  <div className={ui("sm-field-row")}>
                    <label className={ui("sm-field-label")}>Address 1</label>
                    <Controller name="ADDRESS1" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS1" onChange={(_, value) => field.onChange(value)} placeholder="Street" className={ui("[max-width:100%]!")} />} />
                    {errors.ADDRESS1 && <span className={ui("sm-field-error")}>{errors.ADDRESS1.message}</span>}
                  </div>

                  <div className={ui("sm-field-row")}>
                    <label className={ui("sm-field-label")}>Address 2</label>
                    <Controller name="ADDRESS2" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS2" onChange={(_, value) => field.onChange(value)} placeholder="Area" className={ui("[max-width:100%]!")} />} />
                    {errors.ADDRESS2 && <span className={ui("sm-field-error")}>{errors.ADDRESS2.message}</span>}
                  </div>

                  <div className={ui("sm-field-row")}>
                    <label className={ui("sm-field-label")}>City</label>
                    <Controller name="ADDRESS3" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="ADDRESS3" onChange={(_, value) => field.onChange(value)} placeholder="City" className={ui("[max-width:100%]!")} />} />
                    {errors.ADDRESS3 && <span className={ui("sm-field-error")}>{errors.ADDRESS3.message}</span>}
                  </div>
                </div>
              </div>

              <div className={ui("sm-modal-footer")}>
                <button type="button" className={ui("sm-btn-secondary")} onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={ui("sm-btn-primary")} disabled={isPending}>
                  <Pencil size={13} />
                  {isPending ? "Saving..." : editRow ? "Update Staff" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete staff "${deleteRow?.STAFFNAME}"? This action cannot be undone.`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />
    </>;
}
