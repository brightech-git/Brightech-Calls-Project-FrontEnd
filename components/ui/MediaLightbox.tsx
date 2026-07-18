// ─────────────────────────────────────────────
// components/ui/MediaLightbox.tsx
// ─────────────────────────────────────────────
// Full-screen popup for viewing one media item from a group, with
// Left/Right buttons (and arrow keys) to step through the adjacent
// items in that same group. Used anywhere a small media thumbnail is
// shown (Task Assignment media, Call Status media/history).
"use client";

import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS, RADIUS, FONT } from "@/utils/theme";

export interface LightboxItem {
  mediaUrl?: string | null;
  mediaType?: string | null;
}

interface MediaLightboxProps {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  baseUrl?: string;
}

export function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
  baseUrl,
}: MediaLightboxProps) {

  const count = items.length;

  const goPrev = () => onIndexChange((index - 1 + count) % count);
  const goNext = () => onIndexChange((index + 1) % count);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && count > 1) goPrev();
      if (e.key === "ArrowRight" && count > 1) goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  if (!count) return null;

  const base = baseUrl ?? process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
  const item = items[index];
  const type = (item.mediaType ?? "").toUpperCase();
  const url = `${base}${item.mediaUrl ?? ""}`;

  const navBtnStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "fixed",
    [side]: 16,
    top: "50%",
    transform: "translateY(-50%)",
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2001,
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Close"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2001,
        }}
      >
        <X size={18} />
      </button>

      {count > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          title="Previous"
          style={navBtnStyle("left")}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        {type.startsWith("IMAGE") ? (
          <img
            src={url}
            alt={`media-${index}`}
            style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: RADIUS.md }}
          />
        ) : type.startsWith("VIDEO") ? (
          <video
            src={url}
            controls
            autoPlay
            style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: RADIUS.md }}
          />
        ) : (
          <a href={url} target="_blank" rel="noreferrer" style={{ color: "#fff", fontFamily: FONT.family }}>
            Open file
          </a>
        )}

        {count > 1 && (
          <div style={{ color: "#fff", fontSize: 12, fontFamily: FONT.family }}>
            {index + 1} / {count}
          </div>
        )}
      </div>

      {count > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          title="Next"
          style={navBtnStyle("right")}
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}
