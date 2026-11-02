'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, RefreshCw } from 'lucide-react';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useClientList } from '@/hooks/ClientMaster/useClientMaster';
import { useProjectTypeList } from '@/hooks/ProjectTypeMaster/useProjectTypeMaster';
import {
  AppDialog,
  Button,
  ConfirmDialog,
  DataTable,
  SecretValue,
  ErrorState,
  Notification,
  SelectField,
  useToast,
  type TableColumn,
} from '@/components/common';
import { FormFields, type FormFieldConfig } from '@/components/form/FormFields';
import { DataExport, type ExportColumn } from '@/components/DataExport';
import { getApiErrorMessage, normalizeApiError } from '@/lib/api/errors';
import type { ProjectLinkRecord_Table } from '@/types/ProjectLink/ProjectLink';
import { projectLinkDefaults, projectLinkSchema, type ProjectLinkForm } from './schema';
import {
  useProjectLinkList,
  useCreateProjectLink,
  useUpdateProjectLink,
  useDeleteProjectLink,
} from './hooks';
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
    <div className="workspace-page">
      <div className="workspace-toolbar">
        <div>
          <h1>Project links</h1>
          <p>Client connections and access details</p>
        </div>
        <div className="workspace-actions">
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
      <div className="filter-grid">
        <SelectField
          label="Client"
          value={filters.clientId}
          options={clientOptions}
          placeholder="All clients"
          onChange={(event) => setFilters({ ...filters, clientId: event.target.value })}
        />
        <SelectField
          label="Project type"
          value={filters.projectTypeId}
          options={typeOptions}
          placeholder="All types"
          onChange={(event) =>
            setFilters({ ...filters, projectTypeId: event.target.value })
          }
        />
        <SelectField
          label="Device"
          value={filters.deviceType}
          options={devices}
          placeholder="All devices"
          onChange={(event) => setFilters({ ...filters, deviceType: event.target.value })}
        />
        <SelectField
          label="Activity"
          value={filters.active}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
          placeholder="All records"
          onChange={(event) => setFilters({ ...filters, active: event.target.value })}
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
      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit project link' : 'New project link'}
        description="Set the client, project and connection details."
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
        <form
          id="project-link-form"
          onSubmit={form.handleSubmit(submit)}
          noValidate
        >
          <div className="form-grid">
            {(['clientId', 'projectTypeId'] as const).map((name) => (
              <Controller
                key={name}
                control={form.control}
                name={name}
                render={({ field, fieldState }) => (
                  <SelectField
                    {...field}
                    label={name === 'clientId' ? 'Client' : 'Project type'}
                    value={field.value ? String(field.value) : ''}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    options={name === 'clientId' ? clientOptions : typeOptions}
                    required
                    error={fieldState.error?.message}
                    disabled={pending}
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
          <label className="check-field">
            <input
              type="checkbox"
              {...form.register('active')}
              disabled={pending}
            />
            Active
          </label>
        </form>
      </AppDialog>
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
