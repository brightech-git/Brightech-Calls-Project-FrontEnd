'use client';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format/date';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { CustomTable, TableColumn } from '@/components/CustomTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SelectCombobox } from '@/components/ui/SelectComboBox';
import { CapitalizedInput } from '@/components/ui/CapitalizedInput';
import { SwitchInput } from '@/components/ui/SwitchInput';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useToast } from '@/components/Toast';
import { COLORS, FONT, RADIUS } from '@/utils/theme';
import {
  useProjectList,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/ProjectMaster/useProjectMaster';
import { useClientList } from '@/hooks/ClientMaster/useClientMaster';
import { ProjectRecord, ProjectRecord_Table } from '@/types/ProjectMaster/ProjectMaster';

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const projectSchema = z.object({
  CLIENTID: z.number().min(1, 'Client is required'),
  PROJECTNAME: z.string().min(1, 'Project name is required'),
  ACTIVE: z.enum(['Y', 'N']),
});
type ProjectForm = z.infer<typeof projectSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectRecord_Table>[] = [
  {
    key: 'projectId',
    header: 'ID',
    sortable: true,
    width: '60px',
    align: 'center',
  },
  {
    key: 'clientName',
    header: 'Client Name',
    sortable: true,
  },
  {
    key: 'projectName',
    header: 'Project Name',
    sortable: true,
  },
  {
    key: 'updated',
    header: 'Updated',
    sortable: true,
    render: (row) => (row.updated ? formatDate(row.updated as string) : '-'),
  },
  {
    key: 'active',
    header: 'Status',
    sortable: true,
    render: (row) => (
      <span
        style={{
          background: row.active === 'Y' ? COLORS.successBg : COLORS.errorBg,
          color: row.active === 'Y' ? COLORS.success : COLORS.error,
        }}
        className="py-0.5 px-2.5 rounded-full text-xs font-semibold"
      >
        {row.active === 'Y' ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ProjectForm = {
  CLIENTID: 0,
  PROJECTNAME: '',
  ACTIVE: 'Y',
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectMasterPage() {
  usePageHeader({
    title: 'Project Master',
    subtitle: 'Manage project records',
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ProjectRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ProjectRecord | null>(null);
  const { data: clients = [] } = useClientList();
  const { data: projects = [], isLoading } = useProjectList();
  const clientItems = clients.map((c) => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID),
  }));
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: DEFAULTS,
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
      PROJECTNAME: r.projectName ?? '',
      ACTIVE: r.active === 'N' ? 'N' : 'Y',
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
        toast.success('Project Updated', `"${res.projectName}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync(data);
        toast.success('Project Created', `"${res.projectName}" created successfully.`);
      }
      setOpen(false);
      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(
        editRow ? 'Update Failed' : 'Create Failed',
        err?.response?.data?.message || err?.message || 'Operation failed.',
      );
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.sno), {
      onSuccess: () => {
        toast.success(
          'Project Deleted',
          `"${deleteRow.projectName}" deleted successfully.`,
        );
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error('Delete Failed', err?.response?.data?.message || 'Delete failed.');
        setDeleteRow(null);
      },
    });
  };

  // ─────────────────────────

  return (
    <>
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
          <button
            className={cn(buttonClass, buttonVariants.primary)}
            onClick={openCreate}
          >
            <Plus size={13} />
            Add Project
          </button>
        }
      />

      {/* Modal */}

      {open && (
        <div
          className="fixed inset-0 z-1000 flex items-start justify-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm max-sm:p-2"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="flex max-h-[calc(100dvh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border-0 bg-white shadow-lg max-sm:max-h-[calc(100dvh-16px)] [&_form]:flex [&_form]:min-h-0 [&_form]:flex-1 [&_form]:flex-col"
            data-workspace-dialog
            role="dialog"
            aria-modal="true"
            aria-label="Project details"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-slate-50/60 px-4 py-3 max-sm:px-3">
              <div>
                <div className="text-lg tracking-tight text-ink">
                  {editRow ? 'Edit Project' : 'Add Project'}
                </div>

                <div className="mt-1 text-xs text-muted">
                  {editRow ? `Editing: ${editRow.projectName}` : 'Fill project details'}
                </div>
              </div>

              <button
                className="grid size-8 place-items-center rounded-lg border border-line bg-white text-muted hover:bg-rose-50 hover:text-rose-600"
                data-dialog-close
                aria-label="Close form"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 max-sm:p-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Client *</label>
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
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.CLIENTID && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.CLIENTID.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Project Name *</label>
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
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.PROJECTNAME && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.PROJECTNAME.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Status *</label>
                    <Controller
                      name="ACTIVE"
                      control={control}
                      render={({ field }) => (
                        <SwitchInput
                          value={field.value}
                          onChange={field.onChange}
                          trueValue="Y"
                          falseValue="N"
                          labels={{
                            on: 'Active',
                            off: 'Inactive',
                          }}
                          size="sm"
                        />
                      )}
                    />
                    {errors.ACTIVE && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.ACTIVE.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-2.5 border-t border-line bg-white px-4 py-3 max-sm:px-3">
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={cn(buttonClass, buttonVariants.primary)}
                  disabled={isPending}
                >
                  <Pencil size={12} />

                  {isPending
                    ? 'Saving...'
                    : editRow
                      ? 'Update Project'
                      : 'Create Project'}
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
