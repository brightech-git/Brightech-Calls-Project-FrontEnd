"use client";

import { ui } from "@/utils/ui";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { List, Plus, Pencil, ChevronRightCircle } from "lucide-react";
import { CustomTable, TableColumn } from "@/components/CustomTable";
import { TextareaField } from "@/components/ui/CapitalizesTextArea";
import { MediaManager, MediaItem, revokeMediaItems } from "@/components/ui/MediaManager";
import { MediaLightbox, LightboxItem } from "@/components/ui/MediaLightbox";
import { usePageHeader } from "@/context/PageHeaderContext";
import { useToast } from "@/components/Toast";
import { COLORS, RADIUS, FONT } from "@/utils/theme";
import { useActiveBookingsWithLastStatus, useCallStatusTicketDetail, useCreateCallStatus } from "@/hooks/CallStatus/useCallStatus";
import { CallStatusListItem_Table, CallStatusRecord } from "@/types/CallStatus/CallStatus";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";

// ─────────────────────────────────────────────
// Schema — Add Status form
// ─────────────────────────────────────────────

const statusSchema = z.object({
  STATUS: z.string().min(1, "Status is required"),
  remark: z.string().optional()
});
type StatusForm = z.infer<typeof statusSchema>;
const DEFAULTS: StatusForm = {
  STATUS: "OPEN",
  remark: ""
};
const STATUS_ITEMS = [{
  label: "Open",
  value: "OPEN"
}, {
  label: "Process",
  value: "PROCESS"
}, {
  label: "Closed",
  value: "CLOSED"
}];
const statusBadge = (label?: string | null) => {
  const s = label ?? "—";
  const bg = s === "CLOSED" ? COLORS.errorBg : s === "PROCESS" ? COLORS.warningBg : COLORS.successBg;
  const color = s === "CLOSED" ? COLORS.error : s === "PROCESS" ? COLORS.warning : COLORS.success;
  return <span style={{
    background: bg,
    color
  }} className={ui("[padding:2px_10px] [border-radius:20px] [font-size:var(--font-xs)] [font-weight:600]")}>
      {s}
    </span>;
};

