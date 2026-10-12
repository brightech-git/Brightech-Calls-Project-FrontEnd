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
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useProjectList, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/ProjectMaster/useProjectMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";
import { ProjectRecord, ProjectRecord_Table } from "@/types/ProjectMaster/ProjectMaster";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const projectSchema = z.object({
  CLIENTID: z.number().min(1, "Client is required"),
  PROJECTNAME: z.string().min(1, "Project name is required"),
  ACTIVE: z.enum(["Y", "N"])
});
type ProjectForm = z.infer<typeof projectSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectRecord_Table>[] = [{
  key: "projectId",
  header: "ID",
  sortable: true,
  width: "60px",
  align: "center"
}, {
  key: "clientName",
  header: "Client Name",
  sortable: true
}, {
  key: "projectName",
  header: "Project Name",
  sortable: true
}, {
  key: "updated",
  header: "Updated",
  sortable: true,
  render: row => row.updated ? new Date(row.updated as string).toLocaleDateString() : "-"
}, {
  key: "active",
  header: "Status",
  sortable: true,
  render: row => <span style={{
    background: row.active === "Y" ? COLORS.successBg : COLORS.errorBg,
    color: row.active === "Y" ? COLORS.success : COLORS.error
  }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:var(--font-xs)] [font-weight:600]")}>
        {row.active === "Y" ? "Active" : "Inactive"}
      </span>
}];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ProjectForm = {
  CLIENTID: 0,
  PROJECTNAME: "",
  ACTIVE: "Y"
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectMasterPage() {
  usePageHeader({
    title: "Project Master",
    subtitle: "Manage project records"
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ProjectRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ProjectRecord | null>(null);
  const {
    data: clients = []
  } = useClientList();
  const {
    data: projects = [],
    isLoading
  } = useProjectList();
  const clientItems = clients.map(c => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID)
  }));
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: DEFAULTS
  });

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setOpen(true);
  };
  const openEdit = (row: ProjectRecord_Table) => {
    const r = row as ProjectRecord;
    setEditRow(r);
    reset({
      CLIENTID: r.clientId,
      PROJECTNAME: r.projectName ?? "",
      ACTIVE: r.active === "N" ? "N" : "Y"
    });
    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (data: ProjectForm) => {
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.sno),
          payload: data
        });
        toast.success("Project Updated", `"${res.projectName}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync(data);
        toast.success("Project Created", `"${res.projectName}" created successfully.`);
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
    deleteMutation.mutate(String(deleteRow.sno), {
      onSuccess: () => {
        toast.success("Project Deleted", `"${deleteRow.projectName}" deleted successfully.`);
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

      <CustomTable title="All Projects" columns={COLUMNS} data={projects as ProjectRecord_Table[]} rowKey="sno" isLoading={isLoading} onEdit={openEdit} onDelete={row => setDeleteRow(row as ProjectRecord)} searchPlaceholder="Search project..." emptyMessage="No projects found." toolbarRight={<button className={ui("pm-btn-primary")} onClick={openCreate}>
            <Plus size={13} />
            Add Project
          </button>} />

      {/* Modal */}

      {open && <div className={ui("pm-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("pm-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Project details">
            <div className={ui("pm-modal-head")}>
              <div>
                <div className={ui("pm-modal-title")}>
                  {editRow ? "Edit Project" : "Add Project"}
                </div>

                <div className={ui("pm-modal-sub")}>
                  {editRow ? `Editing: ${editRow.projectName}` : "Fill project details"}
                </div>
              </div>

              <button className={ui("pm-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={ui("pm-modal-body")}>
                <div className={ui("pm-grid workspace-form-grid")}>
                  <div className={ui("pm-field-row")}>
                    <label className={ui("pm-field-label")}>Client *</label>
                    <Controller name="CLIENTID" control={control} render={({
                  field
                }) => <SelectCombobox value={field.value ? String(field.value) : undefined} onChange={val => field.onChange(val ? Number(val) : 0)} editId={editRow?.sno ?? null} items={clientItems} placeholder="Select client" className={ui("[max-width:100%]!")} />} />
                    {errors.CLIENTID && <span className={ui("pm-field-error")}>{errors.CLIENTID.message}</span>}
                  </div>

                  <div className={ui("pm-field-row")}>
                    <label className={ui("pm-field-label")}>Project Name *</label>
                    <Controller name="PROJECTNAME" control={control} render={({
                  field
                }) => <CapitalizedInput value={field.value} field="PROJECTNAME" isCapitalized onChange={(_, value) => field.onChange(value)} placeholder="Enter project name" className={ui("[max-width:100%]!")} />} />
                    {errors.PROJECTNAME && <span className={ui("pm-field-error")}>{errors.PROJECTNAME.message}</span>}
                  </div>

                  <div className={ui("pm-field-row")}>
                    <label className={ui("pm-field-label")}>Status *</label>
                    <Controller name="ACTIVE" control={control} render={({
                  field
                }) => <SwitchInput value={field.value} onChange={field.onChange} trueValue="Y" falseValue="N" labels={{
                  on: "Active",
                  off: "Inactive"
                }} size="sm" />} />
                    {errors.ACTIVE && <span className={ui("pm-field-error")}>{errors.ACTIVE.message}</span>}
                  </div>
                </div>
              </div>

              <div className={ui("pm-modal-footer")}>
                <button type="button" className={ui("pm-btn-secondary")} onClick={() => setOpen(false)}>
                  Cancel
                </button>

                <button type="submit" className={ui("pm-btn-primary")} disabled={isPending}>
                  <Pencil size={12} />

                  {isPending ? "Saving..." : editRow ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirm */}

      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete "${deleteRow?.projectName}"?`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />
    </>;
}
