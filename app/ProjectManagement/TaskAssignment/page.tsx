"use client";

import { useState, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { SwitchInput } from "@/components/ui/SwitchInput";

import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";

import { COLORS, FONT, RADIUS } from "@/utils/theme";

import {
  useCallsBookingList,
  useCreateCallsBooking,
  useUpdateCallsBooking,
  useDeleteCallsBooking,
} from "@/hooks/TaskAssignment/useTaskAssignment";
import { useCompanyList } from "@/hooks/CompanyMaster/useCompanyMaster";
import { useClientList }  from "@/hooks/ClientMaster/useClientMaster";
import { useProjectList } from "@/hooks/ProjectMaster/useProjectMaster";
import { useModuleList }  from "@/hooks/ModuleMaster/useModuleMaster";
import { useStaffList }   from "@/hooks/StaffMaster/useStaffMaster";

import {
  CallsBookingRecord,
  CallsBookingRecord_Table,
} from "@/types/TaskAssignment/TaskAssignment";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const callsBookingSchema = z.object({
  COMPID:      z.number().min(1, "Company is required"),
  CLIENTID:    z.number().min(1, "Client is required"),
  PROJECTID:   z.string().optional(),
  PROJECTNAME: z.string().optional(),
  MODULEID:    z.string().optional(),
  MODULENAME:  z.string().optional(),
  DESCRIPTION: z.string().optional(),
  REMARK:      z.string().optional(),
  STAFFID:     z.string().min(1, "Staff is required"),
  STATUS:      z.string().optional(),
  ACTIVE:      z.enum(["Y", "N"]),
});

type CallsBookingForm = z.infer<typeof callsBookingSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallsBookingRecord_Table>[] = [
  { key: "TKTID",       header: "Ticket ID",   sortable: true, width: "90px" },
  { key: "COMPANYNAME", header: "Company",     sortable: true },
  { key: "CLIENTNAME",  header: "Client",      sortable: true, render: (row) => (row.CLIENTNAME as string) || "-" },
  { key: "PROJECTNAME", header: "Project",     sortable: true },
  { key: "MODULENAME",  header: "Module",      sortable: true },
  { key: "STAFFNAME",   header: "Staff",       sortable: true },
  { key: "TKTDATE",     header: "Date",        sortable: true, render: (row) => row.TKTDATE ? new Date(row.TKTDATE as string).toLocaleDateString() : "-" },
  {
    key: "STATUS",
    header: "Status",
    sortable: true,
    render: (row) => {
      const s = row.STATUS as string;
      const bg = s === "C" || s === "COMPLETED" ? COLORS.successBg : s === "X" || s === "CANCELLED" ? COLORS.errorBg : COLORS.warningBg;
      const color = s === "C" || s === "COMPLETED" ? COLORS.success : s === "X" || s === "CANCELLED" ? COLORS.error : COLORS.warning;
      const label = s === "O" ? "Open" : s === "I" || s === "INPROGRESS" ? "In Progress" : s === "C" || s === "COMPLETED" ? "Completed" : s === "X" || s === "CANCELLED" ? "Cancelled" : s;
      return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>{label}</span>;
    },
  },
  {
    key: "ACTIVE",
    header: "Active",
    render: (row) => (
      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.ACTIVE === "Y" ? COLORS.successBg : COLORS.errorBg,
        color: row.ACTIVE === "Y" ? COLORS.success : COLORS.error,
      }}>
        {row.ACTIVE === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULTS: CallsBookingForm = {
  COMPID:      0,
  CLIENTID:    0,
  PROJECTID:   "",
  PROJECTNAME: "",
  MODULEID:    "",
  MODULENAME:  "",
  DESCRIPTION: "",
  REMARK:      "",
  STAFFID:     "",
  STATUS:      "O",
  ACTIVE:      "Y",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallsBookingPage() {
  usePageHeader({
    title: "Calls Booking",
    subtitle:
      "Manage calls & task assignments",
  });

  const toast = useToast();

  const [open, setOpen] =
    useState(false);

  const [editRow, setEditRow] =
    useState<CallsBookingRecord | null>(
      null
    );

  const [deleteRow, setDeleteRow] =
    useState<CallsBookingRecord | null>(
      null
    );

  const { data: companies = [] } = useCompanyList();
  const { data: clients   = [] } = useClientList();
  const { data: projects  = [] } = useProjectList();
  const { data: modules   = [] } = useModuleList();
  const { data: staffList = [] } = useStaffList();

  const {
    data: bookings = [],
    isLoading,
  } = useCallsBookingList();

  const createMutation =
    useCreateCallsBooking();

  const updateMutation =
    useUpdateCallsBooking();

  const deleteMutation =
    useDeleteCallsBooking();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CallsBookingForm>({
    resolver: zodResolver(callsBookingSchema),
    defaultValues: DEFAULTS,
  });

  const watchedProjectId = useWatch({ control, name: "PROJECTID" });
  const watchedModuleId  = useWatch({ control, name: "MODULEID" });

  // Auto-select company when only one exists
  useEffect(() => {
    if (companies.length === 1) setValue("COMPID", companies[0].COMPID);
  }, [companies]);

  // Auto-fill PROJECTNAME when PROJECTID changes
  useEffect(() => {
    const p = projects.find((p) => String(p.projectId) === String(watchedProjectId));
    if (p) setValue("PROJECTNAME", p.projectName ?? "");
  }, [watchedProjectId, projects]);

  // Auto-fill MODULENAME when MODULEID changes
  useEffect(() => {
    const m = modules.find((m) => String(m.moduleId) === String(watchedModuleId));
    if (m) setValue("MODULENAME", m.moduleName ?? "");
  }, [watchedModuleId, modules]);

  const companyItems = companies.map((c) => ({ label: c.COMPANYNAME, value: String(c.COMPID) }));
  const clientItems  = clients.map((c) => ({ label: c.CLIENTNAME, value: String(c.CLIENTID) }));
  const projectItems = projects.map((p) => ({ label: p.projectName, value: String(p.projectId) }));
  const moduleItems  = modules.map((m) => ({ label: m.moduleName, value: String(m.moduleId) }));
  const staffItems   = staffList.map((s) => ({ label: s.STAFFNAME ?? "", value: String(s.STAFFID) }));

  const statusItems = [
    { label: "Open",        value: "O" },
    { label: "In Progress", value: "I" },
    { label: "Completed",   value: "C" },
    { label: "Cancelled",   value: "X" },
  ];

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    const defaultCompId = companies.length === 1 ? companies[0].COMPID : 0;
    reset({ ...DEFAULTS, COMPID: defaultCompId });
    setOpen(true);
  };

  const openEdit = (
    row: CallsBookingRecord_Table
  ) => {
    const r =
      row as CallsBookingRecord;

    setEditRow(r);

    reset({
      COMPID:      r.COMPID,
      CLIENTID:    r.CLIENTID,
      PROJECTID:   r.PROJECTID  || "",
      PROJECTNAME: r.PROJECTNAME || "",
      MODULEID:    r.MODULEID   || "",
      MODULENAME:  r.MODULENAME  || "",
      DESCRIPTION: r.DESCRIPTION || "",
      REMARK:      r.REMARK      || "",
      STAFFID:     r.STAFFID,
      STATUS:      r.STATUS      || "O",
      ACTIVE:      r.ACTIVE === "N" ? "N" : "Y",
    });

    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (
    data: CallsBookingForm
  ) => {
    try {
      if (editRow) {
        const res =
          await updateMutation.mutateAsync(
            {
              id: String(editRow.SNO),
              payload: data,
            }
          );

        toast.success(
          "Booking Updated",
          `"${res.TKTID}" updated successfully.`
        );
      } else {
        const res =
          await createMutation.mutateAsync(
            data
          );

        toast.success(
          "Booking Created",
          `"${res.TKTID}" created successfully.`
        );
      }

      setOpen(false);

      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(
        editRow
          ? "Update Failed"
          : "Create Failed",

        err?.response?.data
          ?.message ||
          err?.message ||
          "Operation failed."
      );
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;

    deleteMutation.mutate(
      String(deleteRow.SNO),

      {
        onSuccess: () => {
          toast.success(
            "Booking Deleted",
            `Ticket "${deleteRow.TKTID}" deleted successfully.`
          );

          setDeleteRow(null);
        },

        onError: (err: any) => {
          toast.error(
            "Delete Failed",

            err?.response?.data
              ?.message ||
              "Delete failed."
          );

          setDeleteRow(null);
        },
      }
    );
  };

  // ─────────────────────────

  return (
    <>
      <style>{`
        .cb-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);

          display: flex;
          align-items: flex-start;
          justify-content: center;

          z-index: 1000;

          padding: 10px 16px;

          overflow-y: auto;
        }

        .cb-modal-box {
          background: ${COLORS.cardBg};

          border: 1px solid ${COLORS.cardBorder};

          border-radius: ${RADIUS.xl};

          width: 100%;
          max-width: 960px;

          height: 90vh;

          display: flex;
          flex-direction: column;

          font-family: ${FONT.family};

          box-shadow: 0 8px 32px rgba(0,0,0,0.14);

          animation: cb-slide-up 0.18s ease;
        }

        .cb-modal-box form {
          display: flex;
          flex-direction: column;

          flex: 1;
          min-height: 0;
        }

        @keyframes cb-slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .cb-modal-head {
          padding: 10px 14px 8px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: ${COLORS.gray50};

          border-radius: ${RADIUS.xl}
            ${RADIUS.xl} 0 0;

          flex-shrink: 0;
        }

        .cb-modal-title {
          font-size: 13px;
          font-weight: 700;

          color: ${COLORS.textPrimary};
        }

        .cb-modal-sub {
          font-size: 10px;
          color: ${COLORS.textMuted};

          margin-top: 1px;
        }

        .cb-modal-body {
          padding: 10px 14px;

          overflow-y: auto;

          flex: 1;
          min-height: 0;
        }

        .cb-modal-footer {
          padding: 8px 14px;

          border-top: 1px solid ${COLORS.cardBorder};

          display: flex;
          justify-content: flex-end;
          gap: 8px;

          background: ${COLORS.gray50};

          border-radius: 0 0
            ${RADIUS.xl}
            ${RADIUS.xl};

          flex-shrink: 0;
        }

        .cb-section-label {
          font-size: 9px;
          font-weight: 700;

          letter-spacing: 0.1em;

          text-transform: uppercase;

          color: ${COLORS.textMuted};

          padding-bottom: 4px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          margin-bottom: 6px;
          margin-top: 10px;
        }

        .cb-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 24px;
        }

        .cb-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cb-field-label {
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }

        .cb-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }

        .cb-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 0 16px;
          height: 34px;

          border-radius: ${RADIUS.md};

          border: none;

          background: ${COLORS.btnPrimaryBg};

          color: ${COLORS.btnPrimaryText};

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;
        }

        .cb-btn-primary:hover {
          background: ${COLORS.btnPrimaryHover};
        }

        .cb-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cb-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 0 16px;
          height: 34px;

          border-radius: ${RADIUS.md};

          border: 1px solid ${COLORS.btnSecondaryBorder};

          background: ${COLORS.btnSecondaryBg};

          color: ${COLORS.btnSecondaryText};

          font-size: 12px;
          font-weight: 500;

          cursor: pointer;
        }

        .cb-close-btn {
          width: 26px;
          height: 26px;

          border-radius: 6px;

          border: 1px solid ${COLORS.cardBorder};

          background: ${COLORS.cardBg};

          cursor: pointer;
        }
      `}</style>

      {/* Table */}

      <CustomTable
        title="All Calls Bookings"
        columns={COLUMNS}
        data={
          bookings as CallsBookingRecord_Table[]
        }
        rowKey="SNO"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) =>
          setDeleteRow(
            row as CallsBookingRecord
          )
        }
        searchPlaceholder="Search ticket, project, module..."
        emptyMessage="No bookings found."
        toolbarRight={
          <button
            className="cb-btn-primary"
            onClick={openCreate}
          >
            <Plus size={13} />
            Add Booking
          </button>
        }
      />

      {/* Modal */}

      {open && (
        <div
          className="cb-modal-overlay"
          onClick={(e) =>
            e.target ===
              e.currentTarget &&
            setOpen(false)
          }
        >
          <div className="cb-modal-box">
            <div className="cb-modal-head">
              <div>
                <div className="cb-modal-title">
                  {editRow
                    ? "Edit Booking"
                    : "Add Booking"}
                </div>

                <div className="cb-modal-sub">
                  {editRow
                    ? `Editing Ticket: ${editRow.TKTID}`
                    : "Fill booking details"}
                </div>
              </div>

              <button
                className="cb-close-btn"
                onClick={() =>
                  setOpen(false)
                }
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(
                onSubmit
              )}
            >
              <div className="cb-modal-body">
                <div className="cb-section-label">
                  Basic Information
                </div>

                <div className="cb-grid-2">
                  <div className="cb-field-row">
                    <label className="cb-field-label">Company *</label>
                    <Controller
                      name="COMPID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          editId={editRow?.SNO ?? null}
                          items={companyItems}
                          placeholder="Select company"
                          disable={companies.length === 1}
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.COMPID && <span className="cb-field-error">{errors.COMPID.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Client *</label>
                    <Controller
                      name="CLIENTID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          editId={editRow?.SNO ?? null}
                          items={clientItems}
                          placeholder="Select client"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.CLIENTID && <span className="cb-field-error">{errors.CLIENTID.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Project</label>
                    <Controller
                      name="PROJECTID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          editId={editRow?.SNO ?? null}
                          items={projectItems}
                          placeholder="Select project"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.PROJECTID && <span className="cb-field-error">{errors.PROJECTID.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Module</label>
                    <Controller
                      name="MODULEID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          editId={editRow?.SNO ?? null}
                          items={moduleItems}
                          placeholder="Select module"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.MODULEID && <span className="cb-field-error">{errors.MODULEID.message}</span>}
                  </div>
                </div>

                <div className="cb-section-label">
                  Assignment
                </div>

                <div className="cb-grid-2">
                  <div className="cb-field-row">
                    <label className="cb-field-label">Staff *</label>
                    <Controller
                      name="STAFFID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          editId={editRow?.SNO ?? null}
                          items={staffItems}
                          placeholder="Select staff"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.STAFFID && <span className="cb-field-error">{errors.STAFFID.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Status</label>
                    <Controller
                      name="STATUS"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          editId={editRow?.SNO ?? null}
                          items={statusItems}
                          placeholder="Select status"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.STATUS && <span className="cb-field-error">{errors.STATUS.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Active *</label>
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
                    {errors.ACTIVE && <span className="cb-field-error">{errors.ACTIVE.message}</span>}
                  </div>
                </div>

                <div className="cb-section-label">
                  Details
                </div>

                <div className="cb-grid-2">
                  <div className="cb-field-row">
                    <label className="cb-field-label">Description</label>
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
                        />
                      )}
                    />
                    {errors.DESCRIPTION && <span className="cb-field-error">{errors.DESCRIPTION.message}</span>}
                  </div>

                  <div className="cb-field-row">
                    <label className="cb-field-label">Remark</label>
                    <Controller
                      name="REMARK"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="REMARK"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter remarks"
                          mode="inline"
                        />
                      )}
                    />
                    {errors.REMARK && <span className="cb-field-error">{errors.REMARK.message}</span>}
                  </div>
                </div>
              </div>

              <div className="cb-modal-footer">
                <button
                  type="button"
                  className="cb-btn-secondary"
                  onClick={() =>
                    setOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="cb-btn-primary"
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? "Saving..."
                    : editRow
                    ? "Update Booking"
                    : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete ticket "${deleteRow?.TKTID}"?`}
        isPending={
          deleteMutation.isPending
        }
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteRow(null)
        }
      />
    </>
  );
}