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
import { useProjectList } from '@/src/module/project-master/hook/use-project-master';
import { ProjectFormFields } from '@/src/module/project-master/component/project-form';
import {
  useCreateModule,
  useUpdateModule,
} from '@/src/module/module-master/hook/use-module-master';
import type { ModuleRecord } from '@/src/module/module-master/type/module-master.types';

const moduleSchema = z.object({
  PROJECTID: z.number().min(1, 'Project is required'),
  MODULENAME: z.string().min(1, 'Module name is required'),
  ACTIVE: z.enum(['Y', 'N']),
});
export type ModuleFormValues = z.infer<typeof moduleSchema>;

export interface ModuleFormProps {
  /** The module to edit. Leave out to create one. */
  record?: ModuleRecord | null;
  /** Starting values for a new module, e.g. the name typed in a combo box. */
  initial?: Partial<ModuleFormValues>;
  onSaved: (saved: ModuleRecord) => void;
  onCancel: () => void;
}

/** Add / edit form for a module. Used by Module Master and by "Add new" on module combos. */
export function ModuleFormFields({
  record,
  initial,
  onSaved,
  onCancel,
}: ModuleFormProps) {
  const toast = useToast();
  const addNew = useAddNew<'project'>();
  const { data: projects = [] } = useProjectList();
  const projectItems = projects.map((p) => ({
    label: p.projectName,
    value: String(p.projectId),
  }));
  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: record
      ? {
          PROJECTID: record.projectId,
          MODULENAME: record.moduleName ?? '',
          ACTIVE: record.active === 'N' ? 'N' : 'Y',
        }
      : { PROJECTID: 0, MODULENAME: '', ACTIVE: 'Y', ...initial },
  });

  const onSubmit = async (data: ModuleFormValues) => {
    try {
      const res = record
        ? await updateMutation.mutateAsync({ id: String(record.moduleId), payload: data })
        : await createMutation.mutateAsync(data);
      toast.success(
        record ? 'Module Updated' : 'Module Created',
        `"${res.moduleName}" ${record ? 'updated' : 'created'} successfully.`,
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
              name="PROJECTID"
              control={control}
              render={({ field }) => (
                <ComboBox
                  label="Project"
                  required
                  value={field.value ? String(field.value) : undefined}
                  onChange={(val) => field.onChange(val ? Number(val) : 0)}
                  options={projectItems}
                  placeholder="Select project"
                  error={errors.PROJECTID?.message}
                  addNew
                  addNewLabel="Add new project"
                  onAddNew={(typed) => addNew.open('project', typed)}
                />
              )}
            />
            <Controller
              name="MODULENAME"
              control={control}
              render={({ field }) => (
                <TextInput
                  label="Module Name"
                  required
                  uppercase
                  value={field.value}
                  placeholder="Enter module name"
                  onChange={field.onChange}
                  error={errors.MODULENAME?.message}
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
            {isPending ? 'Saving...' : record ? 'Update Module' : 'Create Module'}
          </button>
        </FormModalFooter>
      </form>

      <FormModal
        open={addNew.is('project')}
        title="Add Project"
        subtitle="The new project is picked for this module when saved"
        onClose={addNew.close}
      >
        <ProjectFormFields
          initial={{ PROJECTNAME: addNew.seed.toUpperCase() }}
          onCancel={addNew.close}
          onSaved={(project) => {
            setValue('PROJECTID', project.projectId, { shouldValidate: true });
            addNew.close();
          }}
        />
      </FormModal>
    </>
  );
}

/** Module form in its own modal: the page's Add / Edit dialog, or an "Add new" from a combo. */
export function ModuleFormModal({ open, ...props }: ModuleFormProps & { open: boolean }) {
  return (
    <FormModal
      open={open}
      size="md"
      title={props.record ? 'Edit Module' : 'Add Module'}
      subtitle={
        props.record ? `Editing: ${props.record.moduleName}` : 'Fill module details'
      }
      onClose={props.onCancel}
    >
      <ModuleFormFields {...props} />
    </FormModal>
  );
}
