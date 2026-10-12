"use client";

import { ui } from "@/utils/ui";
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
import { useProjectTypeList, useCreateProjectType, useUpdateProjectType, useDeleteProjectType } from "@/hooks/ProjectTypeMaster/useProjectTypeMaster";
import { ProjectTypeRecord, ProjectTypeRecord_Table } from "@/types/ProjectTypeMaster/ProjectTypeMaster";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const projectTypeSchema = z.object({
  projectTypeName: z.string().min(1, "Project type name is required"),
  displayOrder: z.number().min(0, "Display order must be 0 or greater"),
  active: z.boolean()
});
type ProjectTypeForm = z.infer<typeof projectTypeSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectTypeRecord_Table>[] = [{
  key: "projectTypeId",
  header: "ID",
  sortable: true,
  width: "80px",
  align: "center"
}, {
  key: "projectTypeName",
  header: "Project Type Name",
  sortable: true
}, {
  key: "displayOrder",
  header: "Display Order",
  sortable: true,
  width: "130px",
  align: "center"
}, {
  key: "active",
  header: "Status",
  sortable: true,
  render: row => <span style={{
    background: row.active ? COLORS.successBg : COLORS.errorBg,
    color: row.active ? COLORS.success : COLORS.error
  }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:var(--font-xs)] [font-weight:600]")}>
        {row.active ? "Active" : "Inactive"}
      </span>
}];

// ─────────────────────────────────────────────
// Export Columns
// ─────────────────────────────────────────────

const EXPORT_COLUMNS: ExportColumn<ProjectTypeRecord_Table>[] = [{
  key: "projectTypeId",
  label: "ID"
}, {
  key: "projectTypeName",
  label: "Project Type Name"
}, {
  key: "displayOrder",
  label: "Display Order"
}, {
  key: "active",
  label: "Status",
  exportValue: v => v === "Y" ? "Active" : "Inactive"
}];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ProjectTypeForm = {
  projectTypeName: "",
  displayOrder: 0,
  active: true
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectTypeMasterPage() {
  usePageHeader({
    title: "Project Type Master",
    subtitle: "Manage project type records"
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ProjectTypeRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ProjectTypeRecord | null>(null);
  const {
    data: projectTypes = [],
    isLoading
  } = useProjectTypeList();
  console.log(projectTypes, 'projectTypes');
  const createMutation = useCreateProjectType();
  const updateMutation = useUpdateProjectType();
  const deleteMutation = useDeleteProjectType();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm<ProjectTypeForm>({
    resolver: zodResolver(projectTypeSchema),
    defaultValues: DEFAULTS
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setOpen(true);
  };
  const openEdit = (row: ProjectTypeRecord_Table) => {
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

  const onSubmit = async (data: ProjectTypeForm) => {
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.projectTypeId),
          payload: data
        });
        toast.success("Project Type Updated", `"${res.projectTypeName}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync(data);
        toast.success("Project Type Created", `"${res.projectTypeName}" created successfully.`);
      }
      setOpen(false);
      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(editRow ? "Update Failed" : "Create Failed", err?.response?.data?.message || err?.message || "Operation failed.");
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.projectTypeId), {
      onSuccess: () => {
        toast.success("Project Type Deleted", `"${deleteRow.projectTypeName}" deleted successfully.`);
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      }
    });
  };

  // ─────────────────────────

  return <>
      

      {/* Table */}

      <CustomTable title="All Project Types" columns={COLUMNS} data={projectTypes as ProjectTypeRecord_Table[]} rowKey="projectTypeId" isLoading={isLoading} onEdit={openEdit} onDelete={row => setDeleteRow(row as ProjectTypeRecord)} searchPlaceholder="Search project type..." emptyMessage="No project types found." toolbarRight={<div className={ui("[display:flex] [align-items:center] [gap:8px]")}>
            <DataExport data={projectTypes as ProjectTypeRecord_Table[]} columns={EXPORT_COLUMNS} filename="project-type-master" title="Project Type Master" showButtons={["excel", "pdf", "print"]} buttonSize="sm" />
            <button className={ui("ptm-btn-primary")} onClick={openCreate}>
              <Plus size={13} />
              Add Project Type
            </button>
          </div>} />

      {/* Modal */}

      {open && <div className={ui("ptm-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("ptm-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Project type details">
            <div className={ui("ptm-modal-head")}>
              <div>
                <div className={ui("ptm-modal-title")}>
                  {editRow ? "Edit Project Type" : "Add Project Type"}
                </div>

                <div className={ui("ptm-modal-sub")}>
                  {editRow ? `Editing: ${editRow.projectTypeName}` : "Fill project type details"}
                </div>
              </div>

              <button className={ui("ptm-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={ui("ptm-modal-body")}>
                <div className={ui("ptm-grid workspace-form-grid")}>
                  <div className={ui("ptm-field-row")}>
                    <label className={ui("ptm-field-label")}>Project Type Name *</label>
                    <Controller name="projectTypeName" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="projectTypeName" isCapitalized onChange={(_, value) => field.onChange(value)} placeholder="Enter project type name" className={ui("[max-width:100%]!")} />} />
                    {errors.projectTypeName && <span className={ui("ptm-field-error")}>{errors.projectTypeName.message}</span>}
                  </div>

                  <div className={ui("ptm-field-row")}>
                    <label className={ui("ptm-field-label")}>Display Order *</label>
                    <Controller name="displayOrder" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value != null ? String(field.value) : ""} field="displayOrder" type="number" onChange={(_, value) => field.onChange(value === "" ? 0 : Number(value))} placeholder="Enter display order" className={ui("[max-width:100%]!")} />} />
                    {errors.displayOrder && <span className={ui("ptm-field-error")}>{errors.displayOrder.message}</span>}
                  </div>

                  <div className={ui("ptm-field-row")}>
                    <label className={ui("ptm-field-label")}>Status *</label>
                    <Controller name="active" control={control} render={({
                  field
                }) => <SwitchInput value={field.value} onChange={field.onChange} labels={{
                  on: "Active",
                  off: "Inactive"
                }} size="sm" />} />
                    {errors.active && <span className={ui("ptm-field-error")}>{errors.active.message}</span>}
                  </div>
                </div>
              </div>

              <div className={ui("ptm-modal-footer")}>
                <button type="button" className={ui("ptm-btn-secondary")} onClick={() => setOpen(false)}>
                  Cancel
                </button>

                <button type="submit" className={ui("ptm-btn-primary")} disabled={isPending}>
                  <Pencil size={12} />

                  {isPending ? "Saving..." : editRow ? "Update Project Type" : "Create Project Type"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirm */}

      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete "${deleteRow?.projectTypeName}"?`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />
    </>;
}
