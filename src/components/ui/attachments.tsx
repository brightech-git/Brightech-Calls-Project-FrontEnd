'use client';

import {
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  attachmentName,
  attachmentUrl,
  type LightboxItem,
} from '@/src/components/ui/MediaLightbox';

export type FileKind =
  | 'image'
  | 'video'
  | 'pdf'
  | 'sheet'
  | 'doc'
  | 'slides'
  | 'archive'
  | 'audio'
  | 'code'
  | 'file';

const EXT: Record<Exclude<FileKind, 'file'>, string[]> = {
  image: 'jpg jpeg jfif png gif webp bmp tif tiff heic heif avif ico svg'.split(' '),
  video: 'mp4 m4v mov webm avi mkv mpeg mpg wmv 3gp ogv'.split(' '),
  pdf: ['pdf'],
  sheet: 'xls xlsx xlsm csv tsv ods'.split(' '),
  doc: 'doc docx odt rtf txt md log'.split(' '),
  slides: 'ppt pptx odp key'.split(' '),
  archive: 'zip 7z rar gz tar'.split(' '),
  audio: 'mp3 wav ogg m4a aac flac'.split(' '),
  code: 'sql json xml yaml yml xsl xslt html css js ts'.split(' '),
};

export const FILE_KINDS: Record<
  FileKind,
  { label: string; icon: LucideIcon; tone: string }
> = {
  image: { label: 'Image', icon: FileImage, tone: 'bg-violet-50 text-violet-700' },
  video: { label: 'Video', icon: FileVideo, tone: 'bg-fuchsia-50 text-fuchsia-700' },
  pdf: { label: 'PDF', icon: FileText, tone: 'bg-rose-50 text-rose-700' },
  sheet: {
    label: 'Spreadsheet',
    icon: FileSpreadsheet,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  doc: { label: 'Document', icon: FileText, tone: 'bg-blue-50 text-blue-700' },
  slides: { label: 'Slides', icon: Presentation, tone: 'bg-orange-50 text-orange-700' },
  archive: { label: 'Archive', icon: FileArchive, tone: 'bg-amber-50 text-amber-700' },
  audio: { label: 'Audio', icon: FileAudio, tone: 'bg-cyan-50 text-cyan-700' },
  code: { label: 'Data', icon: FileCode, tone: 'bg-slate-100 text-slate-700' },
  file: { label: 'File', icon: File, tone: 'bg-gray-100 text-ink' },
};

export const extensionOf = (name?: string | null) =>
  name
    ?.split(/[?#]/)[0]
    .match(/\.([^./]+)$/)?.[1]
    ?.toLowerCase() ?? '';

/** Works out what kind of file this is from its name, falling back to the stored media type. */
export function fileKindOf(name?: string | null, mediaType?: string | null): FileKind {
  const ext = extensionOf(name);
  for (const [kind, list] of Object.entries(EXT)) {
    if (list.includes(ext)) return kind as FileKind;
  }
  const type = (mediaType ?? '').toLowerCase();
  if (type.startsWith('image')) return 'image';
  if (type.startsWith('video')) return 'video';
  if (type.includes('pdf')) return 'pdf';
  return 'file';
}

export const formatBytes = (bytes?: number | null) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/** A coloured file-type badge: image thumbnail for pictures, an icon and extension otherwise. */
export function FileThumb({
  kind,
  src,
  ext,
  className,
}: {
  kind: FileKind;
  src?: string;
  ext?: string;
  className?: string;
}) {
  const meta = FILE_KINDS[kind];
  const Icon = meta.icon;
  if (kind === 'image' && src)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn('size-full object-cover', className)}
      />
    );
  return (
    <span
      className={cn(
        'grid size-full place-items-center content-center gap-0.5',
        meta.tone,
        className,
      )}
    >
      <Icon
        size={22}
        aria-hidden
      />
      {ext && (
        <span className="text-[10px] font-bold tracking-wide uppercase">{ext}</span>
      )}
    </span>
  );
}

/**
 * Uploaded files as a tidy grid of cards: preview, name, type, and a download
 * link. Works for images, PDF, Excel, Word, video and any other file.
 */
export function AttachmentList({
  items,
  onOpen,
  emptyText,
  className,
}: {
  items: (LightboxItem & { active?: boolean | null; source?: string })[];
  onOpen: (index: number) => void;
  emptyText?: string;
  className?: string;
}) {
  if (!items.length)
    return emptyText ? <p className="text-xs text-muted">{emptyText}</p> : null;
  return (
    <ul
      className={cn(
        'grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2',
        className,
      )}
    >
      {items.map((item, index) => {
        const name = attachmentName(item);
        const kind = fileKindOf(name, item.mediaType);
        const url = attachmentUrl(item);
        return (
          <li
            key={`${item.mediaUrl}-${index}`}
            className={cn(
              'group flex min-w-0 items-center gap-2.5 rounded-lg border border-line bg-white p-2 transition-colors hover:border-line-strong hover:bg-gray-50',
              item.active === false && 'opacity-60',
            )}
          >
            <button
              type="button"
              onClick={() => onOpen(index)}
              aria-label={`Preview ${name}`}
              className="size-12 shrink-0 overflow-hidden rounded-md border border-line"
            >
              <FileThumb
                kind={kind}
                src={url}
                ext={extensionOf(name)}
              />
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onOpen(index)}
                title={name}
                className="block w-full truncate text-left text-[13px] font-medium text-ink hover:text-brand"
              >
                {name}
              </button>
              <p className="truncate text-[11px] text-muted">
                {FILE_KINDS[kind].label}
                {item.source ? ` · ${item.source}` : ''}
                {item.active === false ? ' · Inactive' : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-0.5">
              <a
                href={url}
                download={name}
                target="_blank"
                rel="noreferrer"
                title="Download"
                aria-label={`Download ${name}`}
                className="grid size-7 place-items-center rounded-md text-muted hover:bg-white hover:text-ink"
              >
                <Download size={14} />
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
