'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, RefreshCw } from 'lucide-react';
import { usePageHeader } from '@/src/context/PageHeaderContext';
import { useClientList } from '@/src/module/client-master/hook/use-client-master';
import { useProjectTypeList } from '@/src/module/project-type-master/hook/use-project-type-master';
import {
  Button,
  ConfirmDialog,
  DataTable,
  SecretValue,
  ErrorState,
  Notification,
  useToast,
  type TableColumn,
} from '@/src/components/common';
import { FormFields, type FormFieldConfig } from '@/src/components/form/FormFields';
import { ComboBox, FormModal, FormModalBody, useAddNew } from '@/src/components/form';
import { ClientFormModal } from '@/src/module/client-master/component/client-form';
import { DataExport, type ExportColumn } from '@/src/components/DataExport';
import { getApiErrorMessage, normalizeApiError } from '@/lib/api/errors';
import type { ProjectLinkRecord_Table } from '@/src/module/project-link/type/project-link.types';
import {
  projectLinkDefaults,
  projectLinkSchema,
  type ProjectLinkForm,
} from '../type/project-link.schema';
import {
  useProjectLinkList,
  useCreateProjectLink,
  useUpdateProjectLink,
  useDeleteProjectLink,
} from '../hook/use-project-link';
const devices = [
  { value: 'D', label: 'Desktop' },
  { value: 'M', label: 'Mobile' },
  { value: 'W', label: 'Website' },
];
const statuses = [
  { value: 'L', label: 'Live' },
  { value: 'T', label: 'Test' },
];
const columns: TableColumn<ProjectLinkRecord_Table>[] = [
  { key: 'linkId', header: 'ID', sortable: true },
  { key: 'clientName', header: 'Client', sortable: true },
  { key: 'projectTypeName', header: 'Project type', sortable: true },
  {
    key: 'url',
    header: 'URL',
    render: (row) =>
      row.url && /^https?:\/\//i.test(row.url) ? (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.url}
        </a>
      ) : (
        row.url || '—'
      ),
  },
  { key: 'userName', header: 'User name', sortable: true },
  {
    key: 'password',
    header: 'Password',
    render: (row) => <SecretValue value={row.password} />,
  },
  {
    key: 'authPassword',
    header: 'Auth password',
    render: (row) => (
      <SecretValue
        value={row.authPassword}
        label="auth password"
      />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) =>
      statuses.find((item) => item.value === row.status)?.label ?? row.status ?? '—',
  },
  {
    key: 'type',
    header: 'Device',
    render: (row) =>
      devices.find((item) => item.value === row.type)?.label ?? row.type ?? '—',
  },
  {
    key: 'active',
    total: 'active',
    header: 'Active',
    render: (row) => (row.active ? 'Active' : 'Inactive'),
  },
];
const exportColumns: ExportColumn<ProjectLinkRecord_Table>[] = [
  { key: 'linkId', label: 'ID' },
  { key: 'clientName', label: 'Client' },
  { key: 'projectTypeName', label: 'Project type' },
  { key: 'url', label: 'URL' },
  { key: 'userName', label: 'User name' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Device' },
];
export default function ProjectLinksPage() {
  usePageHeader({ title: 'Project Links', subtitle: 'Manage client project access' });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectLinkRecord_Table | null>(null);
  const [deleting, setDeleting] = useState<ProjectLinkRecord_Table | null>(null);
  const [filters, setFilters] = useState({
    clientId: '',
    projectTypeId: '',
    deviceType: '',
    active: 'true',
  });
  const clients = useClientList();
  const types = useProjectTypeList();
  const links = useProjectLinkList({
    clientId: filters.clientId ? Number(filters.clientId) : undefined,
    projectTypeId: filters.projectTypeId ? Number(filters.projectTypeId) : undefined,
    deviceType: filters.deviceType || undefined,
    active: filters.active === '' ? undefined : filters.active === 'true',
  });
  const create = useCreateProjectLink();
  const update = useUpdateProjectLink();
  const remove = useDeleteProjectLink();
  const pending = create.isPending || update.isPending;
  // "Add new" on the Client combo opens the Client Master form.
  const addNew = useAddNew<'client'>();
  const form = useForm<ProjectLinkForm>({
    resolver: zodResolver(projectLinkSchema),
    defaultValues: projectLinkDefaults,
  });
  const clientOptions = (clients.data ?? []).map((client) => ({
    value: String(client.CLIENTID),
    label: client.CLIENTNAME,
  }));
  const typeOptions = (types.data ?? []).map((type) => ({
    value: String(type.projectTypeId),
    label: type.projectTypeName,
  }));
  const fields: FormFieldConfig<ProjectLinkForm>[] = [
    { name: 'url', label: 'URL', placeholder: 'https://example.com', fullWidth: true },
    { name: 'userName', label: 'User name' },
    { name: 'password', label: 'Password', type: 'password' },
    { name: 'authPassword', label: 'Auth password', type: 'password' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: statuses,
      required: true,
    },
    { name: 'type', label: 'Device', type: 'select', options: devices, required: true },
  ];
  function edit(row: ProjectLinkRecord_Table | null) {
    setEditing(row);
    form.reset(
      row
        ? {
            clientId: row.clientId,
            projectTypeId: row.projectTypeId,
            url: row.url ?? '',
            userName: row.userName ?? '',
            password: row.password ?? '',
            authPassword: row.authPassword ?? '',
            status: row.status === 'T' ? 'T' : 'L',
            type: row.type === 'D' || row.type === 'M' ? row.type : 'W',
            active: !!row.active,
          }
        : projectLinkDefaults,
    );
    setOpen(true);
  }
  async function submit(values: ProjectLinkForm) {
    try {
      if (editing)
        await update.mutateAsync({ id: String(editing.linkId), payload: values });
      else await create.mutateAsync(values);
      toast.success(editing ? 'Project link updated' : 'Project link created');
      setOpen(false);
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.errors && typeof apiError.errors === 'object') {
        for (const [field, message] of Object.entries(apiError.errors)) {
          if (field in projectLinkSchema.shape && typeof message === 'string') {
            form.setError(field as keyof ProjectLinkForm, { type: 'server', message });
          }
        }
      }
      toast.error('Unable to save project link', apiError.message);
    }
  }
  const data = (links.data ?? []) as ProjectLinkRecord_Table[];
  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Project links</h1>
          <p className="text-xs text-muted">Client connections and access details</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          <Button
            loading={links.isFetching}
            onClick={() => links.refetch()}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
          <DataExport
            data={data}
            columns={exportColumns}
            filename="Project Links"
            title="Project Links"
          />
          <Button
            variant="primary"
            onClick={() => edit(null)}
          >
            <Plus size={16} />
            New link
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2 border-b border-line pb-3 [&>*]:min-w-36 [&>*]:flex-1">
        <ComboBox
          label="Client"
          value={filters.clientId}
          options={clientOptions}
          placeholder="All clients"
          advanceOnSelect={false}
          onChange={(value) => setFilters({ ...filters, clientId: value })}
        />
        <ComboBox
          label="Project type"
          value={filters.projectTypeId}
          options={typeOptions}
          placeholder="All types"
          advanceOnSelect={false}
          onChange={(value) => setFilters({ ...filters, projectTypeId: value })}
        />
        <ComboBox
          label="Device"
          value={filters.deviceType}
          options={devices}
          placeholder="All devices"
          advanceOnSelect={false}
          onChange={(value) => setFilters({ ...filters, deviceType: value })}
        />
        <ComboBox
          label="Activity"
          value={filters.active}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
          placeholder="All records"
          advanceOnSelect={false}
          onChange={(value) => setFilters({ ...filters, active: value })}
        />
        <Button
          onClick={() =>
            setFilters({
              clientId: '',
              projectTypeId: '',
              deviceType: '',
              active: 'true',
            })
          }
        >
          Reset filters
        </Button>
      </div>
      {(clients.isError || types.isError) && (
        <Notification tone="warning">
          Some lookup data could not be loaded.{' '}
          <Button
            onClick={() => {
              void clients.refetch();
              void types.refetch();
            }}
          >
            Retry lookups
          </Button>
        </Notification>
      )}
      {links.isError ? (
        <ErrorState
          error={links.error}
          onRetry={() => links.refetch()}
          retrying={links.isFetching}
        />
      ) : (
        <DataTable
          title="Project links"
          columns={columns}
          data={data}
          rowKey="linkId"
          selectable
          isLoading={links.isPending}
          onEdit={edit}
          onDelete={setDeleting}
          emptyMessage="No project links match these filters."
        />
      )}
      <FormModal
        open={open}
        size="md"
        onClose={() => setOpen(false)}
        title={editing ? 'Edit project link' : 'New project link'}
        subtitle="Set the client, project and connection details."
        busy={pending}
        footer={
          <>
            <Button
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="project-link-form"
              variant="primary"
              loading={pending}
              loadingText="Saving…"
              disabled={
                clients.isPending || types.isPending || clients.isError || types.isError
              }
            >
              Save link
            </Button>
          </>
        }
      >
        <FormModalBody>
          <form
            id="project-link-form"
            onSubmit={form.handleSubmit(submit)}
            noValidate
          >
            <div className="mb-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              {(['clientId', 'projectTypeId'] as const).map((name) => (
                <Controller
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field, fieldState }) => (
                    <ComboBox
                      ref={field.ref}
                      name={field.name}
                      label={name === 'clientId' ? 'Client' : 'Project type'}
                      value={field.value ? String(field.value) : ''}
                      onChange={(value) => field.onChange(value ? Number(value) : 0)}
                      onBlur={field.onBlur}
                      options={name === 'clientId' ? clientOptions : typeOptions}
                      placeholder={
                        name === 'clientId' ? 'Select client' : 'Select project type'
                      }
                      required
                      error={fieldState.error?.message}
                      disabled={pending}
                      addNew={name === 'clientId'}
                      addNewLabel="Add new client"
                      onAddNew={(typed) => addNew.open('client', typed)}
                    />
                  )}
                />
              ))}
            </div>
            <FormFields
              fields={fields}
              control={form.control}
              disabled={pending}
            />
            <label className="my-3 flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                className="size-4 accent-brand"
                {...form.register('active')}
                disabled={pending}
              />
              Active
            </label>
          </form>
        </FormModalBody>
      </FormModal>
      <ClientFormModal
        open={addNew.is('client')}
        initial={{ CLIENTNAME: addNew.seed.toUpperCase() }}
        onCancel={addNew.close}
        onSaved={(client) => {
          form.setValue('clientId', client.CLIENTID, { shouldValidate: true });
          addNew.close();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete project link"
        message={`Delete project link #${deleting?.linkId}?`}
        isPending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting)
            remove.mutate(String(deleting.linkId), {
              onSuccess: () => {
                toast.success('Project link deleted');
                setDeleting(null);
              },
              onError: (error) =>
                toast.error('Unable to delete project link', getApiErrorMessage(error)),
            });
        }}
      />
    </div>
  );
}
