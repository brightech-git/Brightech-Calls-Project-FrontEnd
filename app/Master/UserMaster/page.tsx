"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Box, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { UserPlus } from "lucide-react";

import { FormField, FieldConfig } from "@/components/FormField";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import { useRegister, useGetAllUsers } from "@/hooks/Auth/useAuth";
import { AuthResponse, UserRecord } from "@/types/Auth/Auth";

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Minimum 6 characters",
    required: true,
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
    render: (row) => <span>{new Date(row.UPDATED as string).toLocaleDateString()}</span> },
  { key: "UPTIME",   header: "Updated",  sortable: true,
    render: (row) => <span>{new Date(row.UPTIME as string).toLocaleDateString()}</span> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserMasterPage() {
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { mutate: register, isPending } = useRegister();
  const { data: users = [], isLoading, refetch } = useGetAllUsers();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = (data: UserForm) => {
    setApiError("");
    setSuccessMsg("");

    register(data, {
      onSuccess: (res) => {
        setSuccessMsg(`User "${res.username}" registered successfully.`);
        refetch();
        reset();
      },
      onError: (err: any) => {
        setApiError(
          err?.response?.data?.message ||
          err?.message ||
          "Registration failed."
        );
      },
    });
  };

  return (
    <>
      <style>{`
        .um-page {
          background: #f0f6ff;
          min-height: 100vh;
          padding: 24px;
          font-family: 'DM Sans', 'Inter', sans-serif;
        }
        .um-card {
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          box-shadow: 0 1px 6px rgba(59,130,246,0.07);
        }
        .um-card-head {
          padding: 16px 20px 12px;
          border-bottom: 1px solid #dbeafe;
        }
        .um-card-body { padding: 20px; }

        /* override FormField inputs to light theme */
        .um-card input, .um-card textarea, .um-card select {
          background: #f8faff !important;
          border: 1px solid #bfdbfe !important;
          border-radius: 8px !important;
          color: #1e3a5f !important;
          font-size: 13px !important;
        }
        .um-card input::placeholder, .um-card textarea::placeholder {
          color: #93c5fd !important;
        }
        .um-card input:focus, .um-card textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.15) !important;
          outline: none !important;
        }
        /* labels */
        .um-card label, .um-card [class*="Field"] {
          color: #3b82f6 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
        }
        /* error text */
        .um-card [data-invalid] { border-color: #f87171 !important; }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 18px;
          height: 38px;
          border-radius: 8px;
          border: none;
          background: #3b82f6;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
          width: 100%;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(59,130,246,0.25);
        }
        .btn-primary:hover { background: #2563eb; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        /* override CustomTable to light theme */
        .um-table-wrap > div {
          background: #ffffff !important;
          border: 1px solid #dbeafe !important;
          box-shadow: 0 1px 6px rgba(59,130,246,0.07) !important;
        }
        .um-table-wrap .ct-th {
          background: #eff6ff !important;
          color: #3b82f6 !important;
          border-bottom: 1px solid #dbeafe !important;
        }
        .um-table-wrap .ct-td {
          color: #374151 !important;
          border-top: 1px solid #f0f6ff !important;
        }
        .um-table-wrap .ct-td.primary { color: #1e3a5f !important; }
        .um-table-wrap .ct-tr:hover .ct-td { background: #f0f6ff !important; }
        .um-table-wrap .ct-search {
          background: #f8faff !important;
          border: 1px solid #bfdbfe !important;
          color: #1e3a5f !important;
        }
        .um-table-wrap .ct-search::placeholder { color: #93c5fd !important; }
        .um-table-wrap .ct-search:focus { border-color: #3b82f6 !important; }
        .um-table-wrap .ct-size-select {
          background: #f8faff !important;
          border: 1px solid #bfdbfe !important;
          color: #374151 !important;
        }
        .um-table-wrap .ct-page-btn { color: #3b82f6 !important; }
        .um-table-wrap .ct-page-btn.active {
          background: #3b82f6 !important;
          color: #fff !important;
          border-color: #3b82f6 !important;
        }
        .um-table-wrap .ct-actions-btn { color: #3b82f6 !important; }
        .um-table-wrap .ct-actions-btn:hover { background: #dbeafe !important; color: #1d4ed8 !important; }
        .um-table-wrap .ct-actions-btn.delete:hover { background: #fee2e2 !important; color: #ef4444 !important; }
      `}</style>

      <div className="um-page">
        {/* Page header */}
        <HStack justify="space-between" mb="20px" align="center">
          <Box>
            <Text fontSize="18px" fontWeight="700" color="#1e3a5f" letterSpacing="-0.02em">
              User Master
            </Text>
            <Text fontSize="12px" color="#93c5fd" mt="2px">
              Register new users and manage accounts
            </Text>
          </Box>
        </HStack>

        {/* Two-column layout */}
        <Grid templateColumns="300px 1fr" gap="16px" alignItems="start">

          {/* ── Left: Register Form ── */}
          <div className="um-card">
            <div className="um-card-head">
              <Text fontSize="13.5px" fontWeight="700" color="#1e3a5f">
                Register User
              </Text>
              <Text fontSize="11px" color="#93c5fd" mt="2px">
                Create a new user account
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

                  {apiError && (
                    <Text fontSize="12px" color="#ef4444" w="full">{apiError}</Text>
                  )}
                  {successMsg && (
                    <Text fontSize="12px" color="#16a34a" w="full">{successMsg}</Text>
                  )}

                  <button type="submit" className="btn-primary" disabled={isPending}>
                    <UserPlus size={14} />
                    {isPending ? "Registering..." : "Register User"}
                  </button>
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
            />
          </div>
        </Grid>
      </div>
    </>
  );
}
