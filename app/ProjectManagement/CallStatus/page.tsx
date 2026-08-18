"use client";

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

import {
  useActiveBookingsWithLastStatus,
  useCallStatusTicketDetail,
  useCreateCallStatus,
} from "@/hooks/CallStatus/useCallStatus";

import {
  CallStatusListItem_Table,
  CallStatusRecord,
} from "@/types/CallStatus/CallStatus";

// ─────────────────────────────────────────────
// Schema — Add Status form
// ─────────────────────────────────────────────

const statusSchema = z.object({
  STATUS: z.string().min(1, "Status is required"),
  remark: z.string().optional(),
});

type StatusForm = z.infer<typeof statusSchema>;

const DEFAULTS: StatusForm = {
  STATUS: "OPEN",
  remark: "",
};

const STATUS_ITEMS = [
  { label: "Open",    value: "OPEN"    },
  { label: "Process", value: "PROCESS" },
  { label: "Closed",  value: "CLOSED"  },
];

const statusBadge = (label?: string | null) => {
  const s = label ?? "—";
  const bg    = s === "CLOSED"  ? COLORS.errorBg   : s === "PROCESS" ? COLORS.warningBg : COLORS.successBg;
  const color = s === "CLOSED"  ? COLORS.error      : s === "PROCESS" ? COLORS.warning    : COLORS.success;
  return (
    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: FONT.size.xs, fontWeight: 600, background: bg, color }}>
      {s}
    </span>
  );
};

// ─────────────────────────────────────────────
// Columns — list view (active bookings only)
// ─────────────────────────────────────────────

const COLUMNS: TableColumn<CallStatusListItem_Table>[] = [
  { key: "tktId",       header: "Ticket ID", sortable: true, width: "90px" },
  { key: "clientName",  header: "Client",    sortable: true, render: (row) => (row.clientName as string) || "-" },
  { key: "projectName", header: "Project",   sortable: true, render: (row) => (row.projectName as string) || "-" },
  { key: "moduleName",  header: "Module",    sortable: true, render: (row) => (row.moduleName as string) || "-" },
  {
    key: "lastStatus",
    header: "Last Status",
    sortable: true,
    render: (row) => (row.lastStatus ? statusBadge(row.lastStatus as string) : <span style={{ color: COLORS.textMuted, fontSize: FONT.size.sm }}>No status yet</span>),
  },
];

const mediaUrl = (path?: string | null) => `${process.env.NEXT_PUBLIC_IMAGE_URL ?? ""}${path ?? ""}`;

