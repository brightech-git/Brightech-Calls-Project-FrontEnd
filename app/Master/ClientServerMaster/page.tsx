"use client";

import { ui } from "@/utils/ui";
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
import { useClientServerList, useCreateClientServer, useUpdateClientServer, useDeleteClientServer } from "@/hooks/ClientServerMaster/useClientServerMaster";
import { useClientList } from "@/hooks/ClientMaster/useClientMaster";
import { ClientServerRecord, ClientServerRecord_Table } from "@/types/ClientServerMaster/ClientServerMaster";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const clientServerSchema = z.object({
  CLIENTID: z.number().min(1, "Client is required for saving"),
  SERVERNAME: z.string().min(1, "Server name is required"),
  IPADDRESS: z.string().min(1, "IP address is required"),
  PASSWORD: z.string().optional(),
  ACTIVE: z.enum(["Y", "N"])
});
type ClientServerForm = z.infer<typeof clientServerSchema>;

// ─────────────────────────────────────────────
// Static options
// ─────────────────────────────────────────────

const ACTIVE_OPTIONS = [{
  label: "Active",
  value: "Y"
}, {
  label: "Inactive",
  value: "N"
}];
const ACTIVE_FILTER_OPTIONS = [{
  label: "All Status",
  value: ""
}, ...ACTIVE_OPTIONS];

// ─────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<ClientServerRecord_Table>[] = [{
  key: "sno",
  header: "ID",
  sortable: true,
  width: "60px",
  align: "center"
}, {
  key: "clientName",
  header: "Client Name",
  sortable: true
}, {
  key: "serverName",
  header: "Server Name",
  sortable: true
}, {
  key: "ipAddress",
  header: "IP Address",
  sortable: true
}, {
  key: "modifiedAt",
  header: "Modified",
  sortable: true,
  render: row => row.modifiedAt ? new Date(row.modifiedAt as string).toLocaleDateString() : "-"
}, {
  key: "active",
  header: "Status",
  sortable: true,
  render: row => <span style={{
    background: row.active === "Y" ? COLORS.successBg : COLORS.errorBg,
    color: row.active === "Y" ? COLORS.success : COLORS.error
  }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:11px] [font-weight:600]")}>
        {row.active === "Y" ? "Active" : "Inactive"}
      </span>
}];

// ─────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────

