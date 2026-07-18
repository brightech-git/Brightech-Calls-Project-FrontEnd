"use client";

import { useState ,useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { Pencil } from "lucide-react";

import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import { useRegister, useGetAllUsers, useUpdateUser, useDeleteUser } from "@/hooks/Auth/useAuth";
import { UserRecord, UpdateUserPayload, RegisterPayload } from "@/types/Auth/Auth";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT } from "@/utils/theme";
import { useRole } from "@/hooks/ApiHooks/RoleMaster/useRoleMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";

// ─── Schema ───────────────────────────────────────────────────────────────────

// One shared field shape for both create and edit — every field is always
// present as a string (never undefined) so useForm<UserForm> stays a single
// consistent type regardless of which schema is active; only the
// validation rules differ between create and edit below.
interface UserForm {
  username: string;
  roleId: string;
  active: "Y" | "N";
  // Whether this account represents a client — when "Y", clientId is required.
  isClient: "Y" | "N";
  clientId: string;
  // Create-mode only
  password: string;
  confirmPassword: string;
  // Edit-mode only — changing the password requires the old one
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  roleId : z.string().min(1, "Role is required"),
  active: z.enum(["Y", "N"], {
    error: "Active must be either 'Y' or 'N'",
  }),
  isClient: z.enum(["Y", "N"]),
  clientId: z.string(),
  password: z.string().min(5, "Password must be at least 5 characters"),
  confirmPassword: z.string(),
  oldPassword: z.string(),
  newPassword: z.string(),
  confirmNewPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((d) => d.isClient !== "Y" || d.clientId.length > 0, {
  message: "Client is required when Client is Yes",
  path: ["clientId"],
});

const editSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  roleId : z.string().min(1, "Role is required"),
  active: z.enum(["Y", "N"], {
    error: "Active must be either 'Y' or 'N'",
  }),
  isClient: z.enum(["Y", "N"]),
  clientId: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
  oldPassword: z.string(),
  newPassword: z.string(),
  confirmNewPassword: z.string(),
}).refine((d) => !d.newPassword || d.newPassword.length >= 5, {
  message: "New password must be at least 5 characters",
  path: ["newPassword"],
}).refine((d) => !d.newPassword || d.oldPassword.length > 0, {
  message: "Old password is required to set a new password",
  path: ["oldPassword"],
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
}).refine((d) => d.isClient !== "Y" || d.clientId.length > 0, {
  message: "Client is required when Client is Yes",
  path: ["clientId"],
});

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<UserRecord & Record<string, unknown>>[] = [
  { key: "USERID",   header: "#",        align: "center", width: "50px" },
  { key: "USERNAME", header: "Username", sortable: true },
  {key:"ROLEID" ,header : "Role"},
  { key: "ACTIVE",   header: "Status",   sortable: true,
    render: (row) => (
      <span style={{
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: row.ACTIVE === "Y" ? "#dcfce7" : "#fee2e2",
        color: row.ACTIVE === "Y" ? "#16a34a" : "#ef4444",
      }}>
        {row.ACTIVE === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
  { key: "UPDATED",  header: "Created",  sortable: true,
    render: (row) => {
      const v = row.UPDATED;
      if (!v) return <span>—</span>;
      const d = new Date(v as string);
      return <span>{isNaN(d.getTime()) ? "—" : d.toLocaleDateString()}</span>;
    }
  },
  { key: "UPTIME",   header: "Updated",  sortable: true,
    render: (row) => {
      const v = row.UPTIME;
      if (!v) return <span>—</span>;
      const d = new Date(v as string);
      return <span>{isNaN(d.getTime()) ? "—" : d.toLocaleDateString()}</span>;
    }
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserMasterPage() {
  const toast = useToast();

  const [editId, setEditId]          = useState<string | null>(null);
  const [editRow, setEditRow]        = useState<UserRecord | null>(null);
  const [deleteRow, setDeleteRow]    = useState<UserRecord | null>(null);


  const { roles } = useRole();
  console.log(roles,'roles')

  const roleItems = useMemo(()=>{
    return roles.map((r) => ({ label: r.ROLENAME, value: String(r.ROLEID) })) 
  },[roles]) 

  console.log(roleItems,'roleItems')

  const activeOptions = [
    {label:"YES" , value :"Y"},
    {label:"NO" , value :"N"},
  ]

  const clientOptions = [
    {label:"YES" , value :"Y"},
    {label:"NO" , value :"N"},
  ]

  const { data: clients = [] } = useClientList();

  const clientItems = useMemo(() => {
    return clients.map((c: any) => ({ label: c.CLIENTNAME, value: String(c.CLIENTID) }));
  }, [clients]);

  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: updateUser, isPending: isUpdating }  = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting }  = useDeleteUser();
  const { data: users = [], isLoading, refetch }       = useGetAllUsers();

  const userList = users || [];

  console.log(userList ,'usersList');

  const isEditMode = editId !== null;

  usePageHeader({ title: "User Master", subtitle: "Register and manage user accounts" });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(isEditMode ? editSchema : userSchema),
    defaultValues: {
      username: "", roleId: "", active: "Y",
      isClient: "N", clientId: "",
      password: "", confirmPassword: "",
      oldPassword: "", newPassword: "", confirmNewPassword: "",
    },
  });

  const isPending = isRegistering || isUpdating;
  const isClientSelected = watch("isClient") === "Y";

  const handleEdit = (row: UserRecord & Record<string, unknown>) => {
    setEditId(row.USERID as string);
    setEditRow(row as UserRecord);
    reset({
      username: row.USERNAME as string,
      roleId: row.ROLEID != null ? String(row.ROLEID) : "",
      active: (row.ACTIVE as string) === "N" ? "N" : "Y",
      isClient: (row.ISCLIENT as string) === "Y" ? "Y" : "N",
      clientId: row.CLIENTID != null ? String(row.CLIENTID) : "",
      password: "", confirmPassword: "",
      oldPassword: "", newPassword: "", confirmNewPassword: "",
    });
  };

  const handleDelete = (row: UserRecord & Record<string, unknown>) => {
    setDeleteRow(row as UserRecord);
  };

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteUser(deleteRow.USERID, {
      onSuccess: () => {
        toast.success("User Deleted", `"${deleteRow.USERNAME}" deleted successfully.`);
        setDeleteRow(null);
        refetch();
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      },
    });
  };

  const handleCancel = () => {
    setEditId(null);
    setEditRow(null);
    reset({
      username: "", roleId: "", active: "Y",
      isClient: "N", clientId: "",
      password: "", confirmPassword: "",
      oldPassword: "", newPassword: "", confirmNewPassword: "",
    });
  };

  const onSubmit = (data: UserForm) => {
    if (isEditMode) {
      // Only username/roleId/active are always sent; the password fields
      // are only included when the user actually filled in a new one —
      // leaving them out means the backend leaves the password untouched.
      const updatePayload: UpdateUserPayload = {
        username: data.username,
        roleId:   data.roleId,
        active:   data.active,
        isClient: data.isClient,
        clientId: data.isClient === "Y" ? Number(data.clientId) : null,
      };

      if (data.newPassword) {
        updatePayload.oldPassword = data.oldPassword;
        updatePayload.newPassword = data.newPassword;
      }

      updateUser({ id: editId!, payload: updatePayload }, {
        onSuccess: () => {
          toast.success("User Updated", `"${data.username}" updated successfully.`);
          refetch();
          handleCancel();
        },
        onError: (err: any) => {
          toast.error("Update Failed", err?.response?.data?.message || "Update failed.");
        },
      });
    } else {
      const registerPayload: RegisterPayload = {
        username: data.username,
        password: data.password,
        roleId:   data.roleId,
        active:   data.active,
        isClient: data.isClient,
        clientId: data.isClient === "Y" ? Number(data.clientId) : null,
      };

      register(registerPayload, {
        onSuccess: (res) => {
          toast.success("User Registered", `"${res.data.username}" registered successfully.`);
          refetch();
          reset();
        },
        onError: (err: any) => toast.error("Registration Failed", err?.response?.data?.message || "Registration failed."),
      });
    }
  };

  return (
    <>
      <style>{`
        .um-page {
          background: transparent;
          min-height: 100%;
          font-family: ${FONT.family};
        }
        .um-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .um-card-head {
          padding: 16px 20px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .um-card-body { padding: 20px; }

        .um-card input, .um-card textarea, .um-card select {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          border-radius: 8px !important;
          color: ${COLORS.textPrimary} !important;
          font-size: 13px !important;
        }
        .um-card input::placeholder, .um-card textarea::placeholder {
          color: ${COLORS.textMuted} !important;
        }
        .um-card input:focus, .um-card textarea:focus {
          border-color: ${COLORS.textSecondary} !important;
          box-shadow: 0 0 0 2px rgba(107,114,128,0.15) !important;
          outline: none !important;
        }
        .um-card label, .um-card [class*="Field"] {
          color: ${COLORS.textSecondary} !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
        }
        .um-card [data-invalid] { border-color: #f87171 !important; }

        .um-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        .um-field-label {
          color: ${COLORS.textSecondary};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .um-field-error {
          font-size: 11px;
          color: #ef4444;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 18px;
          height: 38px;
          border-radius: 8px;
          border: none;
          background: ${COLORS.btnPrimaryBg};
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
          width: 100%;
          justify-content: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .btn-primary:hover { background: ${COLORS.btnPrimaryHover}; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 18px;
          height: 38px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: ${COLORS.textSecondary};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
          justify-content: center;
        }
        .btn-secondary:hover { background: #f3f4f6; }

        .um-table-wrap > div {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
        }
        .um-table-wrap .ct-th {
          background: #f9fafb !important;
          color: ${COLORS.textSecondary} !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .um-table-wrap .ct-td {
          color: ${COLORS.textSecondary} !important;
          border-top: 1px solid #f3f4f6 !important;
        }
        .um-table-wrap .ct-td.primary { color: ${COLORS.textPrimary} !important; }
        .um-table-wrap .ct-tr:hover .ct-td { background: #f9fafb !important; }
        .um-table-wrap .ct-search {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: ${COLORS.textPrimary} !important;
        }
        .um-table-wrap .ct-search::placeholder { color: ${COLORS.textMuted} !important; }
        .um-table-wrap .ct-search:focus { border-color: ${COLORS.textSecondary} !important; }
        .um-table-wrap .ct-size-select {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: ${COLORS.textSecondary} !important;
        }
        .um-table-wrap .ct-page-btn { color: ${COLORS.textSecondary} !important; }
        .um-table-wrap .ct-page-btn.active {
          background: ${COLORS.primary} !important;
          color: #fff !important;
          border-color: ${COLORS.primary} !important;
        }
        .um-table-wrap .ct-actions-btn { color: ${COLORS.textSecondary} !important; }
        .um-table-wrap .ct-actions-btn:hover { background: #f3f4f6 !important; color: ${COLORS.textPrimary} !important; }
        .um-table-wrap .ct-actions-btn.delete:hover { background: #fee2e2 !important; color: #ef4444 !important; }
      `}</style>

      <div className="um-page">
        <Grid templateColumns="350px 1fr" gap="16px" alignItems="start">

          {/* ── Left: Register Form ── */}
          <div className="um-card">
            <div className="um-card-head">
              <Text fontSize="13.5px" fontWeight="700" color="#111827">
                {isEditMode ? "Edit User" : "Register User"}
              </Text>
              <Text fontSize="11px" color="#6b7280" mt="2px">
                {isEditMode ? `Editing user ID: ${editId}` : "Create a new user account"}
              </Text>
            </div>
            <div className="um-card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack gap="14px">
                  <div className="um-field-row">
                    <label className="um-field-label">Username *</label>
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
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.username && <span className="um-field-error">{errors.username.message}</span>}
                  </div>

                  {!isEditMode && (
                    <>
                      <div className="um-field-row">
                        <label className="um-field-label">Password *</label>
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
                        {errors.password && <span className="um-field-error">{errors.password.message}</span>}
                      </div>

                      <div className="um-field-row">
                        <label className="um-field-label">Confirm Password *</label>
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
                        {errors.confirmPassword && <span className="um-field-error">{errors.confirmPassword.message}</span>}
                      </div>
                    </>
                  )}

                  {isEditMode && (
                    <>
                      <Text fontSize="11px" fontWeight="700" color={COLORS.textSecondary} letterSpacing="0.05em" textTransform="uppercase" mt="2px">
                        Change Password (optional)
                      </Text>

                      <div className="um-field-row">
                        <label className="um-field-label">Old Password</label>
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
                        {errors.oldPassword && <span className="um-field-error">{errors.oldPassword.message}</span>}
                      </div>

                      <div className="um-field-row">
                        <label className="um-field-label">New Password</label>
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
                        {errors.newPassword && <span className="um-field-error">{errors.newPassword.message}</span>}
                      </div>

                      <div className="um-field-row">
                        <label className="um-field-label">Confirm New Password</label>
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
                        {errors.confirmNewPassword && <span className="um-field-error">{errors.confirmNewPassword.message}</span>}
                      </div>
                    </>
                  )}

                  <div className="um-field-row">
                    <label className="um-field-label">
                        Role *
                    </label>
                    <Controller
                       name="roleId"
                       control={control}
                       render={ ({field})=>(
                            <SelectCombobox
                                value={field.value}
                                onChange={(val)=>field.onChange(val)}
                                editId={editId ? Number(editId) : null}
                                items={roleItems}
                                placeholder="Select Role"

                            />
                       )

                       }

                    />
                    
               
                  </div>

                  <div className="um-field-row">
                    <label className="um-field-label">
                      Active *
                    </label>
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <NativeSelectWrapper
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          items={activeOptions}
                          placeholder="Select Status"
                        />
                      )
                      }
                    />
                    {errors.active && <span className="um-field-error">{errors.active.message}</span>}
                  </div>

                  <div className="um-field-row">
                    <label className="um-field-label">
                      Client *
                    </label>
                    <Controller
                      name="isClient"
                      control={control}
                      render={({ field }) => (
                        <NativeSelectWrapper
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          items={clientOptions}
                          placeholder="Select Client"
                        />
                      )}
                    />
                    {errors.isClient && <span className="um-field-error">{errors.isClient.message}</span>}
                  </div>

                  {isClientSelected && (
                    <div className="um-field-row">
                      <label className="um-field-label">
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
                            placeholder="Select client"
                          />
                        )}
                      />
                      {errors.clientId && <span className="um-field-error">{errors.clientId.message}</span>}
                    </div>
                  )}

                  <HStack w="full" gap="8px">
                    <button type="submit" className="btn-primary" disabled={isPending}
                      tabIndex={4} style={{ flex: 1 }}>
                      <Pencil size={14} />
                      {isPending
                        ? (isEditMode ? "Updating..." : "Registering...")
                        : (isEditMode ? "Update User" : "Register User")}
                    </button>
                    {isEditMode && (
                      <button type="button" className="btn-secondary" onClick={handleCancel} style={{ flex: 1 }}>
                        Cancel
                      </button>
                    )}
                  </HStack>
                </VStack>
              </form>
            </div>
          </div>

          {/* ── Right: Table ── */}
          <div className="um-table-wrap">
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
