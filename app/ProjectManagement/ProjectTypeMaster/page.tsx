"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import { DataExport, ExportColumn } from "@/components/DataExport";
import ConfirmDialog from "@/components/ConfirmDialog";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SwitchInput } from "@/components/ui/SwitchInput";

import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";

import { COLORS, FONT, RADIUS } from "@/utils/theme";

import {
  useProjectTypeList,
  useCreateProjectType,
  useUpdateProjectType,
  useDeleteProjectType,
} from "@/hooks/ProjectTypeMaster/useProjectTypeMaster";

import {
  ProjectTypeRecord,
  ProjectTypeRecord_Table,
} from "@/types/ProjectTypeMaster/ProjectTypeMaster";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const projectTypeSchema = z.object({
  projectTypeName: z.string().min(1, "Project type name is required"),
  displayOrder: z.number().min(0, "Display order must be 0 or greater"),
  active: z.boolean(),
});

type ProjectTypeForm = z.infer<typeof projectTypeSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectTypeRecord_Table>[] = [
  { key: "projectTypeId",   header: "ID",             sortable: true, width: "80px", align: "center" },
  { key: "projectTypeName", header: "Project Type Name", sortable: true },
  { key: "displayOrder",    header: "Display Order",  sortable: true, width: "130px", align: "center" },
  {
    key: "active",
    header: "Status",
    sortable: true,
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.active  ? COLORS.successBg : COLORS.errorBg,
        color:      row.active  ? COLORS.success   : COLORS.error,
      }}>
        {row.active ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Export Columns
// ─────────────────────────────────────────────

const EXPORT_COLUMNS: ExportColumn<ProjectTypeRecord_Table>[] = [
  { key: "projectTypeId",   label: "ID" },
  { key: "projectTypeName", label: "Project Type Name" },
  { key: "displayOrder",    label: "Display Order" },
  { key: "active",          label: "Status", exportValue: (v) => v === "Y" ? "Active" : "Inactive" },
];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ProjectTypeForm = {
  projectTypeName: "",
  displayOrder: 0,
  active: true,
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectTypeMasterPage() {
  usePageHeader({
    title: "Project Type Master",
    subtitle: "Manage project type records",
  });

  const toast = useToast();

  const [open, setOpen] = useState(false);

  const [editRow, setEditRow] =
    useState<ProjectTypeRecord | null>(null);

  const [deleteRow, setDeleteRow] =
    useState<ProjectTypeRecord | null>(null);

  const { data: projectTypes = [], isLoading } = useProjectTypeList();

  console.log(projectTypes,'projectTypes')

  const createMutation = useCreateProjectType();
  const updateMutation = useUpdateProjectType();
  const deleteMutation = useDeleteProjectType();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,

    formState: { errors },
  } = useForm<ProjectTypeForm>({
    resolver: zodResolver(projectTypeSchema),
    defaultValues: DEFAULTS,
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);

    reset(DEFAULTS);

    setOpen(true);
  };

  const openEdit = (
    row: ProjectTypeRecord_Table
  ) => {
    const r = row as ProjectTypeRecord;

    setEditRow(r);

    reset({
      projectTypeName: r.projectTypeName ?? "",
      displayOrder: r.displayOrder ?? 0,
      active: r.active
    });

    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (
    data: ProjectTypeForm
  ) => {
    try {
      if (editRow) {
        const res =
          await updateMutation.mutateAsync({
            id: String(editRow.projectTypeId),
            payload: data,
          });

        toast.success(
          "Project Type Updated",
          `"${res.projectTypeName}" updated successfully.`
        );
      } else {
        const res =
          await createMutation.mutateAsync(data);

        toast.success(
          "Project Type Created",
          `"${res.projectTypeName}" created successfully.`
        );
      }

      setOpen(false);

      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(
        editRow
          ? "Update Failed"
          : "Create Failed",

        err?.response?.data?.message ||
          err?.message ||
          "Operation failed."
      );
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;

    deleteMutation.mutate(
      String(deleteRow.projectTypeId),

      {
        onSuccess: () => {
          toast.success(
            "Project Type Deleted",
            `"${deleteRow.projectTypeName}" deleted successfully.`
          );

          setDeleteRow(null);
        },

        onError: (err: any) => {
          toast.error(
            "Delete Failed",
            err?.response?.data?.message ||
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
        .ptm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
          padding: 16px;
        }

        .ptm-modal-box {
          background: ${COLORS.cardBg};

          border: 1px solid ${COLORS.cardBorder};

          border-radius: ${RADIUS.xl};

          width: 100%;
          max-width: 720px;

          font-family: ${FONT.family};

          box-shadow: 0 8px 32px rgba(0,0,0,0.14);

          animation: ptm-slide-up 0.18s ease;
        }

        @keyframes ptm-slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .ptm-modal-head {
          padding: 12px 16px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: ${COLORS.gray50};

          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
        }

        .ptm-modal-title {
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.textPrimary};
        }

        .ptm-modal-sub {
          font-size: 11px;
          color: ${COLORS.textMuted};
          margin-top: 2px;
        }

        .ptm-modal-body {
          padding: 16px;
        }

        .ptm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }

        .ptm-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ptm-field-label {
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }

        .ptm-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }

        .ptm-modal-footer {
          padding: 12px 16px;

          border-top: 1px solid ${COLORS.cardBorder};

          display: flex;
          justify-content: flex-end;
          gap: 8px;

          background: ${COLORS.gray50};

          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
        }

        .ptm-btn-primary {
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

        .ptm-btn-primary:hover {
          background: ${COLORS.btnPrimaryHover};
        }

        .ptm-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ptm-btn-secondary {
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

        .ptm-close-btn {
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
        title="All Project Types"
        columns={COLUMNS}
        data={projectTypes as ProjectTypeRecord_Table[]}
        rowKey="projectTypeId"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) =>
          setDeleteRow(row as ProjectTypeRecord)
        }
        searchPlaceholder="Search project type..."
        emptyMessage="No project types found."
        toolbarRight={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DataExport
              data={projectTypes as ProjectTypeRecord_Table[]}
              columns={EXPORT_COLUMNS}
              filename="project-type-master"
              title="Project Type Master"
              showButtons={["excel", "pdf", "print"]}
              buttonSize="sm"
            />
            <button
              className="ptm-btn-primary"
              onClick={openCreate}
            >
              <Plus size={13} />
              Add Project Type
            </button>
          </div>
        }
      />

      {/* Modal */}

      {open && (
        <div
          className="ptm-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            setOpen(false)
          }
        >
          <div className="ptm-modal-box">
            <div className="ptm-modal-head">
              <div>
                <div className="ptm-modal-title">
                  {editRow
                    ? "Edit Project Type"
                    : "Add Project Type"}
                </div>

                <div className="ptm-modal-sub">
                  {editRow
                    ? `Editing: ${editRow.projectTypeName}`
                    : "Fill project type details"}
                </div>
              </div>

              <button
                className="ptm-close-btn"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="ptm-modal-body">
                <div className="ptm-grid">
                  <div className="ptm-field-row">
                    <label className="ptm-field-label">Project Type Name *</label>
                    <Controller
                      name="projectTypeName"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="projectTypeName"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter project type name"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.projectTypeName && <span className="ptm-field-error">{errors.projectTypeName.message}</span>}
                  </div>

                  <div className="ptm-field-row">
                    <label className="ptm-field-label">Display Order *</label>
                    <Controller
                      name="displayOrder"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value != null ? String(field.value) : ""}
                          field="displayOrder"
                          type="number"
                          onChange={(_, value) => field.onChange(value === "" ? 0 : Number(value))}
                          placeholder="Enter display order"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.displayOrder && <span className="ptm-field-error">{errors.displayOrder.message}</span>}
                  </div>

                  <div className="ptm-field-row">
                    <label className="ptm-field-label">Status *</label>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <SwitchInput
                          value={field.value}
                          onChange={field.onChange}
                          labels={{ on: "Active", off: "Inactive" }}
                          size="sm"
                        />
                      )}
                    />
                    {errors.active && <span className="ptm-field-error">{errors.active.message}</span>}
                  </div>
                </div>
              </div>

              <div className="ptm-modal-footer">
                <button
                  type="button"
                  className="ptm-btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ptm-btn-primary"
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? "Saving..."
                    : editRow
                    ? "Update Project Type"
                    : "Create Project Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.projectTypeName}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
