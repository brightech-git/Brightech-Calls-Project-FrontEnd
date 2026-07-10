"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Clock, MessageSquare, Send, Upload, X } from "lucide-react";

import { useToast } from "@/components/Toast";
import { COLORS, FONT, RADIUS } from "@/utils/theme";
import { useCallStatusByTicketId, useCreateCallStatus } from "@/hooks/CallStatus/useCallStatus";
import { FIXED_CALL_STATUSES, getCallStatusStyle } from "@/utils/callStatus";
import { CallsBookingRecord } from "@/types/TaskAssignment/TaskAssignment";

interface CallStatusDetailProps {
  ticket: CallsBookingRecord;
  onBack: () => void;
}

// Shared "ticket detail + status history + reply" view, used by both the
// Call Status screen and the Call Booking screen (so a booking can be
// viewed/replied to from either place, as requested).
export function CallStatusDetail({ ticket, onBack }: CallStatusDetailProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [replyStatus, setReplyStatus] = useState("PENDING");
  const [customStatus, setCustomStatus] = useState("");
  const [replyRemark, setReplyRemark] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);

  const { data: ticketData, isLoading: statusLoading } = useCallStatusByTicketId(
    ticket?.TKTID ?? null
  );
  const createMutation = useCreateCallStatus();

  const statuses = ticketData?.statuses ?? [];
  const bookingInfo = ticketData?.callBooking;

  const resetReplyForm = () => {
    setReplyStatus("PENDING");
    setCustomStatus("");
    setReplyRemark("");
    if (replyImagePreview) URL.revokeObjectURL(replyImagePreview);
    setReplyImage(null);
    setReplyImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (replyImagePreview) URL.revokeObjectURL(replyImagePreview);
    setReplyImage(file);
    setReplyImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitReply = async () => {
    if (!ticket?.TKTID) return;
    const finalStatus = (customStatus.trim() || replyStatus).toUpperCase();

    if (!replyRemark.trim() && !replyImage) {
      toast.error("Validation", "Please enter a remark or attach an image.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        payload: {
          tktId: ticket.TKTID,
          STATUS: finalStatus,
          remark: replyRemark.trim() || undefined,
        },
        image: replyImage,
      });

      toast.success("Reply Sent", "Status reply added successfully.");
      resetReplyForm();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || err?.message || "Failed to save.");
    }
  };

  const staffNames = bookingInfo?.STAFFMAP
    ? Object.values(bookingInfo.STAFFMAP as Record<string, string>).join(", ")
    : ticket.STAFFMAP
    ? Object.values(ticket.STAFFMAP).join(", ")
    : "-";

  return (
    <>
      <style>{`
        .csd-wrap { font-family: ${FONT.family}; }
        .csd-back {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
          color: ${COLORS.textSecondary}; font-size: 12px; cursor: pointer;
          margin-bottom: 12px;
        }
        .csd-back:hover { background: ${COLORS.gray50}; }

        .csd-booking-card {
          background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl}; padding: 16px; margin-bottom: 16px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .csd-booking-title {
          font-size: 14px; font-weight: 700; color: ${COLORS.textPrimary};
          margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
        }
        .csd-booking-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;
        }
        .csd-booking-field { font-size: 12px; }
        .csd-booking-label { font-weight: 600; color: ${COLORS.textMuted}; }
        .csd-booking-value { color: ${COLORS.textPrimary}; margin-top: 2px; }

        .csd-timeline-card {
          background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl}; overflow: hidden;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04); margin-bottom: 16px;
        }
        .csd-timeline-head {
          padding: 12px 16px; background: ${COLORS.gray50};
          border-bottom: 1px solid ${COLORS.cardBorder};
          font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary};
          display: flex; align-items: center; gap: 8px;
        }
        .csd-timeline-body { padding: 16px; }
        .csd-timeline-empty {
          text-align: center; padding: 32px; font-size: 13px;
          color: ${COLORS.textMuted};
        }

        .csd-reply {
          display: flex; gap: 12px; padding: 12px 0;
          border-bottom: 1px solid ${COLORS.cardBorder};
        }
        .csd-reply:last-child { border-bottom: none; }
        .csd-reply-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: ${COLORS.infoBg}; color: ${COLORS.info};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 11px; font-weight: 700;
        }
        .csd-reply-content { flex: 1; min-width: 0; }
        .csd-reply-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 4px; flex-wrap: wrap;
        }
        .csd-reply-user { font-size: 12px; font-weight: 700; color: ${COLORS.textPrimary}; }
        .csd-reply-time { font-size: 10px; color: ${COLORS.textMuted}; display: flex; align-items: center; gap: 3px; }
        .csd-reply-status {
          font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 12px;
        }
        .csd-reply-remark { font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.5; }
        .csd-reply-image {
          margin-top: 8px; max-width: 200px; border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.cardBorder}; cursor: pointer;
        }

        .csd-reply-form {
          background: ${COLORS.cardBg}; border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.xl}; padding: 16px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .csd-reply-form-title {
          font-size: 13px; font-weight: 700; color: ${COLORS.textPrimary};
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .csd-form-row { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; flex-wrap: wrap; }
        .csd-form-field { display: flex; flex-direction: column; gap: 4px; }
        .csd-form-label { font-size: 11px; font-weight: 600; color: ${COLORS.textMuted}; }
        .csd-form-select {
          padding: 6px 10px; font-size: 12px; border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.md}; font-family: ${FONT.family};
          background: ${COLORS.cardBg};
        }
        .csd-form-select:focus { outline: none; border-color: ${COLORS.btnPrimaryBg}; }
        .csd-form-custom-input {
          padding: 6px 10px; font-size: 12px; border: 1px solid ${COLORS.cardBorder};
          border-radius: ${RADIUS.md}; font-family: ${FONT.family};
          background: ${COLORS.cardBg}; text-transform: uppercase; width: 160px;
        }
        .csd-form-custom-input:focus { outline: none; border-color: ${COLORS.btnPrimaryBg}; }
        .csd-form-textarea {
          width: 100%; padding: 8px 10px; font-size: 12px;
          border: 1px solid ${COLORS.cardBorder}; border-radius: ${RADIUS.md};
          font-family: ${FONT.family}; resize: vertical; min-height: 60px;
        }
        .csd-form-textarea:focus { outline: none; border-color: ${COLORS.btnPrimaryBg}; }
        .csd-form-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .csd-btn-send {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 16px; border-radius: ${RADIUS.md}; border: none;
          background: ${COLORS.btnPrimaryBg}; color: ${COLORS.btnPrimaryText};
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .csd-btn-send:hover { background: ${COLORS.btnPrimaryHover}; }
        .csd-btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .csd-btn-upload {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 6px 12px; border-radius: ${RADIUS.md};
          border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
          color: ${COLORS.textSecondary}; font-size: 11px; cursor: pointer;
        }
        .csd-btn-upload:hover { background: ${COLORS.gray50}; }
        .csd-image-preview {
          position: relative; display: inline-block; margin-top: 8px;
        }
        .csd-image-preview img {
          width: 80px; height: 80px; object-fit: cover;
          border-radius: ${RADIUS.md}; border: 1px solid ${COLORS.cardBorder};
        }
        .csd-image-remove {
          position: absolute; top: -6px; right: -6px;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${COLORS.error}; color: #fff;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageSelect}
      />

      <div className="csd-wrap">
        <button className="csd-back" onClick={onBack}>
          <ArrowLeft size={13} /> Back to List
        </button>

        {/* Booking Info Card */}
        <div className="csd-booking-card">
          <div className="csd-booking-title">
            <MessageSquare size={16} />
            Ticket #{ticket.TKTID} - {bookingInfo?.PROJECTNAME || ticket.PROJECTNAME || "N/A"}
          </div>
          <div className="csd-booking-grid">
            <div className="csd-booking-field">
              <div className="csd-booking-label">Project</div>
              <div className="csd-booking-value">{bookingInfo?.PROJECTNAME || ticket.PROJECTNAME || "-"}</div>
            </div>
            <div className="csd-booking-field">
              <div className="csd-booking-label">Assigned To</div>
              <div className="csd-booking-value">{staffNames}</div>
            </div>
            <div className="csd-booking-field">
              <div className="csd-booking-label">Current Status</div>
              <div className="csd-booking-value">
                {(() => {
                  const s = bookingInfo?.STATUS || ticket.STATUS || "PENDING";
                  const st = getCallStatusStyle(s);
                  return <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>{s}</span>;
                })()}
              </div>
            </div>
            <div className="csd-booking-field">
              <div className="csd-booking-label">Description</div>
              <div className="csd-booking-value">{bookingInfo?.DESCRIPTION || ticket.DESCRIPTION || "-"}</div>
            </div>
            <div className="csd-booking-field">
              <div className="csd-booking-label">Date</div>
              <div className="csd-booking-value">
                {ticket.TKTDATE ? new Date(ticket.TKTDATE).toLocaleDateString() : "-"}
              </div>
            </div>
            <div className="csd-booking-field">
              <div className="csd-booking-label">Remark</div>
              <div className="csd-booking-value">{bookingInfo?.REMARK || ticket.REMARK || "-"}</div>
            </div>
          </div>
        </div>

        {/* Status Reply Timeline */}
        <div className="csd-timeline-card">
          <div className="csd-timeline-head">
            <Clock size={14} /> Status History ({statuses.length} {statuses.length === 1 ? "reply" : "replies"})
          </div>
          <div className="csd-timeline-body">
            {statusLoading ? (
              <div className="csd-timeline-empty">Loading status history...</div>
            ) : statuses.length === 0 ? (
              <div className="csd-timeline-empty">No status replies yet. Add the first reply below.</div>
            ) : (
              statuses.map((s, idx) => {
                const st = getCallStatusStyle(s.STATUS);
                const initials = (s.userName || s.staffName || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={s.sno ?? idx} className="csd-reply">
                    <div className="csd-reply-avatar">{initials}</div>
                    <div className="csd-reply-content">
                      <div className="csd-reply-header">
                        <span className="csd-reply-user">{s.userName || s.staffName || "Unknown"}</span>
                        <span className="csd-reply-status" style={{ background: st.bg, color: st.color }}>
                          {s.STATUS || "PENDING"}
                        </span>
                        <span className="csd-reply-time">
                          <Clock size={10} />
                          {s.CREATEDAT ? new Date(s.CREATEDAT).toLocaleString() : "-"}
                        </span>
                      </div>
                      {s.remark && <div className="csd-reply-remark">{s.remark}</div>}
                      {s.IMAGE && (
                        <img
                          className="csd-reply-image"
                          src={`${process.env.NEXT_PUBLIC_IMAGE_URL || ""}${s.IMAGE}`}
                          alt="attachment"
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_IMAGE_URL || ""}${s.IMAGE}`, "_blank")}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add Reply Form */}
        <div className="csd-reply-form">
          <div className="csd-reply-form-title">
            <Send size={14} /> Add Status Reply
          </div>

          <div className="csd-form-row">
            <div className="csd-form-field">
              <label className="csd-form-label">Status</label>
              <select
                className="csd-form-select"
                value={replyStatus}
                onChange={(e) => { setReplyStatus(e.target.value); setCustomStatus(""); }}
              >
                {FIXED_CALL_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="csd-form-field">
              <label className="csd-form-label">Or Type Custom Status</label>
              <input
                className="csd-form-custom-input"
                placeholder="e.g. WAITING ON CLIENT"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="csd-form-field" style={{ marginBottom: 10 }}>
            <label className="csd-form-label">Remark</label>
            <textarea
              className="csd-form-textarea"
              placeholder="Enter your remark or update..."
              value={replyRemark}
              onChange={(e) => setReplyRemark(e.target.value)}
            />
          </div>

          {replyImagePreview && (
            <div className="csd-image-preview">
              <img src={replyImagePreview} alt="preview" />
              <button
                className="csd-image-remove"
                onClick={() => {
                  URL.revokeObjectURL(replyImagePreview);
                  setReplyImage(null);
                  setReplyImagePreview(null);
                }}
              >
                <X size={10} />
              </button>
            </div>
          )}

          <div className="csd-form-actions">
            <button
              className="csd-btn-send"
              onClick={handleSubmitReply}
              disabled={createMutation.isPending}
            >
              <Send size={12} />
              {createMutation.isPending ? "Sending..." : "Send Reply"}
            </button>
            <button
              className="csd-btn-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={12} /> Attach Image
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