const DEFAULTS: ClientServerForm = {
  CLIENTID: 0,
  SERVERNAME: "",
  IPADDRESS: "",
  PASSWORD: "",
  ACTIVE: "Y"
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function ClientServerMasterPage() {
  usePageHeader({
    title: "Client Server Master",
    subtitle: "Manage client server records"
  });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<ClientServerRecord | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClientServerRecord | null>(null);
  const [filterClientId, setFilterClientId] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const {
    data: clients = []
  } = useClientList();
  const clientItems = clients.map(c => ({
    label: c.CLIENTNAME,
    value: String(c.CLIENTID)
  }));
  const {
    data: serverPage,
    isLoading
  } = useClientServerList({
    clientId: filterClientId || undefined,
    active: filterActive || undefined
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
    formState: {
      errors
    }
  } = useForm<ClientServerForm>({
    resolver: zodResolver(clientServerSchema),
    defaultValues: DEFAULTS
  });

  // Enter-to-next-field navigation for the Add/Edit Client Server form.
  const {
    register: registerField,
    focusNext
  } = useEnterNavigation(["CLIENTID", "SERVERNAME", "IPADDRESS", "PASSWORD", "ACTIVE"], () => handleSubmit(onSubmit)());

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
      ACTIVE: r.active === "N" ? "N" : "Y"
    });
    setOpen(true);
  };

  // ─────────────────────────

  const onSubmit = async (data: ClientServerForm) => {
    try {
      const payload = {
        clientId: data.CLIENTID,
        serverName: data.SERVERNAME,
        ipAddress: data.IPADDRESS,
        password: data.PASSWORD,
        active: data.ACTIVE
      };
      if (editRow) {
        const res = await updateMutation.mutateAsync({
          id: String(editRow.sno),
          payload: payload
        });
        toast.success("Client Server Updated", `"${res.serverName}" updated successfully.`);
      } else {
        console.log("payload", payload);
        const res = await createMutation.mutateAsync(payload);
        toast.success("Client Server Created", `"${res.serverName}" created successfully.`);
      }
      setOpen(false);
      reset(DEFAULTS);
    } catch (err: any) {
      toast.error(editRow ? "Update Failed" : "Create Failed", err?.response?.data?.message || err?.message || "Operation failed.");
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
      }
    });
  };

  // ─────────────────────────

  return <>
      

      {/* Table */}

      <CustomTable title="All Client Servers" columns={COLUMNS} data={servers as ClientServerRecord_Table[]} rowKey="sno" isLoading={isLoading} onEdit={openEdit} onDelete={row => setDeleteRow(row as ClientServerRecord)} searchPlaceholder="Search server..." emptyMessage="No client servers found." toolbarRight={<div className={ui("csm-filters")}>
            <SelectCombobox value={filterClientId || undefined} onChange={val => setFilterClientId(val ?? "")} items={[{
        label: "All Clients",
        value: ""
      }, ...clientItems]} placeholder="Filter by client" className={ui("[max-width:180px]!")} />

            <NativeSelectWrapper value={filterActive} onChange={e => setFilterActive(e.target.value)} items={ACTIVE_FILTER_OPTIONS} placeholder="Filter by status" className={ui("[max-width:140px]!")} />

            <button className={ui("csm-btn-primary")} onClick={openCreate}>
              <Plus size={13} />
              Add Client Server
            </button>
          </div>} />

      {/* Modal */}

      {open && <div className={ui("csm-modal-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className={ui("csm-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Client server details">
            <div className={ui("csm-modal-head")}>
              <div>
                <div className={ui("csm-modal-title")}>
                  {editRow ? "Edit Client Server" : "Add Client Server"}
                </div>

                <div className={ui("csm-modal-sub")}>
                  {editRow ? `Editing: ${editRow.serverName}` : "Fill client server details"}
                </div>
              </div>

              <button className={ui("csm-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={ui("csm-modal-body")}>
                <div className={ui("csm-grid workspace-form-grid")}>
                  <div className={ui("csm-field-row")}>
                    <label className={ui("csm-field-label")}>Client *</label>
                    <Controller name="CLIENTID" control={control} render={({
                  field
                }) => <SelectCombobox ref={registerField("CLIENTID")} value={field.value ? String(field.value) : undefined} onChange={val => field.onChange(val ? Number(val) : 0)} onEnter={() => focusNext("CLIENTID")} editId={editRow?.sno ?? null} items={clientItems} placeholder="Select client" className={ui("[max-width:100%]!")} />} />
                    {errors.CLIENTID && <span className={ui("csm-field-error")}>{errors.CLIENTID.message}</span>}
                  </div>

                  <div className={ui("csm-field-row")}>
                    <label className={ui("csm-field-label")}>Server Name *</label>
                    <Controller name="SERVERNAME" control={control} render={({
                  field
                }) => <CapitalizedInput inputRef={registerField("SERVERNAME")} value={field.value} field="SERVERNAME" isCapitalized onChange={(_, value) => field.onChange(value)} onEnter={() => focusNext("SERVERNAME")} placeholder="Enter server name" className={ui("[max-width:100%]!")} />} />
                    {errors.SERVERNAME && <span className={ui("csm-field-error")}>{errors.SERVERNAME.message}</span>}
                  </div>

                  <div className={ui("csm-field-row")}>
                    <label className={ui("csm-field-label")}>IP Address *</label>
                    <Controller name="IPADDRESS" control={control} render={({
                  field
                }) => <CapitalizedInput inputRef={registerField("IPADDRESS")} value={field.value} field="IPADDRESS" isCapitalized onChange={(_, value) => field.onChange(value)} onEnter={() => focusNext("IPADDRESS")} placeholder="Enter IP address" className={ui("[max-width:100%]!")} />} />
                    {errors.IPADDRESS && <span className={ui("csm-field-error")}>{errors.IPADDRESS.message}</span>}
                  </div>

                  <div className={ui("csm-field-row")}>
                    <label className={ui("csm-field-label")}>Password</label>
                    <Controller name="PASSWORD" control={control} render={({
                  field
                }) => <CapitalizedInput inputRef={registerField("PASSWORD")} value={field.value} field="PASSWORD" isCapitalized onChange={(_, value) => field.onChange(value)} onEnter={() => focusNext("PASSWORD")} placeholder="Enter password" className={ui("[max-width:100%]!")} />} />
                    {errors.PASSWORD && <span className={ui("csm-field-error")}>{errors.PASSWORD.message}</span>}
                  </div>

                  <div className={ui("csm-field-row")}>
                    <label className={ui("csm-field-label")}>Status *</label>
                    <Controller name="ACTIVE" control={control} render={({
                  field
                }) => <NativeSelectWrapper ref={registerField("ACTIVE")} value={field.value} onChange={e => field.onChange(e.target.value)} onEnter={() => focusNext("ACTIVE")} items={ACTIVE_OPTIONS} placeholder="Select Status" css={{
                  border: "1px solid #DDD",
                  bg: "#EEE",
                  color: "#222"
                }} className={ui("[max-width:100%]!")} />} />
                    {errors.ACTIVE && <span className={ui("csm-field-error")}>{errors.ACTIVE.message}</span>}
                  </div>
                </div>
              </div>

              <div className={ui("csm-modal-footer")}>
                <button type="button" className={ui("csm-btn-secondary")} onClick={() => setOpen(false)}>
                  Cancel
                </button>

                <button type="submit" className={ui("csm-btn-primary")} disabled={isPending}>
                  <Pencil size={12} />
                  {isPending ? "Saving..." : editRow ? "Update Client Server" : "Create Client Server"}
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirm */}

      <ConfirmDialog open={!!deleteRow} message={`Are you sure you want to delete "${deleteRow?.serverName}"?`} isPending={deleteMutation.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteRow(null)} />
    </>;
}
