'use client';
import { buttonClass } from '@/lib/styles';
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
import { NativeSelectWrapper } from '@/components/ui/NativeSelectWrapper';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useToast } from '@/components/Toast';
import { useEnterNavigation } from '@/components/form/useEnterNavigation';
import { COLORS, FONT, RADIUS } from '@/utils/theme';
import {
  useClientServerList,
  useCreateClientServer,
  useUpdateClientServer,
  useDeleteClientServer,
} from '@/src/module/client-server-master/hook/use-client-server-master';
import { useClientList } from '@/src/module/client-master/hook/use-client-master';
import {
  ClientServerRecord,
  ClientServerRecord_Table,
} from '@/src/module/client-server-master/type/client-server-master.types';

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const clientServerSchema = z.object({
  CLIENTID: z.number().min(1, 'Client is required for saving'),
  SERVERNAME: z.string().min(1, 'Server name is required'),
  IPADDRESS: z.string().min(1, 'IP address is required'),
  PASSWORD: z.string().optional(),
  ACTIVE: z.enum(['Y', 'N']),
});
type ClientServerForm = z.infer<typeof clientServerSchema>;

// ─────────────────────────────────────────────
// Static options
// ─────────────────────────────────────────────

const ACTIVE_OPTIONS = [
  {
    label: 'Active',
    value: 'Y',
  },
  {
    label: 'Inactive',
    value: 'N',
  },
];
const ACTIVE_FILTER_OPTIONS = [
  {
    label: 'All Status',
    value: '',
  },
  ...ACTIVE_OPTIONS,
];

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ClientServerRecord_Table>[] = [
  {
    key: 'sno',
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
    key: 'serverName',
    header: 'Server Name',
    sortable: true,
  },
  {
    key: 'ipAddress',
    header: 'IP Address',
    sortable: true,
  },
  {
    key: 'modifiedAt',
    header: 'Modified',
    sortable: true,
    render: (row) => (row.modifiedAt ? formatDate(row.modifiedAt as string) : '-'),
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
        className="py-0.5 px-2.5 rounded-full text-[11px] font-semibold"
      >
        {row.active === 'Y' ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ClientServerForm = {
  CLIENTID: 0,
  SERVERNAME: '',
  IPADDRESS: '',
  PASSWORD: '',
  ACTIVE: 'Y',
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ClientServerMasterPage() {
  usePageHeader({
    title: 'Client Server Master',
    subtitle: 'Manage client server records',
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ClientServerRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClientServerRecord | null>(null);
  const [filterClientId, setFilterClientId] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const { data: clients = [] } = useClientList();
  const clientItems = clients.map((c) => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID),
  }));
  const { data: serverPage, isLoading } = useClientServerList({
    clientId: filterClientId || undefined,
    active: filterActive || undefined,
  });
  const servers = serverPage?.content ?? [];
  const createMutation = useCreateClientServer();
  const updateMutation = useUpdateClientServer();
  const deleteMutation = useDeleteClientServer();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientServerForm>({
    resolver: zodResolver(clientServerSchema),
    defaultValues: DEFAULTS,
  });

  // Enter-to-next-field navigation for the Add/Edit Client Server form.
  const { register: registerField, focusNext } = useEnterNavigation(
    ['CLIENTID', 'SERVERNAME', 'IPADDRESS', 'PASSWORD', 'ACTIVE'],
    () => handleSubmit(onSubmit)(),
  );

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setOpen(true);
  };
  const openEdit = (row: ClientServerRecord_Table) => {
    const r = row as ClientServerRecord;
    setEditRow(r);
    reset({
      CLIENTID: r.clientId,
      SERVERNAME: r.serverName ?? '',
      IPADDRESS: r.ipAddress ?? '',
      PASSWORD: r.password ?? '',
      ACTIVE: r.active === 'N' ? 'N' : 'Y',
    });
    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (data: ClientServerForm) => {
    try {
      const payload = {
        clientId: data.CLIENTID,
        serverName: data.SERVERNAME,
        ipAddress: data.IPADDRESS,
        password: data.PASSWORD,
        active: data.ACTIVE,
      };
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.sno),
          payload: payload,
        });
        toast.success(
          'Client Server Updated',
          `"${res.serverName}" updated successfully.`,
        );
      } else {
        console.log('payload', payload);
        const res = await createMutation.mutateAsync(payload);
        toast.success(
          'Client Server Created',
          `"${res.serverName}" created successfully.`,
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
    deleteMutation.mutate(String(deleteRow.sno), {
      onSuccess: () => {
        toast.success(
          'Client Server Deleted',
          `"${deleteRow.serverName}" deleted successfully.`,
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
        title="All Client Servers"
        columns={COLUMNS}
        data={servers as ClientServerRecord_Table[]}
        rowKey="sno"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as ClientServerRecord)}
        searchPlaceholder="Search server..."
        emptyMessage="No client servers found."
        toolbarRight={
          <div className="flex flex-col sm:flex-row min-w-lg items-center gap-2">
            <SelectCombobox
              value={filterClientId || undefined}
              onChange={(val) => setFilterClientId(val ?? '')}
              items={[
                {
                  label: 'All Clients',
                  value: '',
                },
                ...clientItems,
              ]}
              placeholder="Filter by client"
              className="min-w-45"
            />

            <NativeSelectWrapper
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              items={ACTIVE_FILTER_OPTIONS}
              placeholder="Filter by status"
              className="max-w-25"
            />

            <button
              className="flex flex-row bg-brand text-xs items-center gap-1 h-9 p-1 min-w-[100px] rounded-sm text-white"
              onClick={openCreate}
            >
              <Plus size={13} />
              Add More
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
            aria-label="Client server details"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-slate-50/60 px-4 py-3 max-sm:px-3">
              <div>
                <div className="text-lg tracking-tight text-ink">
                  {editRow ? 'Edit Client Server' : 'Add Client Server'}
                </div>

                <div className="mt-1 text-xs text-muted">
                  {editRow
                    ? `Editing: ${editRow.serverName}`
                    : 'Fill client server details'}
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
                          ref={registerField('CLIENTID')}
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          onEnter={() => focusNext('CLIENTID')}
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
                    <label className="text-sm text-muted">Server Name *</label>
                    <Controller
                      name="SERVERNAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          inputRef={registerField('SERVERNAME')}
                          value={field.value}
                          field="SERVERNAME"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          onEnter={() => focusNext('SERVERNAME')}
                          placeholder="Enter server name"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.SERVERNAME && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.SERVERNAME.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">IP Address *</label>
                    <Controller
                      name="IPADDRESS"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          inputRef={registerField('IPADDRESS')}
                          value={field.value}
                          field="IPADDRESS"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          onEnter={() => focusNext('IPADDRESS')}
                          placeholder="Enter IP address"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.IPADDRESS && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.IPADDRESS.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Password</label>
                    <Controller
                      name="PASSWORD"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          inputRef={registerField('PASSWORD')}
                          value={field.value}
                          field="PASSWORD"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          onEnter={() => focusNext('PASSWORD')}
                          placeholder="Enter password"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.PASSWORD && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.PASSWORD.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Status *</label>
                    <Controller
                      name="ACTIVE"
                      control={control}
                      render={({ field }) => (
                        <NativeSelectWrapper
                          ref={registerField('ACTIVE')}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          onEnter={() => focusNext('ACTIVE')}
                          items={ACTIVE_OPTIONS}
                          placeholder="Select Status"
                          css={{
                            border: '1px solid #DDD',
                            bg: '#EEE',
                            color: '#222',
                          }}
                          className="max-w-full"
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
                  className="flex flex-row bg-brand text-xs items-center gap-1 h-9 p-1 min-w-[100px] rounded-sm text-white"
                  disabled={isPending}
                >
                  <Pencil size={12} />
                  {isPending
                    ? 'Saving...'
                    : editRow
                      ? 'Update Client Server'
                      : 'Create Client Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.serverName}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
