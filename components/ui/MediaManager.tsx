// ─────────────────────────────────────────────
// components/ui/MediaManager.tsx
// ─────────────────────────────────────────────
'use client';

import { cn } from '@/lib/utils';
import { buttonClass } from '@/lib/styles';
import { useEffect, useEffectEvent, useRef, useState, CSSProperties } from 'react';
import { RefreshCw, X, ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react';

import { COLORS, RADIUS, FONT } from '@/utils/theme';
import { ResolveImage } from '@/utils/format/resolveImage';
import { MediaLightbox } from '@/components/ui/MediaLightbox';
import { SwitchInput } from '@/components/ui/SwitchInput';

export interface MediaItem {
  uid: string;
  /** Existing row's own id (Media.sno) — set only for items already saved
   *  on the server. Null/undefined for files picked but not uploaded yet. */
  id?: number | null;
  /** Present for newly picked files. Existing (already-uploaded) items
   *  have no File object — they're shown via previewUrl instead. */
  file?: File | null;
  /** Display name for already-uploaded items that have no File object. */
  fileName?: string;
  previewUrl: string;
  mediaType: string;
  active: boolean;
  /** True when this item was loaded from the server (edit mode), false/undefined for a new pick. */
  isExisting?: boolean;
}

export const makeMediaItem = (file: File): MediaItem => ({
  uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  id: null,
  file,
  previewUrl: URL.createObjectURL(file),
  mediaType: file.type.split('/')[0] || 'file',
  active: true,
  isExisting: false,
});

// Seed a MediaItem from an already-uploaded server record (edit mode).
// `mediaUrl` is joined with `baseUrl` (e.g. NEXT_PUBLIC_IMAGE_URL) to build
// a real, viewable previewUrl — not a blob: URL, so it must not be revoked.
export const makeExistingMediaItem = (
  record: {
    id?: number | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
    displayOrder?: number | null;
    active?: boolean | null;
  },
  baseUrl: string,
): MediaItem => ({
  uid: `existing-${record.id}-${Math.random().toString(36).slice(2)}`,
  id: record.id ?? null,
  file: null,
  fileName:
    record.mediaUrl
      ?.split('/')
      .pop()
      ?.replace(/^[a-f0-9-]{36}_/i, '') || 'file',
  previewUrl: baseUrl
    ? `${baseUrl}${record.mediaUrl ?? ''}`
    : ResolveImage(record.mediaUrl),
  mediaType: (record.mediaType ?? 'file').toLowerCase(),
  active: record.active !== false,
  isExisting: true,
});

// Only revoke blob: URLs created for newly picked files — existing items'
// previewUrl points at a real server file and must be left alone.
export const revokeMediaItems = (items: MediaItem[]) =>
  items.forEach((m) => {
    if (!m.isExisting) URL.revokeObjectURL(m.previewUrl);
  });

const imageExtensions =
  'jpg jpeg jfif png gif webp bmp tif tiff heic heif avif ico'.split(' ');
const videoExtensions = 'mp4 m4v mov webm avi mkv mpeg mpg wmv 3gp ogv'.split(' ');
const documentExtensions =
  'sql pdf xsl xslt txt log md rtf csv tsv json xml yaml yml doc docx xls xlsx ppt pptx odt ods odp zip 7z rar gz tar mp3 wav ogg m4a aac flac'.split(
    ' ',
  );
const ticketExtensions = [...imageExtensions, ...videoExtensions, ...documentExtensions];
const ticketAccept = ticketExtensions.map((extension) => '.' + extension).join(',');

function validateTicketFile(file: File) {
  const extension = file.name.match(/\.([^.]+)$/)?.[1].toLowerCase();
  if (!extension || !ticketExtensions.includes(extension)) {
    return file.name + ' is not a supported attachment.';
  }
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    return file.name + ' must be between 1 byte and 5 MB.';
  }
}

interface MediaManagerProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  accept?: string;
  ticketAttachments?: boolean;
  maxFiles?: number;
  onError?: (msg: string) => void;
}

