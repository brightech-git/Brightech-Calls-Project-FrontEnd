'use client';

import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { CapitalizedInput } from '@/components/ui/CapitalizedInput';
import { SwitchInput } from '@/components/ui/SwitchInput';
import { TextareaField } from '@/components/ui/CapitalizesTextArea';
import { CustomTable, TableColumn } from '@/components/CustomTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useToast } from '@/components/Toast';
import { COLORS, FONT, RADIUS } from '@/utils/theme';
import {
  useClientList,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '@/src/module/client-master/hook/use-client-master';
import { ClientRecord, ClientRecord_Table } from '@/src/module/client-master/type/client-master.types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  CLIENTNAME: z.string().min(1, 'Client name is required'),
  COSTID: z.string().optional(),
  PHONE: z.string().optional(),
  MOBILE: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile'),
  EMAIL: z.string().email('Enter valid email'),
  ADDRESS1: z.string().optional(),
  ADDRESS2: z.string().optional(),
  ADDRESS3: z.string().optional(),
  REMARKS: z.string().optional(),
  AREACODE: z.string().optional(),
  GSTNO: z.string().optional(),
  PANNO: z.string().optional(),
  TANNO: z.string().optional(),
  TDSNO: z.string().optional(),
  TINNO: z.string().optional(),
  CSTNO: z.string().optional(),
  LOCALTAXNO: z.string().optional(),
  SHORTKEY: z.string().optional(),
  ACTIVE: z.enum(['Y', 'N']),
});
type ClientForm = z.infer<typeof clientSchema>;

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

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULTS: ClientForm = {
  CLIENTNAME: '',
  COSTID: '',
  SHORTKEY: '',
  PHONE: '',
  MOBILE: '',
  EMAIL: '',
  ACTIVE: 'Y',
  ADDRESS1: '',
  ADDRESS2: '',
  ADDRESS3: '',
  AREACODE: '',
  REMARKS: '',
  GSTNO: '',
  PANNO: '',
  TANNO: '',
  TDSNO: '',
  TINNO: '',
  CSTNO: '',
  LOCALTAXNO: '',
};

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
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: DEFAULTS,
  });
  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setOpen(true);
  };
  const openEdit = (row: ClientRecord_Table) => {
    const r = row as ClientRecord;
    setEditRow(r);
    reset({
      CLIENTNAME: r.CLIENTNAME ?? '',
      COSTID: r.COSTID ?? '',
      SHORTKEY: r.SHORTKEY ?? '',
      PHONE: r.PHONE ?? '',
      MOBILE: r.MOBILE ?? '',
      EMAIL: r.EMAIL ?? '',
      ACTIVE: r.ACTIVE === 'N' ? 'N' : 'Y',
      ADDRESS1: r.ADDRESS1 ?? '',
      ADDRESS2: r.ADDRESS2 ?? '',
      ADDRESS3: r.ADDRESS3 ?? '',
      AREACODE: r.AREACODE ?? '',
      REMARKS: r.REMARKS ?? '',
      GSTNO: r.GSTNO ?? '',
      PANNO: r.PANNO ?? '',
      TANNO: r.TANNO ?? '',
      TDSNO: r.TDSNO ?? '',
      TINNO: r.TINNO ?? '',
      CSTNO: r.CSTNO ?? '',
      LOCALTAXNO: r.LOCALTAXNO ?? '',
    });
    setOpen(true);
  };
  const onSubmit = async (data: ClientForm) => {
    try {
      const userId = Number(localStorage.getItem('userId') || 0);
      if (editRow) {
        console.log(data, editRow, userId, 'updatePayload');
        const payload = {
          ...data,
          CLIENTID: editRow.CLIENTID,
          USERID: userId,
        };
        const res = await updateMutation.mutateAsync({
          id: String(editRow.CLIENTID),
          payload,
        });
        toast.success('Client Updated', `"${res.CLIENTNAME}" updated successfully.`);
      } else {
        const res = await createMutation.mutateAsync({
          ...data,
          USERID: userId,
        });
        toast.success('Client Created', `"${res.CLIENTNAME}" created successfully.`);
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
            aria-label="Client details"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-slate-50/60 px-4 py-3 max-sm:px-3">
              <div>
                <div className="text-lg tracking-tight text-ink">
                  {editRow ? 'Edit Client' : 'Add Client'}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {editRow
                    ? `Editing: ${editRow.CLIENTNAME}`
                    : 'Fill in the details below'}
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

            <form
              onSubmit={handleSubmit(onSubmit, (errs) => {
                const first = Object.values(errs)[0];
                const msg = (first as any)?.message || 'Please fix the form errors.';
                toast.error('Validation Error', msg);
              })}
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-4 max-sm:p-3">
                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Basic Information</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Client Name *</label>
                    <Controller
                      name="CLIENTNAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="CLIENTNAME"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Full client name"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.CLIENTNAME && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.CLIENTNAME.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Cost ID</label>
                    <Controller
                      name="COSTID"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="COSTID"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. BT"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.COSTID && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.COSTID.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Short Key</label>
                    <Controller
                      name="SHORTKEY"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="SHORTKEY"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. A"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.SHORTKEY && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.SHORTKEY.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Phone</label>
                    <Controller
                      name="PHONE"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="PHONE"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="e.g. 04412345678"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.PHONE && (
                      <span className="mt-1 text-xs text-rose-600">{errors.PHONE.message}</span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Mobile *</label>
                    <Controller
                      name="MOBILE"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="MOBILE"
                          inputModeType="mobile"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="10-digit mobile"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.MOBILE && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.MOBILE.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Email *</label>
                    <Controller
                      name="EMAIL"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="EMAIL"
                          inputModeType="email"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="email@example.com"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.EMAIL && (
                      <span className="mt-1 text-xs text-rose-600">{errors.EMAIL.message}</span>
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

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Address</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Address 1</label>
                    <Controller
                      name="ADDRESS1"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS1"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Street"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.ADDRESS1 && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.ADDRESS1.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Address 2</label>
                    <Controller
                      name="ADDRESS2"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS2"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Area"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.ADDRESS2 && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.ADDRESS2.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Address 3</label>
                    <Controller
                      name="ADDRESS3"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="ADDRESS3"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="City"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.ADDRESS3 && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.ADDRESS3.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Area Code</label>
                    <Controller
                      name="AREACODE"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="AREACODE"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="PIN code"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.AREACODE && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.AREACODE.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Remarks</label>
                    <Controller
                      name="REMARKS"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="REMARKS"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Any remarks..."
                          mode="inline"
                          rows={3}
                          isCapitalized={false}
                        />
                      )}
                    />
                    {errors.REMARKS && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.REMARKS.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">Tax Information</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">GST No</label>
                    <Controller
                      name="GSTNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="GSTNO"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="GST number"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.GSTNO && (
                      <span className="mt-1 text-xs text-rose-600">{errors.GSTNO.message}</span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">PAN No</label>
                    <Controller
                      name="PANNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="PANNO"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="PAN number"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.PANNO && (
                      <span className="mt-1 text-xs text-rose-600">{errors.PANNO.message}</span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">TAN No</label>
                    <Controller
                      name="TANNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="TANNO"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="TAN number"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.TANNO && (
                      <span className="mt-1 text-xs text-rose-600">{errors.TANNO.message}</span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">TDS No</label>
                    <Controller
                      name="TDSNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="TDSNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="TDS number"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.TDSNO && (
                      <span className="mt-1 text-xs text-rose-600">{errors.TDSNO.message}</span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">TIN No</label>
                    <Controller
                      name="TINNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="TINNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="TIN number"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.TINNO && (
                      <span className="mt-1 text-xs text-rose-600">{errors.TINNO.message}</span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">CST No</label>
                    <Controller
                      name="CSTNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="CSTNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="CST number"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.CSTNO && (
                      <span className="mt-1 text-xs text-rose-600">{errors.CSTNO.message}</span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="text-sm text-muted">Local Tax No</label>
                    <Controller
                      name="LOCALTAXNO"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="LOCALTAXNO"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Local tax number"
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.LOCALTAXNO && (
                      <span className="mt-1 text-xs text-rose-600">
                        {errors.LOCALTAXNO.message}
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
                  {isPending ? 'Saving...' : editRow ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
