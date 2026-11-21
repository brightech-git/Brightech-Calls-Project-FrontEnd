'use client';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { formatDate } from '@/src/utils/format/date';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CustomTable, TableColumn } from '@/src/components/CustomTable';
import ConfirmDialog from '@/src/components/ConfirmDialog';
import { ProjectFormModal } from '@/src/module/project-master/component/project-form';
import { usePageHeader } from '@/src/context/PageHeaderContext';
import { useToast } from '@/src/components/Toast';
import { COLORS, FONT, RADIUS } from '@/src/theme';
import {
  useProjectList,
  useDeleteProject,
} from '@/src/module/project-master/hook/use-project-master';
import {
  ProjectRecord,
  ProjectRecord_Table,
} from '@/src/module/project-master/type/project-master.types';

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
    total: 'active',
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
  const { data: projects = [], isLoading } = useProjectList();
  const deleteMutation = useDeleteProject();
  const openCreate = () => {
    setEditRow(null);
    setOpen(true);
  };
  const openEdit = (row: ProjectRecord_Table) => {
    setEditRow(row as ProjectRecord);
    setOpen(true);
  };
  const closeForm = () => setOpen(false);

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

      <ProjectFormModal
        open={open}
        record={editRow}
        onSaved={closeForm}
        onCancel={closeForm}
      />

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