// Grid of media slots — each can be reordered (sets displayOrder),
// toggled active/inactive, or removed. Only active items are uploaded/kept,
// in their current on-screen order. Already-uploaded (existing) items are
// never deleted outright — removing one just marks it inactive, same as
// everywhere else in the app; only unsaved new picks are dropped entirely.
export function MediaManager({
  value,
  onChange,
  ticketAttachments = false,
  accept = 'image/*,video/*,application/pdf',
  maxFiles = 10,
  onError,
}: MediaManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [replacingUid, setReplacingUid] = useState<string | null>(null);

  const handleAddFiles = (files: FileList | File[] | null) => {
    if (!files || !files.length) return;

    const valid = Array.from(files).filter((file) => {
      const error = ticketAttachments ? validateTicketFile(file) : undefined;
      if (error) onError?.(error);
      return !error;
    });
    if (!valid.length) return;

    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const picked = valid.slice(0, remaining);
    if (valid.length > remaining) {
      onError?.(`Only ${remaining} more file(s) allowed`);
    }

    onChange([...value, ...picked.map(makeMediaItem)]);
  };

  const handlePaste = useEffectEvent((event: ClipboardEvent) => {
    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const files = Array.from(clipboard.files);
    if (!files.length) {
      for (const item of clipboard.items) {
        if (item.kind !== 'file') continue;
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (!files.length) return;

    event.preventDefault();
    handleAddFiles(files);
  });

  useEffect(() => {
    if (!ticketAttachments) return;
    const region = containerRef.current?.closest('form') ?? containerRef.current;
    const listener = (event: Event) => handlePaste(event as ClipboardEvent);
    region?.addEventListener('paste', listener);
    return () => region?.removeEventListener('paste', listener);
  }, [ticketAttachments]);

  // Replace is only offered for not-yet-uploaded picks — an existing
  // (already-saved) item can only be toggled active/inactive or reordered.
  const handleReplace = (uid: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const error = ticketAttachments ? validateTicketFile(file) : undefined;
    if (error) {
      onError?.(error);
      return;
    }

    onChange(
      value.map((m) => {
        if (m.uid !== uid || m.isExisting) return m;
        URL.revokeObjectURL(m.previewUrl);
        return { ...makeMediaItem(file), uid: m.uid, active: m.active };
      }),
    );
  };

  const remove = (uid: string) => {
    const target = value.find((m) => m.uid === uid);
    if (!target) return;

    if (target.isExisting) {
      // Soft-remove: keep the row, just mark it inactive (consistent with
      // the active/inactive convention used across the rest of the app).
      onChange(value.map((m) => (m.uid === uid ? { ...m, active: false } : m)));
      return;
    }

    URL.revokeObjectURL(target.previewUrl);
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
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {ticketAttachments && (
        <button
          type="button"
          className={cn(buttonClass, 'h-auto w-full flex-col border-dashed p-3 whitespace-normal')}
          style={
            dragging
              ? { background: COLORS.primaryLight, borderColor: COLORS.primary }
              : undefined
          }
          onClick={() => addInputRef.current?.click()}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes('Files')) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleAddFiles(event.dataTransfer.files);
          }}
        >
          <span>Drop files here or press Ctrl+V to paste</span>
          <span>Click to browse · Maximum 5 MB per file</span>
        </button>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {value.map((item, idx) => (
          <div
            key={item.uid}
            style={{
              width: 120,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: RADIUS.md,
              background: COLORS.cardBg,
              overflow: 'hidden',
              position: 'relative',
              fontFamily: FONT.family,
              opacity: item.active ? 1 : 0.55,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                zIndex: 2,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 10,
                padding: '1px 6px',
              }}
            >
              #{idx + 1}
            </div>

            <button
              type="button"
              onClick={() => remove(item.uid)}
              title={item.isExisting ? 'Mark inactive' : 'Remove'}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                zIndex: 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>

            <div
              style={{
                height: 90,
                background: COLORS.gray50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                className={cn(buttonClass, 'flex size-20 flex-col items-center justify-center gap-1 overflow-hidden p-1 text-[11px] text-muted [&_img]:min-h-0 [&_img]:w-full [&_img]:flex-1 [&_img]:object-cover [&>span]:w-full [&>span]:truncate')}
                aria-label={
                  'Preview ' + (item.file?.name ?? item.fileName ?? 'attachment')
                }
                onClick={() => setPreviewIndex(idx)}
              >
                {item.mediaType === 'image' ? (
                  <img
                    src={item.previewUrl}
                    alt=""
                  />
                ) : (
                  <FileText
                    size={28}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>

            <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                title={item.file?.name ?? item.fileName ?? ''}
                style={{
                  fontSize: 10,
                  color: COLORS.textMuted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.file?.name ?? item.fileName ?? ''}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                    title="Move earlier"
                    style={iconBtnStyle(idx === 0)}
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === value.length - 1}
                    onClick={() => move(idx, 1)}
                    title="Move later"
                    style={iconBtnStyle(idx === value.length - 1)}
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>

                {!item.isExisting && (
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
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 10, color: COLORS.textSecondary }}>
                  {item.active ? 'Active' : 'Inactive'}
                </span>
                <SwitchInput
                  value={item.active ? 'Y' : 'N'}
                  onChange={(v) => toggleActive(item.uid, v === 'Y')}
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
            width: 120,
            height: 152,
            border: `1px dashed ${COLORS.cardBorder}`,
            borderRadius: RADIUS.md,
            background: COLORS.gray50,
            color: COLORS.textMuted,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            cursor: 'pointer',
            fontFamily: FONT.family,
            fontSize: 11,
          }}
        >
          <Plus size={18} />
          Choose files
        </button>
      </div>

      <input
        ref={addInputRef}
        type="file"
        multiple
        accept={ticketAttachments ? ticketAccept : accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          handleAddFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <input
        ref={replaceInputRef}
        type="file"
        accept={ticketAttachments ? ticketAccept : accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (replacingUid) handleReplace(replacingUid, e.target.files);
          setReplacingUid(null);
          e.target.value = '';
        }}
      />
      {previewIndex !== null && (
        <MediaLightbox
          items={value.map((item) => ({
            mediaUrl: item.previewUrl,
            mediaType: item.mediaType,
            fileName: item.file?.name ?? item.fileName,
          }))}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
}

function iconBtnStyle(disabled: boolean): CSSProperties {
  return {
    width: 20,
    height: 20,
    borderRadius: 4,
    border: `1px solid ${COLORS.cardBorder}`,
    background: COLORS.cardBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    color: COLORS.textSecondary,
  };
}
