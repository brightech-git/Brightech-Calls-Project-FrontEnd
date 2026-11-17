'use client';

import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { CustomTable, TableColumn } from '@/components/CustomTable';
import { DataExport, ExportColumn } from '@/components/DataExport';
import ConfirmDialog from '@/components/ConfirmDialog';
import { CapitalizedInput } from '@/components/ui/CapitalizedInput';
import { SwitchInput } from '@/components/ui/SwitchInput';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useToast } from '@/components/Toast';
import { COLORS, FONT, RADIUS } from '@/utils/theme';
import {
  useProjectTypeList,
  useCreateProjectType,
  useUpdateProjectType,
  useDeleteProjectType,
} from '@/hooks/ProjectTypeMaster/useProjectTypeMaster';
import {
  ProjectTypeRecord,
  ProjectTypeRecord_Table,
} from '@/types/ProjectTypeMaster/ProjectTypeMaster';

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const projectTypeSchema = z.object({
  projectTypeName: z.string().min(1, 'Project type name is required'),
  displayOrder: z.number().min(0, 'Display order must be 0 or greater'),
  active: z.boolean(),
});
type ProjectTypeForm = z.infer<typeof projectTypeSchema>;

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ProjectTypeRecord_Table>[] = [
  {
    key: 'projectTypeId',
    header: 'ID',
    sortable: true,
    width: '80px',
    align: 'center',
  },
  {
    key: 'projectTypeName',
    header: 'Project Type Name',
    sortable: true,
  },
  {
    key: 'displayOrder',
    header: 'Display Order',
    sortable: true,
    width: '130px',
    align: 'center',
  },
  {
    key: 'active',
    header: 'Status',
    sortable: true,
    render: (row) => (
      <span
        style={{
          background: row.active ? COLORS.successBg : COLORS.errorBg,
          color: row.active ? COLORS.success : COLORS.error,
        }}
        className="py-0.5 px-2.5 rounded-full text-xs font-semibold"
      >
        {row.active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Export Columns
// ─────────────────────────────────────────────

const EXPORT_COLUMNS: ExportColumn<ProjectTypeRecord_Table>[] = [
  {
    key: 'projectTypeId',
    label: 'ID',
  },
  {
    key: 'projectTypeName',
    label: 'Project Type Name',
  },
  {
    key: 'displayOrder',
    label: 'Display Order',
  },
  {
    key: 'active',
    label: 'Status',
    exportValue: (v) => (v === 'Y' ? 'Active' : 'Inactive'),
  },
];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ProjectTypeForm = {
  projectTypeName: '',
  displayOrder: 0,
  active: true,
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ProjectTypeMasterPage() {
  usePageHeader({
    title: 'Project Type Master',
    subtitle: 'Manage project type records',
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ProjectTypeRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ProjectTypeRecord | null>(null);
  const { data: projectTypes = [], isLoading } = useProjectTypeList();
  console.log(projectTypes, 'projectTypes');
  const createMutation = useCreateProjectType();
  const updateMutation = useUpdateProjectType();
  const deleteMutation = useDeleteProjectType();
  const isPending = createMutation.isPending || updateMutation.isPending;
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
  const openEdit = (row: ProjectTypeRecord_Table) => {
    const r = row as ProjectTypeRecord;
    setEditRow(r);
    reset({
      projectTypeName: r.projectTypeName ?? '',
      displayOrder: r.displayOrder ?? 0,
      active: r.active,
    });
    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (data: ProjectTypeForm) => {
    try {
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.projectTypeId),
          payload: data,
        });
        toast.success(
          'Project Type Updated',
          `"${res.projectTypeName}" updated successfully.`,
        );
      } else {
        const res = await createMutation.mutateAsync(data);
        toast.success(
          'Project Type Created',
          `"${res.projectTypeName}" created successfully.`,
        );
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
    deleteMutation.mutate(String(deleteRow.projectTypeId), {
      onSuccess: () => {
        toast.success(
          'Project Type Deleted',
          `"${deleteRow.projectTypeName}" deleted successfully.`,
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
        title="All Project Types"
        columns={COLUMNS}
        data={projectTypes as ProjectTypeRecord_Table[]}
        rowKey="projectTypeId"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as ProjectTypeRecord)}
        searchPlaceholder="Search project type..."
        emptyMessage="No project types found."
        toolbarRight={
          <div className="flex items-center gap-2">
            <DataExport
              data={projectTypes as ProjectTypeRecord_Table[]}
              columns={EXPORT_COLUMNS}
              filename="project-type-master"
              title="Project Type Master"
              showButtons={['excel', 'pdf', 'print']}
              buttonSize="sm"
            />
            <button
              className={cn(buttonClass, buttonVariants.primary)}
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
          className="fixed inset-0 z-1000 flex items-start justify-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm max-sm:p-2"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="flex max-h-[calc(100dvh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border-0 bg-white shadow-lg max-sm:max-h-[calc(100dvh-16px)] [&_form]:flex [&_form]:min-h-0 [&_form]:flex-1 [&_form]:flex-col"
            data-workspace-dialog
            role="dialog"
            aria-modal="true"
            aria-label="Project type details"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-slate-50/60 px-4 py-3 max-sm:px-3">
              <div>
                <div className="text-lg tracking-tight text-ink">
                  {editRow ? 'Edit Project Type' : 'Add Project Type'}
                </div>

                <div className="mt-1 text-xs text-muted">
                  {editRow
                    ? `Editing: ${editRow.projectTypeName}`
                    : 'Fill project type details'}
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
                    <label className="text-sm text-muted">Project Type Name *</label>
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
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.projectTypeName && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.projectTypeName.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Display Order *</label>
                    <Controller
                      name="displayOrder"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value != null ? String(field.value) : ''}
                          field="displayOrder"
                          type="number"
                          onChange={(_, value) =>
                            field.onChange(value === '' ? 0 : Number(value))
                          }
                          placeholder="Enter display order"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.displayOrder && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.displayOrder.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Status *</label>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <SwitchInput
                          value={field.value}
                          onChange={field.onChange}
                          labels={{
                            on: 'Active',
                            off: 'Inactive',
                          }}
                          size="sm"
                        />
                      )}
                    />
                    {errors.active && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.active.message}
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
                      ? 'Update Project Type'
                      : 'Create Project Type'}
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
