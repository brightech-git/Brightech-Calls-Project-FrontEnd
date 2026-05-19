"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Box, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { Pencil } from "lucide-react";

import { FormField, FieldConfig } from "@/components/FormField";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import { useRegister, useGetAllUsers, useUpdateUser, useDeleteUser } from "@/hooks/Auth/useAuth";
import { UserRecord, UpdateUserPayload } from "@/types/Auth/Auth";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const editSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(5, "Password must be at least 5 characters").or(z.literal("")),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserForm = z.infer<typeof userSchema>;

// ─── Field config ─────────────────────────────────────────────────────────────

const FIELDS: FieldConfig<UserForm>[] = [
  {
    name: "username",
    label: "Username",
    type: "text",
    placeholder: "Enter username",
    required: true,
    inline: true,
    labelWidth: "120px",
    capitalize: true,
    tabIndex: 1,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Min 5 characters",
    required: true,
    inline: true,
    labelWidth: "120px",
    tabIndex: 2,
  },
  {
    name: "confirmPassword",
    label: "Confirm Pwd",
    type: "password",
    placeholder: "Re-enter password",
    required: true,
    inline: true,
    labelWidth: "120px",
    tabIndex: 3,
  },
];

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS: TableColumn<UserRecord & Record<string, unknown>>[] = [
  { key: "USERID",   header: "#",        align: "center", width: "50px" },
  { key: "USERNAME", header: "Username", sortable: true },
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

  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: updateUser, isPending: isUpdating }  = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting }  = useDeleteUser();
  const { data: users = [], isLoading, refetch }       = useGetAllUsers();

  const isEditMode = editId !== null;

  usePageHeader({ title: "User Master", subtitle: "Register and manage user accounts" });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(isEditMode ? editSchema : userSchema),
  });

  const isPending = isRegistering || isUpdating;

  const handleEdit = (row: UserRecord & Record<string, unknown>) => {
    setEditId(row.USERID as string);
    setEditRow(row as UserRecord);
    reset({ username: row.USERNAME as string, password: "", confirmPassword: "" });
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
    reset({ username: "", password: "", confirmPassword: "" });
  };

  const onSubmit = (data: UserForm) => {
    const { confirmPassword: _, ...payload } = data;

    if (isEditMode) {
      const updatePayload = {
        username: payload.username,
        password: payload.password || editRow?.PWD || "",
        active:   editRow?.ACTIVE ?? "Y",
      };
      console.log("[UserMaster] UPDATE payload:", updatePayload);
      updateUser({ id: editId!, payload: updatePayload }, {
        onSuccess: (res) => {
          console.log("[UserMaster] UPDATE response:", res);
          toast.success("User Updated", `"${payload.username}" updated successfully.`);
          refetch();
          handleCancel();
        },
        onError: (err: any) => {
          console.error("[UserMaster] UPDATE error:", err?.response ?? err);
          toast.error("Update Failed", err?.response?.data?.message || "Update failed.");
        },
      });
    } else {
      register(payload, {
        onSuccess: (res) => {
          toast.success("User Registered", `"${res.username}" registered successfully.`);
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
          font-family: 'DM Sans', 'Inter', sans-serif;
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
          color: #111827 !important;
          font-size: 13px !important;
        }
        .um-card input::placeholder, .um-card textarea::placeholder {
          color: #9ca3af !important;
        }
        .um-card input:focus, .um-card textarea:focus {
          border-color: #6b7280 !important;
          box-shadow: 0 0 0 2px rgba(107,114,128,0.15) !important;
          outline: none !important;
        }
        .um-card label, .um-card [class*="Field"] {
          color: #374151 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
        }
        .um-card [data-invalid] { border-color: #f87171 !important; }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 18px;
          height: 38px;
          border-radius: 8px;
          border: none;
          background: #111827;
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
        .btn-primary:hover { background: #1f2937; }
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
          color: #374151;
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
          color: #374151 !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .um-table-wrap .ct-td {
          color: #374151 !important;
          border-top: 1px solid #f3f4f6 !important;
        }
        .um-table-wrap .ct-td.primary { color: #111827 !important; }
        .um-table-wrap .ct-tr:hover .ct-td { background: #f9fafb !important; }
        .um-table-wrap .ct-search {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: #111827 !important;
        }
        .um-table-wrap .ct-search::placeholder { color: #9ca3af !important; }
        .um-table-wrap .ct-search:focus { border-color: #6b7280 !important; }
        .um-table-wrap .ct-size-select {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: #374151 !important;
        }
        .um-table-wrap .ct-page-btn { color: #374151 !important; }
        .um-table-wrap .ct-page-btn.active {
          background: #111827 !important;
          color: #fff !important;
          border-color: #111827 !important;
        }
        .um-table-wrap .ct-actions-btn { color: #374151 !important; }
        .um-table-wrap .ct-actions-btn:hover { background: #f3f4f6 !important; color: #111827 !important; }
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
                  {FIELDS.map((f) => (
                    <Box key={f.name} w="full">
                      <FormField field={f} control={control} errors={errors} />
                    </Box>
                  ))}

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
