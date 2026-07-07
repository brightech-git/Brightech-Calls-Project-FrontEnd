"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import { DataExport, ExportColumn } from "@/components/DataExport";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SwitchInput } from "@/components/ui/SwitchInput";

import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";

import { COLORS, FONT, RADIUS } from "@/utils/theme";

import {
  useModuleList,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
} from "@/hooks/ModuleMaster/useModuleMaster";
import { useProjectList } from "@/hooks/ProjectMaster/useProjectMaster";

import {
  ModuleRecord,
  ModuleRecord_Table,
} from "@/types/ModuleMaster/ModuleMaster";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const moduleSchema = z.object({
  PROJECTID: z.number().min(1, "Project is required"),
  MODULENAME: z.string().min(1, "Module name is required"),
  ACTIVE: z.enum(["Y", "N"]),
});

type ModuleForm = z.infer<typeof moduleSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ModuleRecord_Table>[] = [
  { key: "projectId",  header: "Project Name", sortable: true, render: (row) => row.projectName as string ?? "-" },
  { key: "moduleId",   header: "Module ID",    sortable: true, width: "100px", align: "center" },
  { key: "moduleName", header: "Module Name",  sortable: true },
  {
    key: "updated",
    header: "Updated",
    sortable: true,
    render: (row) => row.updated ? new Date(row.updated as string).toLocaleDateString() : "-",
  },
  {
    key: "active",
    header: "Status",
    sortable: true,
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.active === "Y" ? COLORS.successBg : COLORS.errorBg,
        color:      row.active === "Y" ? COLORS.success   : COLORS.error,
      }}>
        {row.active === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Export Columns
// ─────────────────────────────────────────────

const EXPORT_COLUMNS: ExportColumn<ModuleRecord_Table>[] = [
  { key: "projectName", label: "Project Name", exportValue: (_, row) => (row.projectName as string) ?? "-" },
  { key: "moduleId",    label: "Module ID" },
  { key: "moduleName",  label: "Module Name" },
  { key: "updated",     label: "Updated",     exportValue: (v) => v ? new Date(v as string).toLocaleDateString() : "-" },
  { key: "active",      label: "Status",      exportValue: (v) => v === "Y" ? "Active" : "Inactive" },
];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ModuleForm = {
  PROJECTID: 0,
  MODULENAME: "",
  ACTIVE: "Y",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ModuleMasterPage() {
  usePageHeader({
    title: "Module Master",
    subtitle: "Manage module records",
  });

  const toast = useToast();

  const [open, setOpen] = useState(false);

  const [editRow, setEditRow] =
    useState<ModuleRecord | null>(null);

  const [deleteRow, setDeleteRow] =
    useState<ModuleRecord | null>(null);

  const { data: projects = [] } = useProjectList();
  const { data: modules = [], isLoading } = useModuleList();

  const projectItems = projects.map((p) => ({
    label: p.projectName,
    value: String(p.projectId),
  }));

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();
  const deleteMutation = useDeleteModule();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,

    formState: { errors },
  } = useForm<ModuleForm>({
    resolver: zodResolver(moduleSchema),
    defaultValues: DEFAULTS,
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);

    reset(DEFAULTS);

    setOpen(true);
  };

  const openEdit = (
    row: ModuleRecord_Table
  ) => {
    const r = row as ModuleRecord;

    setEditRow(r);

    reset({
      PROJECTID: r.projectId,
      MODULENAME: r.moduleName ?? "",
      ACTIVE: r.active === "N" ? "N" : "Y",
    });

    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (
    data: ModuleForm
  ) => {
    try {
      if (editRow) {
        const res =
          await updateMutation.mutateAsync({
            id: String(editRow.moduleId),
            payload: data,
          });

        toast.success(
          "Module Updated",
          `"${res.moduleName}" updated successfully.`
        );
      } else {
        const res =
          await createMutation.mutateAsync(data);

        toast.success(
          "Module Created",
          `"${res.moduleName}" created successfully.`
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
      String(deleteRow.moduleId),

      {
        onSuccess: () => {
          toast.success(
            "Module Deleted",
            `"${deleteRow.moduleName}" deleted successfully.`
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
        .mm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
          padding: 16px;
        }

        .mm-modal-box {
          background: ${COLORS.cardBg};

          border: 1px solid ${COLORS.cardBorder};

          border-radius: ${RADIUS.xl};

          width: 100%;
          max-width: 720px;

          font-family: ${FONT.family};

          box-shadow: 0 8px 32px rgba(0,0,0,0.14);

          animation: mm-slide-up 0.18s ease;
        }

        @keyframes mm-slide-up {
          from {
            transform: translateY(10px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .mm-modal-head {
          padding: 12px 16px;

          border-bottom: 1px solid ${COLORS.cardBorder};

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: ${COLORS.gray50};

          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
        }

        .mm-modal-title {
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.textPrimary};
        }

        .mm-modal-sub {
          font-size: 11px;
          color: ${COLORS.textMuted};
          margin-top: 2px;
        }

        .mm-modal-body {
          padding: 16px;
        }

        .mm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }

        .mm-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mm-field-label {
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }

        .mm-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }

        .mm-modal-footer {
          padding: 12px 16px;

          border-top: 1px solid ${COLORS.cardBorder};

          display: flex;
          justify-content: flex-end;
          gap: 8px;

          background: ${COLORS.gray50};

          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
        }

        .mm-btn-primary {
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

        .mm-btn-primary:hover {
          background: ${COLORS.btnPrimaryHover};
        }

        .mm-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mm-btn-secondary {
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

        .mm-close-btn {
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
        title="All Modules"
        columns={COLUMNS}
        data={modules as ModuleRecord_Table[]}
        rowKey="moduleId"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) =>
          setDeleteRow(row as ModuleRecord)
        }
        searchPlaceholder="Search module..."
        emptyMessage="No modules found."
        toolbarRight={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DataExport
              data={modules as ModuleRecord_Table[]}
              columns={EXPORT_COLUMNS}
              filename="module-master"
              title="Module Master"
              showButtons={["excel", "pdf", "print"]}
              buttonSize="sm"
            />
            <button
              className="mm-btn-primary"
              onClick={openCreate}
            >
              <Plus size={13} />
              Add Module
            </button>
          </div>
        }
      />

      {/* Modal */}

      {open && (
        <div
          className="mm-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            setOpen(false)
          }
        >
          <div className="mm-modal-box">
            <div className="mm-modal-head">
              <div>
                <div className="mm-modal-title">
                  {editRow
                    ? "Edit Module"
                    : "Add Module"}
                </div>

                <div className="mm-modal-sub">
                  {editRow
                    ? `Editing: ${editRow.moduleName}`
                    : "Fill module details"}
                </div>
              </div>

              <button
                className="mm-close-btn"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="mm-modal-body">
                <div className="mm-grid">
                  <div className="mm-field-row">
                    <label className="mm-field-label">Project *</label>
                    <Controller
                      name="PROJECTID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          editId={editRow?.moduleId ?? null}
                          items={projectItems}
                          placeholder="Select project"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.PROJECTID && <span className="mm-field-error">{errors.PROJECTID.message}</span>}
                  </div>

                  <div className="mm-field-row">
                    <label className="mm-field-label">Module Name *</label>
                    <Controller
                      name="MODULENAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="MODULENAME"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter module name"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.MODULENAME && <span className="mm-field-error">{errors.MODULENAME.message}</span>}
                  </div>

                  <div className="mm-field-row">
                    <label className="mm-field-label">Status *</label>
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
                    {errors.ACTIVE && <span className="mm-field-error">{errors.ACTIVE.message}</span>}
                  </div>
                </div>
              </div>

              <div className="mm-modal-footer">
                <button
                  type="button"
                  className="mm-btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="mm-btn-primary"
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? "Saving..."
                    : editRow
                    ? "Update Module"
                    : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.moduleName}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}