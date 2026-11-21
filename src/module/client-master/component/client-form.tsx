'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import {
  FormModal,
  FormModalBody,
  FormModalFooter,
  SwitchField,
  TextAreaInput,
  TextInput,
} from '@/src/components/form';
import { useToast } from '@/src/components/Toast';
import {
  useCreateClient,
  useUpdateClient,
} from '@/src/module/client-master/hook/use-client-master';
import type { ClientRecord } from '@/src/module/client-master/type/client-master.types';

export const clientSchema = z.object({
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
export type ClientFormValues = z.infer<typeof clientSchema>;

export const CLIENT_DEFAULTS: ClientFormValues = {
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

const toValues = (r: ClientRecord): ClientFormValues => ({
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

export interface ClientFormProps {
  /** The client to edit. Leave out to create one. */
  record?: ClientRecord | null;
  /** Starting values for a new client, e.g. the name typed in a combo box. */
  initial?: Partial<ClientFormValues>;
  onSaved: (saved: ClientRecord) => void;
  onCancel: () => void;
}

/** Add / edit form for a client. Used by Client Master and by "Add new" on client combos. */
export function ClientFormFields({
  record,
  initial,
  onSaved,
  onCancel,
}: ClientFormProps) {
  const toast = useToast();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: record ? toValues(record) : { ...CLIENT_DEFAULTS, ...initial },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      const userId = Number(localStorage.getItem('userId') || 0);
      // The API also reads CLIENTID on update, which ClientPayload does not list.
      const updatePayload = { ...data, CLIENTID: record?.CLIENTID, USERID: userId };
      const res = record
        ? await updateMutation.mutateAsync({
            id: String(record.CLIENTID),
            payload: updatePayload,
          })
        : await createMutation.mutateAsync({ ...data, USERID: userId });
      toast.success(
        record ? 'Client Updated' : 'Client Created',
        `"${res.CLIENTNAME}" ${record ? 'updated' : 'created'} successfully.`,
      );
      onSaved(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        record ? 'Update Failed' : 'Create Failed',
        e?.response?.data?.message || e?.message || 'Operation failed.',
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (errs) => {
        const first = Object.values(errs)[0] as { message?: string } | undefined;
        toast.error('Validation Error', first?.message || 'Please fix the form errors.');
      })}
    >
      <FormModalBody>
        <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">
          Basic Information
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
          <Controller
            name="CLIENTNAME"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Client Name"
                required
                uppercase
                value={field.value}
                placeholder="Full client name"
                onChange={field.onChange}
                error={errors.CLIENTNAME?.message}
              />
            )}
          />

          <Controller
            name="COSTID"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Cost ID"
                value={field.value}
                placeholder="e.g. BT"
                onChange={field.onChange}
                error={errors.COSTID?.message}
              />
            )}
          />

          <Controller
            name="SHORTKEY"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Short Key"
                value={field.value}
                placeholder="e.g. A"
                onChange={field.onChange}
                error={errors.SHORTKEY?.message}
              />
            )}
          />

          <Controller
            name="PHONE"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Phone"
                type="tel"
                value={field.value}
                placeholder="e.g. 04412345678"
                onChange={field.onChange}
                error={errors.PHONE?.message}
              />
            )}
          />

          <Controller
            name="MOBILE"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Mobile"
                required
                type="mobile"
                value={field.value}
                placeholder="10-digit mobile"
                onChange={field.onChange}
                error={errors.MOBILE?.message}
              />
            )}
          />

          <Controller
            name="EMAIL"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Email"
                required
                type="email"
                value={field.value}
                placeholder="email@example.com"
                onChange={field.onChange}
                error={errors.EMAIL?.message}
              />
            )}
          />

          <Controller
            name="ACTIVE"
            control={control}
            render={({ field }) => (
              <SwitchField
                label="Status"
                required
                value={field.value}
                onChange={field.onChange}
                trueValue="Y"
                falseValue="N"
                labels={{
                  on: 'Active',
                  off: 'Inactive',
                }}
                error={errors.ACTIVE?.message}
              />
            )}
          />
        </div>

        <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">
          Address
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
          <Controller
            name="ADDRESS1"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Address 1"
                value={field.value}
                placeholder="Street"
                onChange={field.onChange}
                error={errors.ADDRESS1?.message}
              />
            )}
          />

          <Controller
            name="ADDRESS2"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Address 2"
                value={field.value}
                placeholder="Area"
                onChange={field.onChange}
                error={errors.ADDRESS2?.message}
              />
            )}
          />

          <Controller
            name="ADDRESS3"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Address 3"
                value={field.value}
                placeholder="City"
                onChange={field.onChange}
                error={errors.ADDRESS3?.message}
              />
            )}
          />

          <Controller
            name="AREACODE"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Area Code"
                type="pincode"
                value={field.value}
                placeholder="PIN code"
                onChange={field.onChange}
                error={errors.AREACODE?.message}
              />
            )}
          />

          <Controller
            name="REMARKS"
            control={control}
            render={({ field }) => (
              <TextAreaInput
                label="Remarks"
                value={field.value}
                placeholder="Any remarks..."
                rows={3}
                onChange={field.onChange}
                error={errors.REMARKS?.message}
              />
            )}
          />
        </div>

        <div className="mt-3 mb-4 border-b border-line pb-3 text-xs tracking-widest text-muted uppercase first:mt-0">
          Tax Information
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
          <Controller
            name="GSTNO"
            control={control}
            render={({ field }) => (
              <TextInput
                label="GST No"
                uppercase
                value={field.value}
                placeholder="GST number"
                onChange={field.onChange}
                error={errors.GSTNO?.message}
              />
            )}
          />

          <Controller
            name="PANNO"
            control={control}
            render={({ field }) => (
              <TextInput
                label="PAN No"
                uppercase
                value={field.value}
                placeholder="PAN number"
                onChange={field.onChange}
                error={errors.PANNO?.message}
              />
            )}
          />

          <Controller
            name="TANNO"
            control={control}
            render={({ field }) => (
              <TextInput
                label="TAN No"
                uppercase
                value={field.value}
                placeholder="TAN number"
                onChange={field.onChange}
                error={errors.TANNO?.message}
              />
            )}
          />

          <Controller
            name="TDSNO"
            control={control}
            render={({ field }) => (
              <TextInput
                label="TDS No"
                value={field.value}
                placeholder="TDS number"
                onChange={field.onChange}
                error={errors.TDSNO?.message}
              />
            )}
          />

          <Controller
            name="TINNO"
            control={control}
            render={({ field }) => (
              <TextInput
                label="TIN No"
                value={field.value}
                placeholder="TIN number"
                onChange={field.onChange}
                error={errors.TINNO?.message}
              />
            )}
          />

          <Controller
            name="CSTNO"
            control={control}
            render={({ field }) => (
              <TextInput
                label="CST No"
                value={field.value}
                placeholder="CST number"
                onChange={field.onChange}
                error={errors.CSTNO?.message}
              />
            )}
          />

          <Controller
            name="LOCALTAXNO"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Local Tax No"
                value={field.value}
                placeholder="Local tax number"
                onChange={field.onChange}
                error={errors.LOCALTAXNO?.message}
              />
            )}
          />
        </div>
      </FormModalBody>
      <FormModalFooter>
        <button
          type="button"
          className={buttonClass}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={cn(buttonClass, buttonVariants.primary)}
          disabled={isPending}
        >
          <Pencil size={12} />
          {isPending ? 'Saving...' : record ? 'Update Client' : 'Create Client'}
        </button>
      </FormModalFooter>
    </form>
  );
}

/** Client form in its own modal: the page's Add / Edit dialog, or an "Add new" from a combo. */
export function ClientFormModal({ open, ...props }: ClientFormProps & { open: boolean }) {
  return (
    <FormModal
      open={open}
      title={props.record ? 'Edit Client' : 'Add Client'}
      subtitle={
        props.record ? `Editing: ${props.record.CLIENTNAME}` : 'Fill in the details below'
      }
      onClose={props.onCancel}
    >
      <ClientFormFields {...props} />
    </FormModal>
  );
}
