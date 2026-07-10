// ─────────────────────────────────────────────
// components/ui/MediaManager.tsx
// ─────────────────────────────────────────────
"use client";

import { useRef, useState, CSSProperties } from "react";
import { RefreshCw, X, ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";

import { COLORS, RADIUS, FONT } from "@/utils/theme";
import { SwitchInput } from "@/components/ui/SwitchInput";

export interface MediaItem {
  uid: string;
  mediaId?: number | null;
  file: File;
  previewUrl: string;
  mediaType: string;
  active: boolean;
}

export const makeMediaItem = (file: File): MediaItem => ({
  uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  mediaId: null,
  file,
  previewUrl: URL.createObjectURL(file),
  mediaType: file.type.split("/")[0] || "file",
  active: true,
});

export const revokeMediaItems = (items: MediaItem[]) =>
  items.forEach((m) => URL.revokeObjectURL(m.previewUrl));

interface MediaManagerProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  accept?: string;
  maxFiles?: number;
  onError?: (msg: string) => void;
}

// Grid of media slots — each can be reordered (sets DISPLAY_ORDER),
// replaced in place (swaps the file, keeps its position/active flag),
// toggled active/inactive, or removed. Only active items are uploaded,
// in their current on-screen order.
export function MediaManager({
  value,
  onChange,
  accept = "image/*,video/*,application/pdf",
  maxFiles = 10,
  onError,
}: MediaManagerProps) {
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingUid, setReplacingUid] = useState<string | null>(null);

  const handleAddFiles = (files: FileList | null) => {
    if (!files || !files.length) return;

    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const picked = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      onError?.(`Only ${remaining} more file(s) allowed`);
    }

    onChange([...value, ...picked.map(makeMediaItem)]);
  };

  const handleReplace = (uid: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    onChange(
      value.map((m) => {
        if (m.uid !== uid) return m;
        URL.revokeObjectURL(m.previewUrl);
        return { ...makeMediaItem(file), uid: m.uid, active: m.active };
      })
    );
  };

  const remove = (uid: string) => {
    const target = value.find((m) => m.uid === uid);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((m) => m.uid !== uid));
  };

  const toggleActive = (uid: string, active: boolean) => {
    onChange(value.map((m) => (m.uid === uid ? { ...m, active } : m)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {value.map((item, idx) => (
          <div
            key={item.uid}
            style={{
              width: 120,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: RADIUS.md,
              background: COLORS.cardBg,
              overflow: "hidden",
              position: "relative",
              fontFamily: FONT.family,
              opacity: item.active ? 1 : 0.55,
            }}
          >
            <div
              style={{
                position: "absolute", top: 4, left: 4, zIndex: 2,
                background: "rgba(0,0,0,0.6)", color: "#fff",
                fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px",
              }}
            >
              #{idx + 1}
            </div>

            <button
              type="button"
              onClick={() => remove(item.uid)}
              title="Remove"
              style={{
                position: "absolute", top: 4, right: 4, zIndex: 2,
                width: 20, height: 20, borderRadius: "50%", border: "none",
                background: "rgba(0,0,0,0.6)", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={12} />
            </button>

            <div style={{ height: 90, background: COLORS.gray50, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {item.mediaType === "image" ? (
                <img src={item.previewUrl} alt={item.file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : item.mediaType === "video" ? (
                <video src={item.previewUrl} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <FileText size={28} color={COLORS.textMuted} />
              )}
            </div>

            <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                title={item.file.name}
                style={{ fontSize: 10, color: COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {item.file.name}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 2 }}>
                  <button type="button" disabled={idx === 0} onClick={() => move(idx, -1)} title="Move earlier" style={iconBtnStyle(idx === 0)}>
                    <ChevronLeft size={12} />
                  </button>
                  <button type="button" disabled={idx === value.length - 1} onClick={() => move(idx, 1)} title="Move later" style={iconBtnStyle(idx === value.length - 1)}>
                    <ChevronRight size={12} />
                  </button>
                </div>

                <button
                  type="button"
                  title="Replace file"
                  onClick={() => {
                    setReplacingUid(item.uid);
                    replaceInputRef.current?.click();
                  }}
                  style={iconBtnStyle(false)}
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: COLORS.textSecondary }}>{item.active ? "Active" : "Inactive"}</span>
                <SwitchInput
                  value={item.active ? "Y" : "N"}
                  onChange={(v) => toggleActive(item.uid, v === "Y")}
                  trueValue="Y"
                  falseValue="N"
                  size="sm"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          style={{
            width: 120, height: 152,
            border: `1px dashed ${COLORS.cardBorder}`, borderRadius: RADIUS.md,
            background: COLORS.gray50, color: COLORS.textMuted,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 4, cursor: "pointer", fontFamily: FONT.family, fontSize: 11,
          }}
        >
          <Plus size={18} />
          Add Media
        </button>
      </div>

      <input
        ref={addInputRef}
        type="file"
        multiple
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          handleAddFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <input
        ref={replaceInputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          if (replacingUid) handleReplace(replacingUid, e.target.files);
          setReplacingUid(null);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function iconBtnStyle(disabled: boolean): CSSProperties {
  return {
    width: 20, height: 20, borderRadius: 4,
    border: `1px solid ${COLORS.cardBorder}`, background: COLORS.cardBg,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1, color: COLORS.textSecondary,
  };
}