// ─────────────────────────────────────────────
// Columns — list view (active bookings only)
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallStatusListItem_Table>[] = [{
  key: "tktId",
  header: "Ticket ID",
  sortable: true,
  width: "90px"
}, {
  key: "clientName",
  header: "Client",
  sortable: true,
  render: row => row.clientName as string || "-"
}, {
  key: "projectName",
  header: "Project",
  sortable: true,
  render: row => row.projectName as string || "-"
}, {
  key: "moduleName",
  header: "Module",
  sortable: true,
  render: row => row.moduleName as string || "-"
}, {
  key: "lastStatus",
  header: "Last Status",
  sortable: true,
  render: row => row.lastStatus ? statusBadge(row.lastStatus as string) : <span className={ui("[color:var(--text-muted)] [font-size:var(--font-sm)]")}>No status yet</span>
}];
const mediaUrl = (path?: string | null) => `${process.env.NEXT_PUBLIC_IMAGE_URL ?? ""}${path ?? ""}`;
function MediaTile({
  m,
  idx,
  onOpen
}: {
  m: {
    mediaUrl?: string | null;
    mediaType?: string | null;
  };
  idx: number;
  onOpen: () => void;
}) {
  const type = (m.mediaType ?? "").toUpperCase();
  return <div style={{
    border: `1px solid ${COLORS.cardBorder}`
  }} onClick={onOpen} className={ui("[width:90px] [height:90px] [border-radius:10px] [overflow:hidden] [background:#f8fafc] [cursor:pointer]")}>
      {type.startsWith("IMAGE") ? <img src={mediaUrl(m.mediaUrl)} alt={`media-${idx}`} className={ui("[width:100%] [height:100%] [object-fit:cover]")} /> : type.startsWith("VIDEO") ? <video src={mediaUrl(m.mediaUrl)} muted className={ui("[width:100%] [height:100%] [object-fit:cover]")} /> : <div className={ui("[display:flex] [align-items:center] [justify-content:center] [height:100%] [font-size:var(--font-xs)] [color:#34445d]")}>
          File
        </div>}
    </div>;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallStatusPage() {
  return <Suspense fallback={<div className={ui("[padding:48px] [text-align:center]")}>Loading...</div>}>
      <CallStatusPageInner />
    </Suspense>;
}
function CallStatusPageInner() {
  usePageHeader({
    title: "Call Status",
    subtitle: "Track call status updates per task"
  });
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewTktId, setViewTktId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [lightbox, setLightbox] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);

  // Deep-link support — e.g. /ProjectManagement/CallStatus?tktId=1234 opens
  // straight into that ticket's log/detail view (used by the Home page's
  // "View Logs" action).
  useEffect(() => {
    const tktIdParam = searchParams.get("tktId");
    if (tktIdParam) {
      const parsed = Number(tktIdParam);
      if (!Number.isNaN(parsed)) setViewTktId(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const {
    data: bookings = [],
    isLoading
  } = useActiveBookingsWithLastStatus();
  const {
    data: detail,
    isLoading: detailLoading
  } = useCallStatusTicketDetail(viewTktId);
  const createMutation = useCreateCallStatus();
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    defaultValues: DEFAULTS
  });

  // Newest-first — used both to display the history and to derive the
  // "latest status" shown in the task summary at the top of the detail page.
  const sortedStatuses: CallStatusRecord[] = useMemo(() => {
    const list = detail?.statuses ?? [];
    return [...list].sort((a, b) => {
      const ta = a.UPDATED ? new Date(a.UPDATED).getTime() : 0;
      const tb = b.UPDATED ? new Date(b.UPDATED).getTime() : 0;
      return tb - ta;
    });
  }, [detail]);
  const latestStatus = sortedStatuses[0];
  const openView = (row: CallStatusListItem_Table) => {
    setViewTktId(Number(row.tktId));
    router.replace(`/ProjectManagement/CallStatus?tktId=${row.tktId}`);
  };
  const openAdd = () => {
    reset(DEFAULTS);
    setMedia(prev => {
      revokeMediaItems(prev);
      return [];
    });
    setAddOpen(true);
  };
  const onSubmit = async (values: StatusForm) => {
    if (!viewTktId) return;
    try {
      await createMutation.mutateAsync({
        payload: {
          tktId: viewTktId,
          STATUS: values.STATUS,
          remark: values.remark
        },
        media: media.map(m => m.file).filter(Boolean) as File[]
      });
      toast.success("Status Added", "Call status entry created successfully.");
      setAddOpen(false);
      reset(DEFAULTS);
      setMedia(prev => {
        revokeMediaItems(prev);
        return [];
      });
    } catch (err: any) {
      toast.error("Save Failed", err?.response?.data?.message || err?.message || "Failed to save status.");
    }
  };

  // ── Detail view (full page replace) ──
  if (viewTktId !== null) {
    const booking = detail?.callBooking;
    return <>
        

        <div className={ui("cs-wrap")}>
          <div className={ui("cs-head")}>
            <div>
              <div className={ui("cs-title")}>Call Status</div>
              <div className={ui("cs-sub")}>Ticket ID: {booking?.tktId ?? viewTktId}</div>
            </div>

            <div className={ui("cs-head-actions")}>
              <button className={ui("cs-btn-primary")} onClick={openAdd}>
                <Plus size={13} />
                Add Status
              </button>
              <button className={ui("cs-back-btn")} onClick={() => {
              setViewTktId(null);
              router.replace("/ProjectManagement/CallStatus");
            }}>
                ← Back to List
              </button>
            </div>
          </div>

          <div className={ui("cs-body")}>
            {detailLoading ? <div className={ui("[padding:48px] [text-align:center] [color:var(--text-muted)]")}>Loading...</div> : <>
                <div className={ui("cs-summary-grid")}>
                  {([["Client", booking?.clientName], ["Project", booking?.projectName], ["Module", booking?.moduleName], ["Task Status", booking?.status], ["Task Remark", booking?.remark], ["Last Status", latestStatus?.STATUS], ["Latest Remark", latestStatus?.remark]] as [string, unknown][]).map(([label, val]) => <div key={label} className={ui("cs-row")}>
                      <span className={ui("cs-label")}>{label}</span>
                      <span className={ui("cs-val")}>
                        {label === "Task Status" || label === "Last Status" ? statusBadge(val as string | null) : String(val ?? "—")}
                      </span>
                    </div>)}
                </div>

                {latestStatus?.media && latestStatus.media.length > 0 && <>
                    <div className={ui("cs-section-label")}>Media (latest status)</div>
                    <div className={ui("cs-media-grid")}>
                      {latestStatus.media.map((m, idx) => <MediaTile key={m.id ?? idx} m={m} idx={idx} onOpen={() => setLightbox({
                  items: latestStatus.media as LightboxItem[],
                  index: idx
                })} />)}
                    </div>
                  </>}

                <div className={ui("cs-section-label")}>Status History</div>

                {sortedStatuses.length === 0 ? <div className={ui("[padding:16px] [color:var(--text-muted)] [font-size:var(--font-sm)]")}>No status updates yet.</div> : <div className={ui("[display:flex] [flex-direction:column] [gap:10px]")}>
                    {sortedStatuses.map(s => <div key={s.sno} className={ui("cs-history-card")}>
                        <div className={ui("[display:flex] [align-items:center] [justify-content:space-between] [margin-bottom:6px]")}>
                          {statusBadge(s.STATUS)}
                          <span className={ui("[font-size:var(--font-xs)] [color:var(--text-muted)]")}>
                            {s.UPDATED ? new Date(s.UPDATED).toLocaleString() : "—"}
                          </span>
                        </div>

                        <div className={ui("[font-size:var(--font-sm)] [color:#34445d] [margin-bottom:4px]")}>
                          By <b className={ui("[color:var(--text-main)]")}>{s.userName ?? s.userId ?? "—"}</b>
                        </div>

                        {s.remark && <div className={ui("[font-size:var(--font-sm)] [color:var(--text-main)] [margin-bottom:6px]")}>{s.remark}</div>}

                        {(s.media && s.media.length > 0 || s.IMAGE) && (() => {
                  const historyMedia = s.media && s.media.length > 0 ? s.media : [{
                    mediaUrl: s.IMAGE,
                    mediaType: "IMAGE"
                  }];
                  return <div className={ui("cs-media-grid")}>
                              {historyMedia.map((m, idx) => <MediaTile key={idx} m={m} idx={idx} onOpen={() => setLightbox({
                      items: historyMedia as LightboxItem[],
                      index: idx
                    })} />)}
                            </div>;
                })()}
                      </div>)}
                  </div>}
              </>}
          </div>
        </div>

        {/* Add Status Modal */}
        {addOpen && <div className={ui("cs-overlay workspace-modal-overlay")} onClick={e => e.target === e.currentTarget && setAddOpen(false)}>
            <div className={ui("cs-modal-box workspace-modal")} data-workspace-dialog role="dialog" aria-modal="true" aria-label="Call update details">
              <div className={ui("cs-head")}>
                <div>
                  <div className={ui("cs-title")}>Add Status</div>
                  <div className={ui("cs-sub")}>Ticket: {booking?.tktId ?? viewTktId}</div>
                </div>
                <button className={ui("cs-close-btn")} data-dialog-close aria-label="Close form" onClick={() => setAddOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className={ui("cs-modal-body")}>
                  <div className={ui("cs-field-row")}>
                    <label className={ui("cs-field-label")}>Status *</label>
                    <Controller name="STATUS" control={control} render={({
                  field
                }) => <>
                          

                          <NativeSelectWrapper value={field.value} onChange={e => field.onChange(e.target.value.toUpperCase())} items={STATUS_ITEMS} css={{
                    fontSize: "14px",
                    background: "#ddd",
                    color: "#222"
                  }} className={ui("[min-width:150px]!")} />
                        </>} />
                    {errors.STATUS && <span className={ui("cs-field-error")}>{errors.STATUS.message}</span>}
                  </div>

                  <div className={ui("cs-field-row")}>
                    <label className={ui("cs-field-label")}>Remark</label>
                    <Controller name="remark" control={control} render={({
                  field
                }) => <TextareaField value={field.value} field="remark" onChange={(_, value) => field.onChange(value)} placeholder="Enter remark" mode="inline" rows={3} />} />
                    {errors.remark && <span className={ui("cs-field-error")}>{errors.remark.message}</span>}
                  </div>

                  <div className={ui("cs-field-row")}>
                    <label className={ui("cs-field-label")}>Media (image/video)</label>
                    <MediaManager value={media} onChange={setMedia} accept="image/*,video/*" maxFiles={10} onError={msg => toast.error("Error", msg)} />
                  </div>
                </div>

                <div className={ui("cs-modal-footer")}>
                  <button type="button" className={ui("cs-btn-secondary")} onClick={() => setAddOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={ui("cs-btn-primary")} disabled={createMutation.isPending}>
                    <Pencil size={12} />
                    {createMutation.isPending ? "Saving..." : "Save Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>}

        {lightbox && <MediaLightbox items={lightbox.items} index={lightbox.index} onClose={() => setLightbox(null)} onIndexChange={i => setLightbox(prev => prev ? {
        ...prev,
        index: i
      } : prev)} />}
      </>;
  }

  // ── List view ──
  return <CustomTable title="Call Status" columns={COLUMNS} data={bookings as CallStatusListItem_Table[]} rowKey="sno" isLoading={isLoading} extraActions={[{
    label: "View Status",
    icon: <ChevronRightCircle size={20} />,
    onClick: openView
  }]} searchPlaceholder="Search ticket, client, project..." emptyMessage="No active bookings found." />;
}
