"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { CustomTable, TableColumn } from "@/components/CustomTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SelectCombobox } from "@/components/ui/SelectComboBox";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { useEnterNavigation } from "@/components/form/useEnterNavigation";
import { COLORS, FONT, RADIUS } from "@/utils/theme";

import {
  useClientServerList,
  useCreateClientServer,
  useUpdateClientServer,
  useDeleteClientServer,
} from "@/hooks/ClientServerMaster/useClientServerMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";

import {
  ClientServerRecord,
  ClientServerRecord_Table,
} from "@/types/ClientServerMaster/ClientServerMaster";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const clientServerSchema = z.object({
  CLIENTID: z.number().min(1, "Client is required for saving"),
  SERVERNAME: z.string().min(1, "Server name is required"),
  IPADDRESS: z.string().min(1, "IP address is required"),
  PASSWORD: z.string().optional(),
  ACTIVE: z.enum(["Y", "N"]),
});

type ClientServerForm = z.infer<typeof clientServerSchema>;

// ─────────────────────────────────────────────
// Static options
// ─────────────────────────────────────────────

const ACTIVE_OPTIONS = [
  { label: "Active", value: "Y" },
  { label: "Inactive", value: "N" },
];

const ACTIVE_FILTER_OPTIONS = [
  { label: "All Status", value: "" },
  ...ACTIVE_OPTIONS,
];

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ClientServerRecord_Table>[] = [
  { key: "sno", header: "ID", sortable: true, width: "60px", align: "center" },
  { key: "clientName", header: "Client Name", sortable: true },
  { key: "serverName", header: "Server Name", sortable: true },
  { key: "ipAddress", header: "IP Address", sortable: true },
  {
    key: "modifiedAt",
    header: "Modified",
    sortable: true,
    render: (row) => (row.modifiedAt ? new Date(row.modifiedAt as string).toLocaleDateString() : "-"),
  },
  {
    key: "active",
    header: "Status",
    sortable: true,
    render: (row) => (
      <span
        style={{
          padding: "2px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: row.active === "Y" ? COLORS.successBg : COLORS.errorBg,
          color: row.active === "Y" ? COLORS.success : COLORS.error,
        }}
      >
        {row.active === "Y" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ClientServerForm = {
  CLIENTID: 0,
  SERVERNAME: "",
  IPADDRESS: "",
  PASSWORD: "",
  ACTIVE: "Y",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ClientServerMasterPage() {
  usePageHeader({
    title: "Client Server Master",
    subtitle: "Manage client server records",
  });

  const toast = useToast();

  const [open, setOpen] = useState(false);

  const [editRow, setEditRow] = useState<ClientServerRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClientServerRecord | null>(null);

  const [filterClientId, setFilterClientId] = useState("");
  const [filterActive, setFilterActive] = useState("");

  const { data: clients = [] } = useClientList();
  const clientItems = clients.map((c) => ({ label: c.CLIENTNAME, value: String(c.CLIENTID) }));

  const { data: serverPage, isLoading } = useClientServerList({
    clientId: filterClientId || undefined,
    active: filterActive || undefined,
  });

  const servers = serverPage?.content ?? [];

  const createMutation = useCreateClientServer();
  const updateMutation = useUpdateClientServer();
  const deleteMutation = useDeleteClientServer();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientServerForm>({
    resolver: zodResolver(clientServerSchema),
    defaultValues: DEFAULTS,
  });

  // Enter-to-next-field navigation for the Add/Edit Client Server form.
  const { register: registerField, focusNext } = useEnterNavigation(
    ["CLIENTID", "SERVERNAME", "IPADDRESS", "PASSWORD", "ACTIVE"],
    () => handleSubmit(onSubmit)()
  );

  // ─────────────────────────

  const openCreate = () => {
    setEditRow(null);
    reset(DEFAULTS);
    setOpen(true);
  };

  const openEdit = (row: ClientServerRecord_Table) => {
    const r = row as ClientServerRecord;

    setEditRow(r);

    reset({
      CLIENTID: r.clientId,
      SERVERNAME: r.serverName ?? "",
      IPADDRESS: r.ipAddress ?? "",
      PASSWORD: r.password ?? "",
      ACTIVE: r.active === "N" ? "N" : "Y",
    });

    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (data: ClientServerForm) => {
    try {

      const payload = {
        clientId : data.CLIENTID ,
        serverName :data.SERVERNAME,
        ipAddress :data.IPADDRESS,
        password : data.PASSWORD ,
        active : data.ACTIVE
      }
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.sno),
          payload: payload,
        });

        toast.success("Client Server Updated", `"${res.serverName}" updated successfully.`);
      } else {
        console.log("payload", payload)
        const res = await createMutation.mutateAsync(payload);
        toast.success("Client Server Created", `"${res.serverName}" created successfully.`);
      }

      setOpen(false);
      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(
        editRow ? "Update Failed" : "Create Failed",
        err?.response?.data?.message || err?.message || "Operation failed."
      );
    }
  };

  // ─────────────────────────

  const confirmDelete = () => {
    if (!deleteRow) return;

    deleteMutation.mutate(String(deleteRow.sno), {
      onSuccess: () => {
        toast.success("Client Server Deleted", `"${deleteRow.serverName}" deleted successfully.`);
        setDeleteRow(null);
      },
      onError: (err: any) => {
        toast.error("Delete Failed", err?.response?.data?.message || "Delete failed.");
        setDeleteRow(null);
      },
    });
  };

  // ─────────────────────────

  return (
    <>
      <style>{`
        .csm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
          padding: 16px;
        }

        .csm-modal-box {
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl};

          width: 100%;
          max-width: 700px;

          font-family: ${FONT.family};

          box-shadow: 0 8px 32px rgba(0,0,0,0.14);

          animation: csm-slide-up 0.18s ease;
        }

        @keyframes csm-slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .csm-modal-head {
          padding: 12px 16px;
          border-bottom: 1px solid ${COLORS.cardBorder};

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: ${COLORS.gray50};
          border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0;
        }

        .csm-modal-title {
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.textPrimary};
        }

        .csm-modal-sub {
          font-size: 11px;
          color: ${COLORS.textMuted};
          margin-top: 2px;
        }

        .csm-modal-body {
          padding: 16px;
        }

        .csm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }

        .csm-field-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .csm-field-label {
          font-size: 12px;
          font-weight: 600;
          color: ${COLORS.textSecondary};
        }

        .csm-field-error {
          font-size: 11px;
          color: ${COLORS.error};
        }

        .csm-modal-footer {
          padding: 12px 16px;
          border-top: 1px solid ${COLORS.cardBorder};

          display: flex;
          justify-content: flex-end;
          gap: 8px;

          background: ${COLORS.gray50};
          border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl};
        }

        .csm-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 0 16px;
          height: 34px;

          border-radius: ${RADIUS.md};
          border: none;

          background: ${COLORS.btnPrimaryBg};
          color: ${COLORS.btnPrimaryText};

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;
        }

        .csm-btn-primary:hover {
          background: ${COLORS.btnPrimaryHover};
        }

        .csm-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .csm-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 0 16px;
          height: 34px;

          border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.btnSecondaryBorder};

          background: ${COLORS.btnSecondaryBg};
          color: ${COLORS.btnSecondaryText};

          font-size: 12px;
          font-weight: 500;

          cursor: pointer;
        }

        .csm-close-btn {
          width: 26px;
          height: 26px;

          border-radius: 6px;
          border: 1px solid ${COLORS.cardBorder};

          background: ${COLORS.cardBg};

          cursor: pointer;
        }

        .csm-filters {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      {/* Table */}

      <CustomTable
        title="All Client Servers"
        columns={COLUMNS}
        data={servers as ClientServerRecord_Table[]}
        rowKey="sno"
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteRow(row as ClientServerRecord)}
        searchPlaceholder="Search server..."
        emptyMessage="No client servers found."
        toolbarRight={
          <div className="csm-filters">
            <SelectCombobox
              value={filterClientId || undefined}
              onChange={(val) => setFilterClientId(val ?? "")}
              items={[{ label: "All Clients", value: "" }, ...clientItems]}
              placeholder="Filter by client"
              maxWidth="180px"
            />

            <NativeSelectWrapper
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              items={ACTIVE_FILTER_OPTIONS}
              placeholder="Filter by status"
              maxWidth="140px"
            />

            <button className="csm-btn-primary" onClick={openCreate}>
              <Plus size={13} />
              Add Client Server
            </button>
          </div>
        }
      />

      {/* Modal */}

      {open && (
        <div
          className="csm-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="csm-modal-box">
            <div className="csm-modal-head">
              <div>
                <div className="csm-modal-title">
                  {editRow ? "Edit Client Server" : "Add Client Server"}
                </div>

                <div className="csm-modal-sub">
                  {editRow ? `Editing: ${editRow.serverName}` : "Fill client server details"}
                </div>
              </div>

              <button className="csm-close-btn" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="csm-modal-body">
                <div className="csm-grid">
                  <div className="csm-field-row">
                    <label className="csm-field-label">Client *</label>
                    <Controller
                      name="CLIENTID"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox
                          ref={registerField("CLIENTID")}
                          value={field.value ? String(field.value) : undefined}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          onEnter={() => focusNext("CLIENTID")}
                          editId={editRow?.sno ?? null}
                          items={clientItems}
                          placeholder="Select client"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.CLIENTID && <span className="csm-field-error">{errors.CLIENTID.message}</span>}
                  </div>

                  <div className="csm-field-row">
                    <label className="csm-field-label">Server Name *</label>
                    <Controller
                      name="SERVERNAME"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          inputRef={registerField("SERVERNAME")}
                          value={field.value}
                          field="SERVERNAME"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          onEnter={() => focusNext("SERVERNAME")}
                          placeholder="Enter server name"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.SERVERNAME && <span className="csm-field-error">{errors.SERVERNAME.message}</span>}
                  </div>

                  <div className="csm-field-row">
                    <label className="csm-field-label">IP Address *</label>
                    <Controller
                      name="IPADDRESS"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          inputRef={registerField("IPADDRESS")}
                          value={field.value}
                          field="IPADDRESS"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          onEnter={() => focusNext("IPADDRESS")}
                          placeholder="Enter IP address"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.IPADDRESS && <span className="csm-field-error">{errors.IPADDRESS.message}</span>}
                  </div>

                  <div className="csm-field-row">
                    <label className="csm-field-label">Password</label>
                    <Controller
                      name="PASSWORD"
                      control={control}
                      render={({ field }) => (
                        <CapitalizedInput
                          inputRef={registerField("PASSWORD")}
                          value={field.value}
                          field="PASSWORD"
                          isCapitalized
                          onChange={(_, value) => field.onChange(value)}
                          onEnter={() => focusNext("PASSWORD")}
                          placeholder="Enter password"
                          maxWidth="100%"
                        />
                      )}
                    />
                    {errors.PASSWORD && <span className="csm-field-error">{errors.PASSWORD.message}</span>}
                  </div>

                  <div className="csm-field-row">
                    <label className="csm-field-label">Status *</label>
                    <Controller
                      name="ACTIVE"
                      control={control}
                      render={({ field }) => (
                        <NativeSelectWrapper
                          ref={registerField("ACTIVE")}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          onEnter={() => focusNext("ACTIVE")}
                          items={ACTIVE_OPTIONS}
                          placeholder="Select Status"
                          maxWidth="100%"
                          css={{
                            border: "1px solid #DDD",
                            bg: "#EEE",
                            color: "#222",
                          }}
                        />
                      )}
                    />
                    {errors.ACTIVE && <span className="csm-field-error">{errors.ACTIVE.message}</span>}
                  </div>
                </div>
              </div>

              <div className="csm-modal-footer">
                <button type="button" className="csm-btn-secondary" onClick={() => setOpen(false)}>
                  Cancel
                </button>

                <button type="submit" className="csm-btn-primary" disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Client Server" : "Create Client Server"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}

      <ConfirmDialog
        open={!!deleteRow}
        message={`Are you sure you want to delete "${deleteRow?.serverName}"?`}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </>
  );
}
