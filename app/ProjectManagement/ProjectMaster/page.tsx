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
import { MultiSelectCombobox } from "@/components/ui/MultiSelectCombobox";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";

import {
  useProjectList,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/ProjectMaster/useProjectMaster";
import { useStaffAdminUsers } from "@/hooks/UserMaster/useUserMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";

import {
  ProjectRecord,
  ProjectRecord_Table,
} from "@/types/ProjectMaster/ProjectMaster";

// ─────────────────────────────────────────────
// Status options
// ─────────────────────────────────────────────

const DEFAULT_STATUSES = [
  "Basic Need To Start",
  "Work On It",
  "Testing Process",
  "Completed",
];

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const projectSchema = z.object({
  CLIENTID: z.number().min(1, "Client is required"),
  PROJECTNAME: z.string().min(1, "Project name is required"),
  STATUS: z.string().min(1, "Status is required"),
  ASSIGNEDTO: z.string().optional(),
  ACTIVE: z.enum(["Y", "N"]),
});

type ProjectForm = z.infer<typeof projectSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectRecord_Table>[] = [
  { key: "projectId", header: "ID", sortable: true, width: "60px", align: "center" },
  { key: "clientName", header: "Client", sortable: true },
  { key: "projectName", header: "Project Name", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.status === "Completed" ? COLORS.successBg : COLORS.infoBg,
        color: row.status === "Completed" ? COLORS.success : COLORS.info,
      }}>
        {(row.status as string) || "-"}
      </span>
    ),
  },
  {
    key: "assignedToMap",
    header: "Assigned Staff",
    render: (row) => {
      const map = row.assignedToMap as Record<string, string> | null;
      if (!map || Object.keys(map).length === 0) return "-";
      return Object.values(map).join(", ");
    },
  },
  {
    key: "active",
    header: "Active",
    sortable: true,
    width: "80px",
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.active === "Y" ? COLORS.successBg : COLORS.errorBg,
        color: row.active === "Y" ? COLORS.success : COLORS.error,
      }}>
        {row.active === "Y" ? "Yes" : "No"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ProjectForm = {
  CLIENTID: 0,
  PROJECTNAME: "",
  STATUS: "Basic Need To Start",
  ASSIGNEDTO: "",
  ACTIVE: "Y",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectMasterPage() {
  usePageHeader({
    title: "Project Master",
    subtitle: "Manage project records",
  });

  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ProjectRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ProjectRecord | null>(null);
  const [customStatus, setCustomStatus] = useState("");

  const { data: clients = [] } = useClientList();
  const { data: staffAdminUsers = [] } = useStaffAdminUsers();
  const { data: projects = [], isLoading } = useProjectList();

  // Dropdown items (Client Master is now the source of truth for client identity)
  const clientItems = clients.map((c) => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID),
  }));

  const staffItems = staffAdminUsers.map((u) => ({
    label: `${u.staffName || u.username}${u.roleId === 2 ? " (Admin)" : ""}`,
    value: String(u.userId),
  }));

  const statusItems = DEFAULT_STATUSES.map((s) => ({
    label: s,
    value: s,
  }));

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: DEFAULTS,
  });

  const watchedStatus = watch("STATUS");

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    setCustomStatus("");
    reset(DEFAULTS);
    setOpen(true);
  };

  const openEdit = (row: ProjectRecord_Table) => {
    const r = row as ProjectRecord;
    setEditRow(r);
    setCustomStatus("");

    reset({
      CLIENTID: r.clientId ?? 0,
      PROJECTNAME: r.projectName ?? "",
      STATUS: r.status ?? "Basic Need To Start",
      ASSIGNEDTO: r.assignedTo ?? "",
      ACTIVE: r.active === "N" ? "N" : "Y",
    });

    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (data: ProjectForm) => {
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.sno),
          payload: data,
        });
        toast.success("Project Updated", `"${res.projectName}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync(data);
        toast.success("Project Created", `"${res.projectName}" created successfully.`);
      }

      setOpen(false);
      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(
        editRow ? "Update Failed" : "Create Failed",
        err?.response?.data?.message || err?.message || "Operation failed."
      );
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;

    deleteMutation.mutate(String(deleteRow.sno), {
      onSuccess: () => {
        toast.success("Project Deleted", `"${deleteRow.projectName}" deleted successfully.`);
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      },
    });
  };

  // ─────────────────────────

  const handleAddCustomStatus = () => {
    const trimmed = customStatus.trim();
    if (trimmed) {
      setValue("STATUS", trimmed);
      setCustomStatus("");
    }
  };

  // ─────────────────────────

  return (
    <>
      <style>{`
        .pm-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 16px;
        }
        .pm-modal-box {
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl};
          width: 100%; max-width: 750px;
          font-family: ${FONT.family};
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
          animation: pm-slide-up 0.18s ease;
        }
        @keyframes pm-slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .pm-modal-head {
          padding: 12px 16px;
          border-bottom: 1px solid ${COLORS.cardBorder};
          display: flex; align-items: center; justify-content: space-between;
          background: ${COLORS.gray50};
          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
        }
        .pm-modal-title { font-size: 14px; font-weight: 700; color: ${COLORS.textPrimary}; }
        .pm-modal-sub { font-size: 11px; color: ${COLORS.textMuted}; margin-top: 2px; }
        .pm-modal-body { padding: 16px; }
        .pm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }
        .pm-field-row { display: flex; flex-direction: column; gap: 4px; }
        .pm-field-full { grid-column: 1 / -1; }
        .pm-field-label { font-size: 12px; font-weight: 600; color: ${COLORS.textSecondary}; }
        .pm-field-error { font-size: 11px; color: ${COLORS.error}; }
        .pm-modal-footer {
          padding: 12px 16px;
          border-top: 1px solid ${COLORS.cardBorder};
          display: flex; justify-content: flex-end; gap: 8px;
          background: ${COLORS.gray50};
          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
        }
        .pm-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px;
          border-radius: ${RADIUS.md}; border: none;
          background: ${COLORS.btnPrimaryBg}; color: ${COLORS.btnPrimaryText};
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .pm-btn-primary:hover { background: ${COLORS.btnPrimaryHover}; }
        .pm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .pm-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 16px; height: 34px;
          border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.btnSecondaryBorder};
          background: ${COLORS.btnSecondaryBg}; color: ${COLORS.btnSecondaryText};
          font-size: 12px; font-weight: 500; cursor: pointer;
        }
        .pm-close-btn {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1px solid ${COLORS.cardBorder};
          background: ${COLORS.cardBg}; cursor: pointer;
        }
        .pm-custom-status-row {
          display: flex; gap: 6px; align-items: center; margin-top: 6px;
        }
        .pm-custom-status-input {
          flex: 1; padding: 4px 10px; font-size: 12px;
          border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.md};
          font-family: ${FONT.family};
          text-transform: uppercase;
        }
        .pm-custom-status-input:focus {
          outline: none;
          border-color: ${COLORS.btnPrimaryBg};
        }
        .pm-custom-status-btn {
          padding: 4px 12px; font-size: 11px; font-weight: 600;
          border: none; border-radius: ${RADIUS.md};
          background: ${COLORS.btnPrimaryBg}; color: ${COLORS.btnPrimaryText};
          cursor: pointer; white-space: nowrap;
        }
        .pm-status-current {
          font-size: 11px; color: ${COLORS.textMuted}; margin-top: 4px;
        }
      `}</style>

      {/* Table */}
      <CustomTable
        title="All Projects"
        columns={COLUMNS}
        data={projects as ProjectRecord_Table[]}
        rowKey="sno"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as ProjectRecord)}
        searchPlaceholder="Search project..."
        emptyMessage="No projects found."
        toolbarRight={
          <button className="pm-btn-primary" onClick={openCreate}>
            <Plus size={13} />
            Add Project
          </button>
        }
      />

      {/* Modal */}
      {open && (
        <div
          className="pm-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="pm-modal-box">
            <div className="pm-modal-head">
              <div>
                <div className="pm-modal-title">
                  {editRow ? "Edit Project" : "Add Project"}
                </div>
                <div className="pm-modal-sub">
                  {editRow ? `Editing: ${editRow.projectName}` : "Fill project details"}
                </div>
              </div>
              <button className="pm-close-btn" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="pm-modal-body">
                <div className="pm-grid">
                  {/* Client (from Client Master - ClientMast) */}
                  <div className="pm-field-row">
                    <label className="pm-field-label">Client *</label>
                    <Controller
                      name="CLIENTID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          editId={editRow?.sno ?? null}
                          items={clientItems}
                          placeholder="Select client"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.CLIENTID && (
                      <span className="pm-field-error">{errors.CLIENTID.message}</span>
                    )}
                  </div>

                  {/* Project Name */}
                  <div className="pm-field-row">
                    <label className="pm-field-label">Project Name *</label>
                    <Controller
                      name="PROJECTNAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="PROJECTNAME"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter project name"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.PROJECTNAME && (
                      <span className="pm-field-error">{errors.PROJECTNAME.message}</span>
                    )}
                  </div>

                  {/* Status (dropdown + custom input) */}
                  <div className="pm-field-row">
                    <label className="pm-field-label">Status *</label>
                    <Controller
                      name="STATUS"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value || undefined}
                          onChange={(val) => field.onChange(val)}
                          editId={editRow?.sno ?? null}
                          items={statusItems}
                          placeholder="Select status"
                          maxWidth="100%"
                        />
                      )}
                    />
                    <div className="pm-custom-status-row">
                      <input
                        className="pm-custom-status-input"
                        placeholder="Or type custom status..."
                        value={customStatus}
                        onChange={(e) => setCustomStatus(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomStatus();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="pm-custom-status-btn"
                        onClick={handleAddCustomStatus}
                      >
                        Set
                      </button>
                    </div>
                    {watchedStatus && !DEFAULT_STATUSES.includes(watchedStatus) && (
                      <div className="pm-status-current">
                        Custom: {watchedStatus}
                      </div>
                    )}
                    {errors.STATUS && (
                      <span className="pm-field-error">{errors.STATUS.message}</span>
                    )}
                  </div>

                  {/* Active */}
                  <div className="pm-field-row">
                    <label className="pm-field-label">Active</label>
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
                    {errors.ACTIVE && (
                      <span className="pm-field-error">{errors.ACTIVE.message}</span>
                    )}
                  </div>

                  {/* Assigned Staff/Admin (multi-select, full width) */}
                  <div className="pm-field-row pm-field-full">
                    <label className="pm-field-label">Assign Staff / Admin</label>
                    <Controller
                      name="ASSIGNEDTO"
                      control={control}
                      render={({ field }) => {
                        const selectedValues = field.value
                          ? field.value.split(",").filter(Boolean)
                          : [];
                        return (
                          <MultiSelectCombobox
                            value={selectedValues}
                            onChange={(vals) => field.onChange(vals.join(","))}
                            editId={editRow?.sno ?? null}
                            items={staffItems}
                            placeholder="Select staff/admin to assign"
                            maxWidth="100%"
                          />
                        );
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pm-modal-footer">
                <button
                  type="button"
                  className="pm-btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="pm-btn-primary" disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.projectName}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