function MediaTile({ m, idx, onOpen }: { m: { mediaUrl?: string | null; mediaType?: string | null }; idx: number; onOpen: () => void }) {
  const type = (m.mediaType ?? "").toUpperCase();
  return (
    <div
      style={{
        width: 90, height: 90, borderRadius: RADIUS.md,
        border: `1px solid ${COLORS.cardBorder}`, overflow: "hidden", background: COLORS.gray50,
        cursor: "pointer",
      }}
      onClick={onOpen}
    >
      {type.startsWith("IMAGE") ? (
        <img src={mediaUrl(m.mediaUrl)} alt={`media-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : type.startsWith("VIDEO") ? (
        <video src={mediaUrl(m.mediaUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: FONT.size.xs, color: COLORS.textSecondary }}>
          File
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CallStatusPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center" }}>Loading...</div>}>
      <CallStatusPageInner />
    </Suspense>
  );
}

function CallStatusPageInner() {
  usePageHeader({
    title: "Call Status",
    subtitle: "Track call status updates per task",
  });

  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewTktId, setViewTktId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number } | null>(null);

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

  const { data: bookings = [], isLoading } = useActiveBookingsWithLastStatus();

  const {
    data: detail,
    isLoading: detailLoading,
  } = useCallStatusTicketDetail(viewTktId);

  const createMutation = useCreateCallStatus();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    defaultValues: DEFAULTS,
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
    setMedia((prev) => {
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
          remark: values.remark,
        },
        media: media.map((m) => m.file).filter(Boolean) as File[],
      });

      toast.success("Status Added", "Call status entry created successfully.");
      setAddOpen(false);
      reset(DEFAULTS);
      setMedia((prev) => {
        revokeMediaItems(prev);
        return [];
      });
    } catch (err: any) {
      toast.error(
        "Save Failed",
        err?.response?.data?.message || err?.message || "Failed to save status."
      );
    }
  };

  // ── Detail view (full page replace) ──
  if (viewTktId !== null) {
    const booking = detail?.callBooking;

    return (
      <>
        <style>{`
          .cs-wrap { background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder};
            border-radius: ${RADIUS.xl}; font-family: ${FONT.family}; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
          .cs-head { padding: 10px 14px; border-bottom: 1px solid ${COLORS.cardBorder};
            display: flex; align-items: center; justify-content: space-between;
            background: ${COLORS.gray50}; border-radius: ${RADIUS.xl} ${RADIUS.xl} 0 0; }
          .cs-title { font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary}; }
          .cs-sub   { font-size: 11px; color: ${COLORS.textMuted}; margin-top: 2px; }
          .cs-body  { padding: 16px; }
          .cs-head-actions { display: flex; align-items: center; gap: 8px; }
          .cs-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 12px; }
          .cs-row { display: flex; gap: 8px; padding: 7px 0; border-bottom: 1px solid ${COLORS.cardBorder}; font-size: 13px; }
          .cs-row:last-child { border-bottom: none; }
          .cs-label { width: 120px; font-weight: 600; color: ${COLORS.textSecondary}; flex-shrink: 0; font-size: 12px; }
          .cs-val   { color: ${COLORS.textPrimary}; }
          .cs-section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
            color: ${COLORS.textMuted}; padding-bottom: 4px; border-bottom: 1px solid ${COLORS.cardBorder}; margin: 16px 0 8px; }
          .cs-media-grid { display: flex; flex-wrap: wrap; gap: 8px; }
          .cs-back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; height: 32px;
            border-radius: ${RADIUS.md}; border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
            color: ${COLORS.textSecondary}; font-size: 12px; cursor: pointer; font-family: ${FONT.family}; }
          .cs-back-btn:hover { background: ${COLORS.gray50}; }
          .cs-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 0 16px; height: 32px;
            border-radius: ${RADIUS.md}; border: none; background: ${COLORS.btnPrimaryBg}; color: ${COLORS.btnPrimaryText};
            font-size: 12px; font-weight: 600; cursor: pointer; }
          .cs-btn-primary:hover:not(:disabled) { background: ${COLORS.btnPrimaryHover}; }
          .cs-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
          .cs-btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 0 16px; height: 34px;
            border-radius: ${RADIUS.md}; border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
            color: ${COLORS.textSecondary}; font-size: 12px; cursor: pointer; }
          .cs-history-card { border: 1px solid ${COLORS.cardBorder}; border-radius: ${RADIUS.md}; padding: 10px; background: ${COLORS.cardBg}; }
          .cs-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex;
            align-items: flex-start; justify-content: center; z-index: 1000; padding: 20px 16px; overflow-y: auto; }
          .cs-modal-box { background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder}; border-radius: ${RADIUS.xl};
            width: 100%; max-width: 640px; display: flex; flex-direction: column; font-family: ${FONT.family};
            box-shadow: 0 8px 32px rgba(0,0,0,0.16); }
          .cs-modal-box form { display: flex; flex-direction: column; }
          .cs-modal-body { padding: 14px 16px; }
          .cs-modal-footer { padding: 8px 14px; border-top: 1px solid ${COLORS.cardBorder}; display: flex;
            justify-content: flex-end; gap: 8px; background: ${COLORS.gray50}; border-radius: 0 0 ${RADIUS.xl} ${RADIUS.xl}; }
          .cs-field-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
          .cs-field-label { font-size: 12px; font-weight: 600; color: ${COLORS.textSecondary}; }
          .cs-field-error { font-size: 11px; color: ${COLORS.error}; }
          .cs-close-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid ${COLORS.cardBorder};
            background: ${COLORS.cardBg}; cursor: pointer; }
        `}</style>

        <div className="cs-wrap">
          <div className="cs-head">
            <div>
              <div className="cs-title">Call Status</div>
              <div className="cs-sub">Ticket ID: {booking?.tktId ?? viewTktId}</div>
            </div>

            <div className="cs-head-actions">
              <button className="cs-btn-primary" onClick={openAdd}>
                <Plus size={13} />
                Add Status
              </button>
              <button
                className="cs-back-btn"
                onClick={() => {
                  setViewTktId(null);
                  router.replace("/ProjectManagement/CallStatus");
                }}
              >
                ← Back to List
              </button>
            </div>
          </div>

          <div className="cs-body">
            {detailLoading ? (
              <div style={{ padding: 48, textAlign: "center", color: COLORS.textMuted }}>Loading...</div>
            ) : (
              <>
                <div className="cs-summary-grid">
                  {([
                    ["Client",       booking?.clientName],
                    ["Project",      booking?.projectName],
                    ["Module",       booking?.moduleName],
                    ["Task Status",  booking?.status],
                    ["Task Remark",  booking?.remark],
                    ["Last Status",  latestStatus?.STATUS],
                    ["Latest Remark", latestStatus?.remark],
                  ] as [string, unknown][]).map(([label, val]) => (
                    <div key={label} className="cs-row">
                      <span className="cs-label">{label}</span>
                      <span className="cs-val">
                        {label === "Task Status" || label === "Last Status"
                          ? statusBadge(val as string | null)
                          : String(val ?? "—")}
                      </span>
                    </div>
                  ))}
                </div>

                {latestStatus?.media && latestStatus.media.length > 0 && (
                  <>
                    <div className="cs-section-label">Media (latest status)</div>
                    <div className="cs-media-grid">
                      {latestStatus.media.map((m, idx) => (
                        <MediaTile
                          key={m.id ?? idx}
                          m={m}
                          idx={idx}
                          onOpen={() => setLightbox({ items: latestStatus.media as LightboxItem[], index: idx })}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="cs-section-label">Status History</div>

                {sortedStatuses.length === 0 ? (
                  <div style={{ padding: 16, color: COLORS.textMuted, fontSize: FONT.size.sm }}>No status updates yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {sortedStatuses.map((s) => (
                      <div key={s.sno} className="cs-history-card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          {statusBadge(s.STATUS)}
                          <span style={{ fontSize: FONT.size.xs, color: COLORS.textMuted }}>
                            {s.UPDATED ? new Date(s.UPDATED).toLocaleString() : "—"}
                          </span>
                        </div>

                        <div style={{ fontSize: FONT.size.sm, color: COLORS.textSecondary, marginBottom: 4 }}>
                          By <b style={{ color: COLORS.textPrimary }}>{s.userName ?? s.userId ?? "—"}</b>
                        </div>

                        {s.remark && (
                          <div style={{ fontSize: FONT.size.sm, color: COLORS.textPrimary, marginBottom: 6 }}>{s.remark}</div>
                        )}

                        {((s.media && s.media.length > 0) || s.IMAGE) && (() => {
                          const historyMedia = s.media && s.media.length > 0
                            ? s.media
                            : [{ mediaUrl: s.IMAGE, mediaType: "IMAGE" }];
                          return (
                            <div className="cs-media-grid">
                              {historyMedia.map((m, idx) => (
                                <MediaTile
                                  key={idx}
                                  m={m}
                                  idx={idx}
                                  onOpen={() => setLightbox({ items: historyMedia as LightboxItem[], index: idx })}
                                />
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Status Modal */}
        {addOpen && (
          <div className="cs-overlay" onClick={(e) => e.target === e.currentTarget && setAddOpen(false)}>
            <div className="cs-modal-box">
              <div className="cs-head">
                <div>
                  <div className="cs-title">Add Status</div>
                  <div className="cs-sub">Ticket: {booking?.tktId ?? viewTktId}</div>
                </div>
                <button className="cs-close-btn" onClick={() => setAddOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="cs-modal-body">
                  <div className="cs-field-row">
                    <label className="cs-field-label">Status *</label>
                    <Controller
                      name="STATUS"
                      control={control}
                      render={({ field }) => (
                        <>
                          <input
                            {...field}
                            list="cs-status-suggestions"
                            placeholder="Type or pick a status"
                            style={{
                              height: 32,
                              padding: "0 10px",
                              borderRadius: RADIUS.md,
                              border: `1px solid ${COLORS.cardBorder}`,
                              fontSize: FONT.size.sm,
                              fontFamily: FONT.family,
                              textTransform: "uppercase",
                              color: COLORS.textPrimary,
                              background: COLORS.cardBg,
                            }}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                          <datalist id="cs-status-suggestions">
                            {STATUS_ITEMS.map((s) => (
                              <option key={s.value} value={s.value} />
                            ))}
                          </datalist>
                        </>
                      )}
                    />
                    {errors.STATUS && <span className="cs-field-error">{errors.STATUS.message}</span>}
                  </div>

                  <div className="cs-field-row">
                    <label className="cs-field-label">Remark</label>
                    <Controller
                      name="remark"
                      control={control}
                      render={({ field }) => (
                        <TextareaField
                          value={field.value}
                          field="remark"
                          onChange={(_, value) => field.onChange(value)}
                          placeholder="Enter remark"
                          mode="inline"
                          rows={3}
                        />
                      )}
                    />
                    {errors.remark && <span className="cs-field-error">{errors.remark.message}</span>}
                  </div>

                  <div className="cs-field-row">
                    <label className="cs-field-label">Media (image/video)</label>
                    <MediaManager
                      value={media}
                      onChange={setMedia}
                      accept="image/*,video/*"
                      maxFiles={10}
                      onError={(msg) => toast.error("Error", msg)}
                    />
                  </div>
                </div>

                <div className="cs-modal-footer">
                  <button type="button" className="cs-btn-secondary" onClick={() => setAddOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="cs-btn-primary" disabled={createMutation.isPending}>
                    <Pencil size={12} />
                    {createMutation.isPending ? "Saving..." : "Save Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {lightbox && (
          <MediaLightbox
            items={lightbox.items}
            index={lightbox.index}
            onClose={() => setLightbox(null)}
            onIndexChange={(i) => setLightbox((prev) => (prev ? { ...prev, index: i } : prev))}
          />
        )}
      </>
    );
  }

  // ── List view ──
  return (
    <CustomTable
      title="Call Status"
      columns={COLUMNS}
      data={bookings as CallStatusListItem_Table[]}
      rowKey="sno"
      isLoading={isLoading}
      extraActions={[
        {
          label: "View Status",
          icon: <ChevronRightCircle size={20} />,
          onClick: openView,
        },
      ]}
      searchPlaceholder="Search ticket, client, project..."
      emptyMessage="No active bookings found."
    />
  );
}
