'use client';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { formatDate } from '@/src/utils/format/date';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CustomTable, TableColumn } from '@/src/components/CustomTable';
import { DataExport, ExportColumn } from '@/src/components/DataExport';
import ConfirmDialog from '@/src/components/ConfirmDialog';
import { ModuleFormModal } from '@/src/module/module-master/component/module-form';
import { usePageHeader } from '@/src/context/PageHeaderContext';
import { useToast } from '@/src/components/Toast';
import { COLORS, FONT, RADIUS } from '@/src/theme';
import {
  useModuleList,
  useDeleteModule,
} from '@/src/module/module-master/hook/use-module-master';
import {
  ModuleRecord,
  ModuleRecord_Table,
} from '@/src/module/module-master/type/module-master.types';

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ModuleRecord_Table>[] = [
  {
    key: 'projectId',
    header: 'Project Name',
    sortable: true,
    render: (row) => (row.projectName as string) ?? '-',
  },
  {
    key: 'moduleId',
    header: 'Module ID',
    sortable: true,
    width: '100px',
    align: 'center',
  },
  {
    key: 'moduleName',
    header: 'Module Name',
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
// Export Columns
// ─────────────────────────────────────────────

const EXPORT_COLUMNS: ExportColumn<ModuleRecord_Table>[] = [
  {
    key: 'projectName',
    label: 'Project Name',
    exportValue: (_, row) => (row.projectName as string) ?? '-',
  },
  {
    key: 'moduleId',
    label: 'Module ID',
  },
  {
    key: 'moduleName',
    label: 'Module Name',
  },
  {
    key: 'updated',
    label: 'Updated',
    exportValue: (v) => (v ? formatDate(v as string) : '-'),
  },
  {
    key: 'active',
    label: 'Status',
    exportValue: (v) => (v === 'Y' ? 'Active' : 'Inactive'),
  },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ModuleMasterPage() {
  usePageHeader({
    title: 'Module Master',
    subtitle: 'Manage module records',
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ModuleRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ModuleRecord | null>(null);
  const { data: modules = [], isLoading } = useModuleList();
  const deleteMutation = useDeleteModule();
  const openCreate = () => {
    setEditRow(null);
    setOpen(true);
  };
  const openEdit = (row: ModuleRecord_Table) => {
    setEditRow(row as ModuleRecord);
    setOpen(true);
  };
  const closeForm = () => setOpen(false);

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.moduleId), {
      onSuccess: () => {
        toast.success(
          'Module Deleted',
          `"${deleteRow.moduleName}" deleted successfully.`,
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
        title="All Modules"
        columns={COLUMNS}
        data={modules as ModuleRecord_Table[]}
        rowKey="moduleId"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as ModuleRecord)}
        searchPlaceholder="Search module..."
        emptyMessage="No modules found."
        toolbarRight={
          <div className="flex items-center gap-2">
            <DataExport
              data={modules as ModuleRecord_Table[]}
              columns={EXPORT_COLUMNS}
              filename="module-master"
              title="Module Master"
              showButtons={['excel', 'pdf', 'print']}
              buttonSize="sm"
            />
            <button
              className={cn(buttonClass, buttonVariants.primary)}
              onClick={openCreate}
            >
              <Plus size={13} />
              Add Module
            </button>
          </div>
        }
      />

      <ModuleFormModal
        open={open}
        record={editRow}
        onSaved={closeForm}
        onCancel={closeForm}
      />

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
