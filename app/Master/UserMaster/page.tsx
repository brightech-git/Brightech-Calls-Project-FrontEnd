'use client';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format/date';

import { useState, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { Pencil } from 'lucide-react';
import { CapitalizedInput } from '@/components/ui/CapitalizedInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { CustomTable, TableColumn } from '@/components/CustomTable';
import {
  useRegister,
  useGetAllUsers,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/Auth/useAuth';
import { UserRecord, UpdateUserPayload, RegisterPayload } from '@/types/Auth/Auth';
import ConfirmDialog from '@/components/ConfirmDialog';
import { usePageHeader } from '@/context/PageHeaderContext';
import { useToast } from '@/components/Toast';
import { COLORS, FONT } from '@/utils/theme';
import { useRole } from '@/hooks/ApiHooks/RoleMaster/useRoleMaster';
import { useClientList } from '@/hooks/ClientMaster/useClientMaster';
import { SelectCombobox } from '@/components/ui/SelectComboBox';
import { NativeSelectWrapper } from '@/components/ui/NativeSelectWrapper';

// ─── Schema ───────────────────────────────────────────────────────────────────

// One shared field shape for both create and edit — every field is always
// present as a string (never undefined) so useForm<UserForm> stays a single
// consistent type regardless of which schema is active; only the
// validation rules differ between create and edit below.
interface UserForm {
  username: string;
  roleId: string;
  active: 'Y' | 'N';
  // Whether this account represents a client — when "Y", clientId is required.
  isClient: 'Y' | 'N';
  clientId: string;
  // Create-mode only
  password: string;
  confirmPassword: string;
  // Edit-mode only — changing the password requires the old one
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
const userSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    roleId: z.string().min(1, 'Role is required'),
    active: z.enum(['Y', 'N'], {
      error: "Active must be either 'Y' or 'N'",
    }),
    isClient: z.enum(['Y', 'N']),
    clientId: z.string(),
    password: z.string().min(5, 'Password must be at least 5 characters'),
    confirmPassword: z.string(),
    oldPassword: z.string(),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.isClient !== 'Y' || d.clientId.length > 0, {
    message: 'Client is required when Client is Yes',
    path: ['clientId'],
  });
const editSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    roleId: z.string().min(1, 'Role is required'),
    active: z.enum(['Y', 'N'], {
      error: "Active must be either 'Y' or 'N'",
    }),
    isClient: z.enum(['Y', 'N']),
    clientId: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
    oldPassword: z.string(),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .refine((d) => !d.newPassword || d.newPassword.length >= 5, {
    message: 'New password must be at least 5 characters',
    path: ['newPassword'],
  })
  .refine((d) => !d.newPassword || d.oldPassword.length > 0, {
    message: 'Old password is required to set a new password',
    path: ['oldPassword'],
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((d) => d.isClient !== 'Y' || d.clientId.length > 0, {
    message: 'Client is required when Client is Yes',
    path: ['clientId'],
  });

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<UserRecord & Record<string, unknown>>[] = [
  {
    key: 'USERID',
    header: '#',
    align: 'center',
    width: '50px',
  },
  {
    key: 'USERNAME',
    header: 'Username',
    sortable: true,
  },
  {
    key: 'ROLEID',
    header: 'Role',
  },
  {
    key: 'ACTIVE',
    header: 'Status',
    sortable: true,
    render: (row) => (
      <span
        style={{
          background: row.ACTIVE === 'Y' ? '#dcfce7' : '#fee2e2',
          color: row.ACTIVE === 'Y' ? '#16a34a' : '#ef4444',
        }}
        className="py-0.5 px-2.5 rounded-full text-[11px] font-semibold"
      >
        {row.ACTIVE === 'Y' ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    key: 'UPDATED',
    header: 'Created',
    sortable: true,
    render: (row) => {
      const v = row.UPDATED;
      if (!v) return <span>—</span>;
      const d = new Date(v as string);
      return <span>{isNaN(d.getTime()) ? '—' : formatDate(d)}</span>;
    },
  },
  {
    key: 'UPTIME',
    header: 'Updated',
    sortable: true,
    render: (row) => {
      const v = row.UPTIME;
      if (!v) return <span>—</span>;
      const d = new Date(v as string);
      return <span>{isNaN(d.getTime()) ? '—' : formatDate(d)}</span>;
    },
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserMasterPage() {
  const toast = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<UserRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<UserRecord | null>(null);
  const { roles } = useRole();
  console.log(roles, 'roles');
  const roleItems = useMemo(() => {
    return roles.map((r) => ({
      label: r.ROLENAME,
      value: String(r.ROLEID),
    }));
  }, [roles]);
  console.log(roleItems, 'roleItems');
  const activeOptions = [
    {
      label: 'YES',
      value: 'Y',
    },
    {
      label: 'NO',
      value: 'N',
    },
  ];
  const clientOptions = [
    {
      label: 'YES',
      value: 'Y',
    },
    {
      label: 'NO',
      value: 'N',
    },
  ];
  const { data: clients = [] } = useClientList();
  const clientItems = useMemo(() => {
    return clients.map((c: any) => ({
      label: c.CLIENTNAME,
      value: String(c.CLIENTID),
    }));
  }, [clients]);
  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { data: users = [], isLoading, refetch } = useGetAllUsers();
  const userList = users || [];
  console.log(userList, 'usersList');
  const isEditMode = editId !== null;
  usePageHeader({
    title: 'User Master',
    subtitle: 'Register and manage user accounts',
  });
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(isEditMode ? editSchema : userSchema),
    defaultValues: {
      username: '',
      roleId: '',
      active: 'Y',
      isClient: 'N',
      clientId: '',
      password: '',
      confirmPassword: '',
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });
  const isPending = isRegistering || isUpdating;
  const isClientSelected = watch('isClient') === 'Y';
  const handleEdit = (row: UserRecord & Record<string, unknown>) => {
    setEditId(row.USERID as string);
    setEditRow(row as UserRecord);
    reset({
      username: row.USERNAME as string,
      roleId: row.ROLEID != null ? String(row.ROLEID) : '',
      active: (row.ACTIVE as string) === 'N' ? 'N' : 'Y',
      isClient: (row.ISCLIENT as string) === 'Y' ? 'Y' : 'N',
      clientId: row.CLIENTID != null ? String(row.CLIENTID) : '',
      password: '',
      confirmPassword: '',
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
  };
  const handleDelete = (row: UserRecord & Record<string, unknown>) => {
    setDeleteRow(row as UserRecord);
  };
  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteUser(deleteRow.USERID, {
      onSuccess: () => {
        toast.success('User Deleted', `"${deleteRow.USERNAME}" deleted successfully.`);
        setDeleteRow(null);
        refetch();
      },
      onError: (err: any) => {
        toast.error('Delete Failed', err?.response?.data?.message || 'Delete failed.');
        setDeleteRow(null);
      },
    });
  };
  const handleCancel = () => {
    setEditId(null);
    setEditRow(null);
    reset({
      username: '',
      roleId: '',
      active: 'Y',
      isClient: 'N',
      clientId: '',
      password: '',
      confirmPassword: '',
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
  };
  const onSubmit = (data: UserForm) => {
    if (isEditMode) {
      // Only username/roleId/active are always sent; the password fields
      // are only included when the user actually filled in a new one —
      // leaving them out means the backend leaves the password untouched.
      const updatePayload: UpdateUserPayload = {
        username: data.username,
        roleId: data.roleId,
        active: data.active,
        isClient: data.isClient,
        clientId: data.isClient === 'Y' ? Number(data.clientId) : null,
      };
      if (data.newPassword) {
        updatePayload.oldPassword = data.oldPassword;
        updatePayload.newPassword = data.newPassword;
      }
      updateUser(
        {
          id: editId!,
          payload: updatePayload,
        },
        {
          onSuccess: () => {
            toast.success('User Updated', `"${data.username}" updated successfully.`);
            refetch();
            handleCancel();
          },
          onError: (err: any) => {
            toast.error(
              'Update Failed',
              err?.response?.data?.message || 'Update failed.',
            );
          },
        },
      );
    } else {
      const registerPayload: RegisterPayload = {
        username: data.username,
        password: data.password,
        roleId: data.roleId,
        active: data.active,
        isClient: data.isClient,
        clientId: data.isClient === 'Y' ? Number(data.clientId) : null,
      };
      register(registerPayload, {
        onSuccess: (res) => {
          toast.success(
            'User Registered',
            `"${res.data.username}" registered successfully.`,
          );
          refetch();
          reset();
        },
        onError: (err: any) =>
          toast.error(
            'Registration Failed',
            err?.response?.data?.message || 'Registration failed.',
          ),
      });
    }
  };
  return (
    <>
      <div className="min-w-0">
        <Grid className="grid min-w-0 grid-cols-[minmax(300px,350px)_minmax(0,1fr)] items-start gap-3 max-xl:grid-cols-1">
          {/* ── Left: Register Form ── */}
          <div className="rounded-lg border border-line bg-white min-w-0 overflow-hidden">
            <div className="border-b border-line bg-white px-3 py-3 [&>p:first-child]:text-lg [&>p:last-child]:mt-1 [&>p:last-child]:text-xs [&>p:last-child]:text-muted">
              <Text className="text-sm font-normal text-ink">
                {isEditMode ? 'Edit User' : 'Register User'}
              </Text>
              <Text
                className="text-[11px] text-muted mt-0.5"
              >
                {isEditMode ? `Editing user ID: ${editId}` : 'Create a new user account'}
              </Text>
            </div>

            <div className="p-3">
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack className="flex w-full flex-col items-stretch gap-4">
                  <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                    <label className="block text-sm leading-5 text-muted">Username *</label>
                    <Controller
                      name="username"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          value={field.value}
                          field="username"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter username"
                          isCapitalized
                          className="max-w-full"
                        />
                      )}
                    />
                    {errors.username && (
                      <span className="col-start-2 text-xs text-rose-600">
                        {errors.username.message}
                      </span>
                    )}
                  </div>

                  {!isEditMode && (
                    <>
                      <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                        <label className="block text-sm leading-5 text-muted">Password *</label>
                        <Controller
                          name="password"
                          control={control}
                          render={({ field }) => (
                            <PasswordInput
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Min 5 characters"
                            />
                          )}
                        />
                        {errors.password && (
                          <span className="col-start-2 text-xs text-rose-600">
                            {errors.password.message}
                          </span>
                        )}
                      </div>

                      <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                        <label className="block text-sm leading-5 text-muted">Confirm Password *</label>
                        <Controller
                          name="confirmPassword"
                          control={control}
                          render={({ field }) => (
                            <PasswordInput
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Re-enter password"
                            />
                          )}
                        />
                        {errors.confirmPassword && (
                          <span className="col-start-2 text-xs text-rose-600">
                            {errors.confirmPassword.message}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {isEditMode && (
                    <>
                      <Text
                        className="text-[11px] font-normal text-ink tracking-wide uppercase mt-0.5"
                      >
                        Change Password (optional)
                      </Text>

                      <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                        <label className="block text-sm leading-5 text-muted">Old Password</label>
                        <Controller
                          name="oldPassword"
                          control={control}
                          render={({ field }) => (
                            <PasswordInput
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Current password"
                            />
                          )}
                        />
                        {errors.oldPassword && (
                          <span className="col-start-2 text-xs text-rose-600">
                            {errors.oldPassword.message}
                          </span>
                        )}
                      </div>

                      <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                        <label className="block text-sm leading-5 text-muted">New Password</label>
                        <Controller
                          name="newPassword"
                          control={control}
                          render={({ field }) => (
                            <PasswordInput
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Leave blank to keep current"
                            />
                          )}
                        />
                        {errors.newPassword && (
                          <span className="col-start-2 text-xs text-rose-600">
                            {errors.newPassword.message}
                          </span>
                        )}
                      </div>

                      <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                        <label className="block text-sm leading-5 text-muted">
                          Confirm New Password
                        </label>
                        <Controller
                          name="confirmNewPassword"
                          control={control}
                          render={({ field }) => (
                            <PasswordInput
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Re-enter new password"
                            />
                          )}
                        />
                        {errors.confirmNewPassword && (
                          <span className="col-start-2 text-xs text-rose-600">
                            {errors.confirmNewPassword.message}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                    <label className="block text-sm leading-5 text-muted">Role *</label>
                    <Controller
                      name="roleId"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          editId={editId ? Number(editId) : null}
                          items={roleItems}
                          maxWidth="100%"
                          placeholder="Select Role"
                        />
                      )}
                    />
                  </div>

                  <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                    <label className="block text-sm leading-5 text-muted">Active *</label>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <NativeSelectWrapper
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          items={activeOptions}
                          maxWidth="100%"
                          placeholder="Select Status"
                        />
                      )}
                    />
                    {errors.active && (
                      <span className="col-start-2 text-xs text-rose-600">
                        {errors.active.message}
                      </span>
                    )}
                  </div>

                  <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                    <label className="block text-sm leading-5 text-muted">Client *</label>
                    <Controller
                      name="isClient"
                      control={control}
                      render={({ field }) => (
                        <NativeSelectWrapper
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          items={clientOptions}
                          maxWidth="100%"
                          placeholder="Select Client"
                        />
                      )}
                    />
                    {errors.isClient && (
                      <span className="col-start-2 text-xs text-rose-600">
                        {errors.isClient.message}
                      </span>
                    )}
                  </div>

                  {isClientSelected && (
                    <div className="grid min-w-0 w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 [&>label]:col-start-1 [&>label]:row-start-1 [&>div]:col-start-2 [&>div]:row-start-1 [&>div]:min-w-0 max-sm:grid-cols-[100px_minmax(0,1fr)] max-sm:gap-x-2">
                      <label className="block text-sm leading-5 text-muted">
                        Client (Client Master) *
                      </label>
                      <Controller
                        name="clientId"
                        control={control}
                        render={({ field }) => (
                          <SelectCombobox
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            editId={editId ? Number(editId) : null}
                            items={clientItems}
                            maxWidth="100%"
                            placeholder="Select client"
                          />
                        )}
                      />
                      {errors.clientId && (
                        <span className="col-start-2 text-xs text-rose-600">
                          {errors.clientId.message}
                        </span>
                      )}
                    </div>
                  )}

                  <HStack className="w-full gap-2">
                    <button
                      type="submit"
                      className={cn(buttonClass, buttonVariants.primary, 'flex-1')}
                      disabled={isPending}
                    >
                      <Pencil size={14} />
                      {isPending
                        ? isEditMode
                          ? 'Updating...'
                          : 'Registering...'
                        : isEditMode
                          ? 'Update User'
                          : 'Register User'}
                    </button>
                    {isEditMode && (
                      <button
                        type="button"
                        className={cn(buttonClass, 'flex-1')}
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    )}
                  </HStack>
                </VStack>
              </form>
            </div>
          </div>

          {/* ── Right: Table ── */}
          <div className="min-w-0">
            <CustomTable
              title="Registered Users"
              columns={COLUMNS}
              data={userList as (UserRecord & Record<string, unknown>)[]}
              rowKey="USERID"
              isLoading={isLoading}
              searchPlaceholder="Search users..."
              emptyMessage="No users registered yet."
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </Grid>
      </div>

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete user "${deleteRow?.USERNAME}"? This action cannot be undone.`}
        isPending={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
