'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import {
  ComboBox,
  FormGrid,
  FormModal,
  FormModalBody,
  FormModalFooter,
  SwitchField,
  TextInput,
  useAddNew,
} from '@/src/components/form';
import { useToast } from '@/src/components/Toast';
import { useClientList } from '@/src/module/client-master/hook/use-client-master';
import { ClientFormFields } from '@/src/module/client-master/component/client-form';
import {
  useCreateProject,
  useUpdateProject,
} from '@/src/module/project-master/hook/use-project-master';
import type { ProjectRecord } from '@/src/module/project-master/type/project-master.types';

const projectSchema = z.object({
  CLIENTID: z.number().min(1, 'Client is required'),
  PROJECTNAME: z.string().min(1, 'Project name is required'),
  ACTIVE: z.enum(['Y', 'N']),
});
export type ProjectFormValues = z.infer<typeof projectSchema>;

export interface ProjectFormProps {
  /** The project to edit. Leave out to create one. */
  record?: ProjectRecord | null;
  /** Starting values for a new project, e.g. the name typed in a combo box. */
  initial?: Partial<ProjectFormValues>;
  onSaved: (saved: ProjectRecord) => void;
  onCancel: () => void;
}

/** Add / edit form for a project. Used by Project Master and by "Add new" on project combos. */
export function ProjectFormFields({
  record,
  initial,
  onSaved,
  onCancel,
}: ProjectFormProps) {
  const toast = useToast();
  const addNew = useAddNew<'client'>();
  const { data: clients = [] } = useClientList();
  const clientItems = clients.map((c) => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID),
  }));
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: record
      ? {
          CLIENTID: record.clientId,
          PROJECTNAME: record.projectName ?? '',
          ACTIVE: record.active === 'N' ? 'N' : 'Y',
        }
      : { CLIENTID: 0, PROJECTNAME: '', ACTIVE: 'Y', ...initial },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const res = record
        ? await updateMutation.mutateAsync({ id: String(record.sno), payload: data })
        : await createMutation.mutateAsync(data);
      toast.success(
        record ? 'Project Updated' : 'Project Created',
        `"${res.projectName}" ${record ? 'updated' : 'created'} successfully.`,
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
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormModalBody>
          <FormGrid>
            <Controller
              name="CLIENTID"
              control={control}
              render={({ field }) => (
                <ComboBox
                  label="Client"
                  required
                  value={field.value ? String(field.value) : undefined}
                  onChange={(val) => field.onChange(val ? Number(val) : 0)}
                  options={clientItems}
                  placeholder="Select client"
                  error={errors.CLIENTID?.message}
                  addNew
                  addNewLabel="Add new client"
                  onAddNew={(typed) => addNew.open('client', typed)}
                />
              )}
            />
            <Controller
              name="PROJECTNAME"
              control={control}
              render={({ field }) => (
                <TextInput
                  label="Project Name"
                  required
                  uppercase
                  value={field.value}
                  placeholder="Enter project name"
                  onChange={field.onChange}
                  error={errors.PROJECTNAME?.message}
                />
              )}
            />
            <Controller
              name="ACTIVE"
              control={control}
              render={({ field }) => (
                <SwitchField
                  label="Status"
                  value={field.value}
                  onChange={field.onChange}
                  trueValue="Y"
                  falseValue="N"
                  labels={{ on: 'Active', off: 'Inactive' }}
                />
              )}
            />
          </FormGrid>
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
            {isPending ? 'Saving...' : record ? 'Update Project' : 'Create Project'}
          </button>
        </FormModalFooter>
      </form>

      <FormModal
        open={addNew.is('client')}
        title="Add Client"
        subtitle="The new client is picked for this project when saved"
        onClose={addNew.close}
      >
        <ClientFormFields
          initial={{ CLIENTNAME: addNew.seed.toUpperCase() }}
          onCancel={addNew.close}
          onSaved={(client) => {
            setValue('CLIENTID', client.CLIENTID, { shouldValidate: true });
            addNew.close();
          }}
        />
      </FormModal>
    </>
  );
}

/** Project form in its own modal: the page's Add / Edit dialog, or an "Add new" from a combo. */
export function ProjectFormModal({
  open,
  ...props
}: ProjectFormProps & { open: boolean }) {
  return (
    <FormModal
      open={open}
      size="md"
      title={props.record ? 'Edit Project' : 'Add Project'}
      subtitle={
        props.record ? `Editing: ${props.record.projectName}` : 'Fill project details'
      }
      onClose={props.onCancel}
    >
      <ProjectFormFields {...props} />
    </FormModal>
  );
}
