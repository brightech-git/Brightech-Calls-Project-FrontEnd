"use client";

import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { Pencil, UserPlus } from "lucide-react";

import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SelectCombobox, SelectItem } from "@/components/ui/SelectComboBox";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import { useRegister, useGetAllUsers, useUpdateUser, useDeleteUser } from "@/hooks/Auth/useAuth";
import { UserRecord, RegisterPayload, UpdateUserPayload } from "@/types/Auth/Auth";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, FONT } from "@/utils/theme";
import { axiosInstance } from "@/api/axiosInstance";

// ─── Fetch roles from API ──────────────────────────────────────────────────────

interface RoleMasterRecord {
  ROLEID: number;
  ROLENAME: string;
  ACTIVE: string;
}

const fetchRoles = async (): Promise<RoleMasterRecord[]> => {
  const res = await axiosInstance.get<{ data: RoleMasterRecord[] }>("/rolemaster");
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = z.object({
  username: z.string().min(3, "Username min 3 chars"),
  password: z.string().min(5, "Password min 5 chars"),
  confirmPassword: z.string(),
  roleId: z.number({ required_error: "Role is required" }).min(1, "Role is required"),
  staffName: z.string().min(1, "Staff Name is required"),
  mobileNo: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const editSchema = z.object({
  username: z.string().min(3, "Username min 3 chars"),
  password: z.string().min(5, "Password min 5 chars").or(z.literal("")),
  confirmPassword: z.string(),
  roleId: z.number({ required_error: "Role is required" }).min(1, "Role is required"),
  staffName: z.string().min(1, "Staff Name is required"),
  mobileNo: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  active: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserForm = z.infer<typeof userSchema>;

const EMPTY_FORM: UserForm = {
  username: "", password: "", confirmPassword: "",
  roleId: 0, staffName: "", mobileNo: "", address1: "", address2: "", address3: "",
};

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<UserRecord & Record<string, unknown>>[] = [
  { key: "USERID",    header: "#",          align: "center", width: "50px" },
  { key: "USERNAME",  header: "Username",   sortable: true },
  { key: "STAFFNAME", header: "Staff Name", sortable: true,
    render: (row) => <span>{row.STAFFNAME || "—"}</span>,
  },
  { key: "ROLEID",    header: "Role",       sortable: true,
    render: (row) => {
      const id = row.ROLEID as number;
      const label = id === 1 ? "Client" : id === 2 ? "Admin" : `Staff`;
      return (
        <span style={{
          padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: id === 2 ? "#dbeafe" : id === 1 ? "#fef9c3" : "#e0e7ff",
          color:      id === 2 ? "#2563eb" : id === 1 ? "#a16207" : "#4338ca",
        }}>
          {label}
        </span>
      );
    },
  },
  { key: "MOBILENO",  header: "Mobile",     sortable: true,
    render: (row) => <span>{row.MOBILENO || "—"}</span>,
  },
  { key: "ACTIVE",    header: "Status",     sortable: true,
    render: (row) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: row.ACTIVE === "Y" ? "#dcfce7" : "#fee2e2",
        color:      row.ACTIVE === "Y" ? "#16a34a" : "#ef4444",
      }}>
        {row.ACTIVE === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
  { key: "CREATEDAT", header: "Created", sortable: true,
    render: (row) => {
      const v = row.CREATEDAT;
      if (!v) return <span>—</span>;
      const d = new Date(v as string);
      return <span>{isNaN(d.getTime()) ? "—" : d.toLocaleDateString()}</span>;
    },
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserMasterPage() {
  const toast = useToast();

  const [editId, setEditId]       = useState<string | null>(null);
  const [editRow, setEditRow]     = useState<UserRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<UserRecord | null>(null);
  const [roles, setRoles]         = useState<SelectItem[]>([]);

  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: updateUser, isPending: isUpdating }   = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting }   = useDeleteUser();
  const { data: users = [], isLoading, refetch }        = useGetAllUsers();

  const isEditMode = editId !== null;

  usePageHeader({ title: "User Master", subtitle: "Register and manage user accounts" });

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles()
      .then((data) => {
        const items: SelectItem[] = data
          .filter((r) => r.ACTIVE === "Y")
          .map((r) => ({ label: r.ROLENAME, value: String(r.ROLEID) }));
        setRoles(items);
      })
      .catch(() => {
        // Fallback static roles
        setRoles([
          { label: "Client", value: "1" },
          { label: "Admin",  value: "2" },
          { label: "Staff",  value: "3" },
        ]);
      });
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(isEditMode ? editSchema : userSchema),
    defaultValues: EMPTY_FORM,
  });

  const isPending = isRegistering || isUpdating;

  const handleEdit = (row: UserRecord & Record<string, unknown>) => {
    setEditId(String(row.USERID));
    setEditRow(row as UserRecord);
    reset({
      username:        row.USERNAME ?? "",
      password:        "",
      confirmPassword: "",
      roleId:          row.ROLEID ?? 0,
      staffName:       row.STAFFNAME ?? "",
      mobileNo:        row.MOBILENO ?? "",
      address1:        row.ADDRESS1 ?? "",
      address2:        row.ADDRESS2 ?? "",
      address3:        row.ADDRESS3 ?? "",
    });
  };

  const handleDelete = (row: UserRecord & Record<string, unknown>) => {
    setDeleteRow(row as UserRecord);
  };

  const confirmDelete = () => {
    if (!deleteRow) return;
    deleteUser(String(deleteRow.USERID), {
      onSuccess: () => {
        toast.success("User Deleted", `"${deleteRow.USERNAME}" deleted.`);
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
    reset(EMPTY_FORM);
  };

  const onSubmit = (data: UserForm) => {
    if (isEditMode) {
      const updatePayload: UpdateUserPayload = {
        username:  data.username,
        password:  data.password || undefined,
        roleId:    data.roleId,
        staffName: data.staffName,
        mobileNo:  data.mobileNo,
        address1:  data.address1,
        address2:  data.address2,
        address3:  data.address3,
        active:    editRow?.ACTIVE ?? "Y",
      };
      updateUser({ id: editId!, payload: updatePayload }, {
        onSuccess: () => {
          toast.success("User Updated", `"${data.username}" updated.`);
          refetch();
          handleCancel();
        },
        onError: (err: any) => {
          toast.error("Update Failed", err?.response?.data?.message || "Update failed.");
        },
      });
    } else {
      const registerPayload: RegisterPayload = {
        username:  data.username,
        password:  data.password,
        roleId:    data.roleId,
        staffName: data.staffName,
        mobileNo:  data.mobileNo,
        address1:  data.address1,
        address2:  data.address2,
        address3:  data.address3,
      };
      register(registerPayload, {
        onSuccess: (res) => {
          toast.success("User Registered", `"${res.username}" registered.`);
          refetch();
          reset(EMPTY_FORM);
        },
        onError: (err: any) => {
          toast.error("Registration Failed", err?.response?.data?.message || "Registration failed.");
        },
      });
    }
  };

  return (
    <>
      <style>{`
        .um-page { background: transparent; min-height: 100%; font-family: ${FONT.family}; }
        .um-card {
          background: #ffffff; border: 1px solid #e5e7eb;
          border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .um-card-head { padding: 16px 20px 12px; border-bottom: 1px solid #e5e7eb; }
        .um-card-body { padding: 20px; }

        .um-card input, .um-card textarea, .um-card select {
          background: #ffffff !important; border: 1px solid #d1d5db !important;
          border-radius: 8px !important; color: ${COLORS.textPrimary} !important; font-size: 13px !important;
        }
        .um-card input::placeholder, .um-card textarea::placeholder { color: ${COLORS.textMuted} !important; }
        .um-card input:focus, .um-card textarea:focus {
          border-color: ${COLORS.textSecondary} !important;
          box-shadow: 0 0 0 2px rgba(107,114,128,0.15) !important; outline: none !important;
        }
        .um-card label, .um-card [class*="Field"] {
          color: ${COLORS.textSecondary} !important; font-size: 11px !important;
          font-weight: 700 !important; letter-spacing: 0.05em !important; text-transform: uppercase !important;
        }
        .um-card [data-invalid] { border-color: #f87171 !important; }

        .um-field-row { display: flex; flex-direction: column; gap: 4px; width: 100%; }
        .um-field-label {
          color: ${COLORS.textSecondary}; font-size: 11px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .um-field-error { font-size: 11px; color: #ef4444; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 18px; height: 38px; border-radius: 8px; border: none;
          background: ${COLORS.primary}; color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s; font-family: inherit;
          width: 100%; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .btn-primary:hover { background: ${COLORS.primaryHover}; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 18px; height: 38px; border-radius: 8px;
          border: 1px solid #d1d5db; background: #ffffff;
          color: ${COLORS.textSecondary}; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s; font-family: inherit; justify-content: center;
        }
        .btn-secondary:hover { background: #f3f4f6; }

        .um-table-wrap > div {
          background: #ffffff !important; border: 1px solid #e5e7eb !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
        }
        .um-table-wrap .ct-th {
          background: #f9fafb !important; color: ${COLORS.textSecondary} !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .um-table-wrap .ct-td { color: ${COLORS.textSecondary} !important; border-top: 1px solid #f3f4f6 !important; }
        .um-table-wrap .ct-td.primary { color: ${COLORS.textPrimary} !important; }
        .um-table-wrap .ct-tr:hover .ct-td { background: #f9fafb !important; }
        .um-table-wrap .ct-search {
          background: #ffffff !important; border: 1px solid #d1d5db !important; color: ${COLORS.textPrimary} !important;
        }
        .um-table-wrap .ct-search::placeholder { color: ${COLORS.textMuted} !important; }
        .um-table-wrap .ct-search:focus { border-color: ${COLORS.textSecondary} !important; }
        .um-table-wrap .ct-size-select {
          background: #ffffff !important; border: 1px solid #d1d5db !important; color: ${COLORS.textSecondary} !important;
        }
        .um-table-wrap .ct-page-btn { color: ${COLORS.textSecondary} !important; }
        .um-table-wrap .ct-page-btn.active {
          background: ${COLORS.primary} !important; color: #fff !important; border-color: ${COLORS.primary} !important;
        }
        .um-table-wrap .ct-actions-btn { color: ${COLORS.textSecondary} !important; }
        .um-table-wrap .ct-actions-btn:hover { background: #f3f4f6 !important; color: ${COLORS.textPrimary} !important; }
        .um-table-wrap .ct-actions-btn.delete:hover { background: #fee2e2 !important; color: #ef4444 !important; }
      `}</style>

      <div className="um-page">
        <Grid templateColumns="380px 1fr" gap="16px" alignItems="start">

          {/* ── Left: Register / Edit Form ── */}
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
                <VStack gap="12px">

                  {/* Username */}
                  <div className="um-field-row">
                    <label className="um-field-label">Username *</label>
                    <Controller name="username" control={control}
                      render={({ field }) => (
                        <CapitalizedInput value={field.value} field="username"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter username" isCapitalized maxWidth="100%" />
                      )} />
                    {errors.username && <span className="um-field-error">{errors.username.message}</span>}
                  </div>

                  {/* Staff Name */}
                  <div className="um-field-row">
                    <label className="um-field-label">Staff Name *</label>
                    <Controller name="staffName" control={control}
                      render={({ field }) => (
                        <CapitalizedInput value={field.value ?? ""} field="staffName"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter full name" isCapitalized maxWidth="100%" />
                      )} />
                    {errors.staffName && <span className="um-field-error">{errors.staffName.message}</span>}
                  </div>

                  {/* Role */}
                  <div className="um-field-row">
                    <label className="um-field-label">Role *</label>
                    <Controller name="roleId" control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          value={field.value ? String(field.value) : ""}
                          onChange={(val) => field.onChange(Number(val))}
                          items={roles}
                          placeholder="Select role"
                          rounded="md"
                          maxWidth="100%"
                        />
                      )} />
                    {errors.roleId && <span className="um-field-error">{errors.roleId.message}</span>}
                  </div>

                  {/* Mobile */}
                  <div className="um-field-row">
                    <label className="um-field-label">Mobile No</label>
                    <Controller name="mobileNo" control={control}
                      render={({ field }) => (
                        <input
                          className="login-input"
                          style={{ width: "100%", height: 36, borderRadius: 8, padding: "0 10px",
                            border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit",
                            background: "#fff", color: COLORS.textPrimary, outline: "none" }}
                          type="text" value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Enter mobile number"
                        />
                      )} />
                  </div>

                  {/* Address 1 */}
                  <div className="um-field-row">
                    <label className="um-field-label">Address 1</label>
                    <Controller name="address1" control={control}
                      render={({ field }) => (
                        <input
                          style={{ width: "100%", height: 36, borderRadius: 8, padding: "0 10px",
                            border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit",
                            background: "#fff", color: COLORS.textPrimary, outline: "none" }}
                          type="text" value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Address line 1"
                        />
                      )} />
                  </div>

                  {/* Address 2 */}
                  <div className="um-field-row">
                    <label className="um-field-label">Address 2</label>
                    <Controller name="address2" control={control}
                      render={({ field }) => (
                        <input
                          style={{ width: "100%", height: 36, borderRadius: 8, padding: "0 10px",
                            border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit",
                            background: "#fff", color: COLORS.textPrimary, outline: "none" }}
                          type="text" value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Address line 2"
                        />
                      )} />
                  </div>

                  {/* Address 3 */}
                  <div className="um-field-row">
                    <label className="um-field-label">Address 3</label>
                    <Controller name="address3" control={control}
                      render={({ field }) => (
                        <input
                          style={{ width: "100%", height: 36, borderRadius: 8, padding: "0 10px",
                            border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit",
                            background: "#fff", color: COLORS.textPrimary, outline: "none" }}
                          type="text" value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Address line 3"
                        />
                      )} />
                  </div>

                  {/* Password */}
                  <div className="um-field-row">
                    <label className="um-field-label">
                      Password {isEditMode ? "(leave blank to keep)" : "*"}
                    </label>
                    <Controller name="password" control={control}
                      render={({ field }) => (
                        <PasswordInput value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Min 5 characters" />
                      )} />
                    {errors.password && <span className="um-field-error">{errors.password.message}</span>}
                  </div>

                  {/* Confirm Password */}
                  <div className="um-field-row">
                    <label className="um-field-label">Confirm Password {isEditMode ? "" : "*"}</label>
                    <Controller name="confirmPassword" control={control}
                      render={({ field }) => (
                        <PasswordInput value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Re-enter password" />
                      )} />
                    {errors.confirmPassword && <span className="um-field-error">{errors.confirmPassword.message}</span>}
                  </div>

                  {/* Buttons */}
                  <HStack w="full" gap="8px" pt="4px">
                    <button type="submit" className="btn-primary" disabled={isPending} style={{ flex: 1 }}>
                      {isEditMode ? <Pencil size={14} /> : <UserPlus size={14} />}
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
              data={users as (UserRecord & Record<string, unknown>)[]}
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
