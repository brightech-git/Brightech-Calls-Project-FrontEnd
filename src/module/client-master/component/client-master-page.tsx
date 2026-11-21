'use client';

import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CustomTable, TableColumn } from '@/src/components/CustomTable';
import ConfirmDialog from '@/src/components/ConfirmDialog';
import { ClientFormModal } from '@/src/module/client-master/component/client-form';
import { usePageHeader } from '@/src/context/PageHeaderContext';
import { useToast } from '@/src/components/Toast';
import { COLORS, FONT, RADIUS } from '@/src/theme';
import {
  useClientList,
  useDeleteClient,
} from '@/src/module/client-master/hook/use-client-master';
import {
  ClientRecord,
  ClientRecord_Table,
} from '@/src/module/client-master/type/client-master.types';

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<ClientRecord_Table>[] = [
  {
    key: 'CLIENTID',
    header: '#',
    align: 'center',
    width: '50px',
  },
  {
    key: 'CLIENTNAME',
    header: 'Client Name',
    sortable: true,
  },
  {
    key: 'MOBILE',
    header: 'Mobile',
    sortable: true,
  },
  {
    key: 'EMAIL',
    header: 'Email',
    sortable: true,
  },
  {
    key: 'GSTNO',
    header: 'GST No',
    sortable: true,
  },
  {
    key: 'ACTIVE',
    total: 'active',
    header: 'Status',
    sortable: true,
    render: (row) => (
      <span
        style={{
          background: row.ACTIVE === 'Y' ? COLORS.successBg : COLORS.errorBg,
          color: row.ACTIVE === 'Y' ? COLORS.success : COLORS.error,
        }}
        className="py-0.5 px-2.5 rounded-full text-xs font-semibold"
      >
        {row.ACTIVE === 'Y' ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientMasterPage() {
  usePageHeader({
    title: 'Client Master',
    subtitle: 'Manage client records',
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ClientRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClientRecord | null>(null);
  const { data: clients = [], isLoading } = useClientList();
  const deleteMutation = useDeleteClient();
  const openCreate = () => {
    setEditRow(null);
    setOpen(true);
  };
  const openEdit = (row: ClientRecord_Table) => {
    setEditRow(row as ClientRecord);
    setOpen(true);
  };
  const closeForm = () => setOpen(false);

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteMutation.mutate(String(deleteRow.CLIENTID), {
      onSuccess: () => {
        toast.success(
          'Client Deleted',
          `"${deleteRow.CLIENTNAME}" deleted successfully.`,
        );
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error('Delete Failed', err?.response?.data?.message || 'Delete failed.');
        setDeleteRow(null);
      },
    });
  };
  return (
    <>
      {/* Table */}
      <CustomTable
        title="All Clients"
        columns={COLUMNS}
        data={clients as ClientRecord_Table[]}
        rowKey="CLIENTID"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as ClientRecord)}
        searchPlaceholder="Search by name, GST, mobile..."
        emptyMessage="No clients found."
        toolbarRight={
          <button
            className={cn(buttonClass, buttonVariants.primary)}
            onClick={openCreate}
          >
            <Plus size={13} /> Add Client
          </button>
        }
      />

      <ClientFormModal
        open={open}
        record={editRow}
        onSaved={closeForm}
        onCancel={closeForm}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.CLIENTNAME}"? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
