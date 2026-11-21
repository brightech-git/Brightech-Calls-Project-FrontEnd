// ─────────────────────────────────────────────
// components/ui/MediaManager.tsx
// ─────────────────────────────────────────────
'use client';

import { cn } from '@/lib/utils';
import { buttonClass } from '@/lib/styles';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { RefreshCw, X, ChevronDown, ChevronUp, Plus, UploadCloud } from 'lucide-react';

import { ResolveImage } from '@/src/utils/format/resolveImage';
import { MediaLightbox } from '@/src/components/ui/MediaLightbox';
import {
  extensionOf,
  FILE_KINDS,
  FileThumb,
  fileKindOf,
  formatBytes,
} from '@/src/components/ui/attachments';

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

  const activeCount = value.filter((m) => m.active).length;

  return (
    <div
      ref={containerRef}
      className="grid gap-2"
    >
      <div
        role="button"
        tabIndex={-1}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line-strong bg-gray-50/60 px-3 py-3 transition-colors hover:border-brand hover:bg-brand-soft/40',
          dragging && 'border-brand bg-brand-soft',
        )}
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
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand shadow-sm ring-1 ring-line">
          <UploadCloud size={18} />
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="text-[13px] font-semibold text-ink">
            Drop files here, or <span className="text-brand underline">browse</span>
            {ticketAttachments && (
              <span className="font-normal text-muted"> · Ctrl+V to paste</span>
            )}
          </span>
          <span className="text-[11px] text-muted">
            {ticketAttachments
              ? 'Images, video, PDF, Excel, Word, PowerPoint, text and zip files · up to 5 MB each'
              : 'Images, video and PDF'}
            {` · ${value.length}/${maxFiles} added`}
          </span>
        </span>
        <button
          type="button"
          className={cn(buttonClass, 'shrink-0 max-sm:hidden')}
          onClick={(e) => {
            e.stopPropagation();
            addInputRef.current?.click();
          }}
        >
          <Plus size={13} /> Add files
        </button>
      </div>

      {value.length > 0 && (
        <ul className="grid gap-1.5">
          {value.map((item, idx) => {
            const name = item.file?.name ?? item.fileName ?? 'Attachment';
            const kind = fileKindOf(name, item.file?.type ?? item.mediaType);
            return (
              <li
                key={item.uid}
                className={cn(
                  'flex min-w-0 items-center gap-2.5 rounded-lg border border-line bg-white p-1.5 pr-2',
                  !item.active && 'bg-gray-50 opacity-60',
                )}
              >
                <span className="w-5 shrink-0 text-center text-[11px] font-semibold text-muted tabular-nums">
                  {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewIndex(idx)}
                  aria-label={`Preview ${name}`}
                  className="size-10 shrink-0 overflow-hidden rounded-md border border-line"
                >
                  <FileThumb
                    kind={kind}
                    src={item.previewUrl}
                    ext={extensionOf(name)}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(idx)}
                    title={name}
                    className="block w-full truncate text-left text-[13px] font-medium text-ink hover:text-brand"
                  >
                    {name}
                  </button>
                  <p className="truncate text-[11px] text-muted">
                    {FILE_KINDS[kind].label}
                    {item.file ? ` · ${formatBytes(item.file.size)}` : ''}
                    {item.isExisting ? ' · Uploaded' : ' · New'}
                    {!item.active ? ' · Inactive' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className={smallBtn}
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                    title="Move up"
                    aria-label="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    className={smallBtn}
                    disabled={idx === value.length - 1}
                    onClick={() => move(idx, 1)}
                    title="Move down"
                    aria-label="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                  {!item.isExisting && (
                    <button
                      type="button"
                      className={smallBtn}
                      title="Replace file"
                      aria-label="Replace file"
                      onClick={() => {
                        setReplacingUid(item.uid);
                        replaceInputRef.current?.click();
                      }}
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.active}
                    title={
                      item.active ? 'Keep (click to skip)' : 'Skipped (click to keep)'
                    }
                    aria-label={item.active ? 'Active' : 'Inactive'}
                    onClick={() => toggleActive(item.uid, !item.active)}
                    className={cn(
                      'relative mx-1 h-4 w-7 shrink-0 rounded-full transition-colors',
                      item.active ? 'bg-brand' : 'bg-gray-300',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow transition-transform',
                        item.active && 'translate-x-3',
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    className={cn(smallBtn, 'hover:bg-rose-50 hover:text-rose-600')}
                    onClick={() => remove(item.uid)}
                    title={item.isExisting ? 'Mark inactive' : 'Remove'}
                    aria-label={item.isExisting ? 'Mark inactive' : 'Remove'}
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {value.length > 0 && (
        <p className="text-[11px] text-muted">
          {activeCount} of {value.length} file{value.length === 1 ? '' : 's'} will be
          saved.
        </p>
      )}

      <input
        ref={addInputRef}
        type="file"
        multiple
        accept={ticketAttachments ? ticketAccept : accept}
        className="hidden"
        onChange={(e) => {
          handleAddFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <input
        ref={replaceInputRef}
        type="file"
        accept={ticketAttachments ? ticketAccept : accept}
        className="hidden"
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

const smallBtn =
  'grid size-7 place-items-center rounded-md text-muted hover:bg-gray-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30';
