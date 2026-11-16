'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { ResolveImage } from '@/utils/format/resolveImage';

export interface LightboxItem {
  mediaUrl?: string | null;
  mediaType?: string | null;
  fileName?: string;
}

export function attachmentName(item: LightboxItem) {
  return (
    item.fileName ||
    item.mediaUrl
      ?.split(/[?#]/)[0]
      .split('/')
      .pop()
      ?.replace(/^[a-f0-9-]{36}_/i, '') ||
    'Attachment'
  );
}

function attachmentUrl(item: LightboxItem) {
  return item.mediaUrl?.startsWith('blob:') ? item.mediaUrl : ResolveImage(item.mediaUrl);
}

export function AttachmentTile({
  item,
  onOpen,
}: {
  item: LightboxItem;
  onOpen: () => void;
}) {
  const name = attachmentName(item);
  const type = item.mediaType?.toUpperCase();
  return (
    <button
      type="button"
      className="attachment-tile"
      onClick={onOpen}
      title={name}
      aria-label={'Preview ' + name}
    >
      {type === 'IMAGE' ? (
        <img
          src={attachmentUrl(item)}
          alt=""
        />
      ) : (
        <FileText
          size={24}
          aria-hidden="true"
        />
      )}
      <span>{name}</span>
    </button>
  );
}

type Preview =
  { kind: 'text' | 'document'; content: string } | { kind: 'pdf'; url: string };

async function readDocument(response: Response, extension: string) {
  const { unzipSync, strFromU8 } = await import('fflate');
  const path = extension === 'docx' ? 'word/document.xml' : 'content.xml';
  const files = unzipSync(new Uint8Array(await response.arrayBuffer()), {
    filter: (file) => file.name === path && file.originalSize <= 10 * 1024 * 1024,
  });
  if (!files[path]) throw new Error('Document content is unavailable.');
  const document = new DOMParser().parseFromString(
    strFromU8(files[path]),
    'application/xml',
  );
  if (document.querySelector('parsererror'))
    throw new Error('Document content could not be read.');
  const tags = extension === 'docx' ? ['p'] : ['p', 'h'];
  const paragraphs = Array.from(document.getElementsByTagName('*')).filter((element) =>
    tags.includes(element.localName),
  );
  return paragraphs.map((paragraph) => paragraph.textContent ?? '').join('\n\n');
}

function FilePreview({ url, extension }: { url: string; extension: string }) {
  const [preview, setPreview] = useState<Preview>();
  const [failed, setFailed] = useState(false);
  const document = ['docx', 'odt'].includes(extension);
  const pdf = extension === 'pdf';
  const supported =
    document ||
    pdf ||
    [
      'sql',
      'txt',
      'log',
      'md',
      'csv',
      'tsv',
      'json',
      'xml',
      'xsl',
      'xslt',
      'yaml',
      'yml',
    ].includes(extension);

  useEffect(() => {
    if (!supported || !url) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;

    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Attachment could not be loaded.');
        if (pdf) {
          const bytes = await response.arrayBuffer();
          const signature = new TextDecoder().decode(bytes.slice(0, 5));
          if (signature !== '%PDF-') throw new Error('Invalid PDF.');
          if (controller.signal.aborted) return;
          objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
          setPreview({ kind: 'pdf', url: objectUrl });
          return;
        }
        const content = document
          ? await readDocument(response, extension)
          : await response.text();
        if (!controller.signal.aborted)
          setPreview({ kind: document ? 'document' : 'text', content });
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }

    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, extension, supported, document, pdf]);

  if (!supported || !url)
    return <p>Preview is unavailable for this file type. Use Open original.</p>;
  if (failed)
    return (
      <p role="alert">
        Couldn’t load the preview. Use Open original to view or download the file.
      </p>
    );
  if (!preview) return <p role="status">Loading preview…</p>;
  if (preview.kind === 'pdf')
    return (
      <iframe
        className="attachment-pdf"
        src={preview.url}
        title="PDF preview"
      />
    );
  return (
    <pre
      className={preview.kind === 'document' ? 'attachment-document' : 'attachment-text'}
    >
      {preview.content || 'This file is empty.'}
    </pre>
  );
}

interface MediaLightboxProps {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: MediaLightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const item = items[index];
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  if (!item) return null;
  const count = items.length;
  const name = attachmentName(item);
  const url = attachmentUrl(item);
  const type = item.mediaType?.toUpperCase();
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  return (
    <dialog
      ref={dialog}
      className="attachment-dialog"
      aria-label={name}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.stopPropagation();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="attachment-dialog-header">
        <strong>{name}</strong>
        <button
          type="button"
          className="button"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="attachment-preview"
        key={index}
        tabIndex={0}
        aria-label="Scrollable attachment preview"
      >
        {type === 'IMAGE' ? (
          <img
            src={url}
            alt={name}
          />
        ) : type === 'VIDEO' ? (
          <video
            src={url}
            controls
          />
        ) : (
          <FilePreview
            key={url}
            url={url}
            extension={extension}
          />
        )}
      </div>
      <div className="attachment-dialog-footer">
        {url && (
          <a
            className="button"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open original
          </a>
        )}
        {count > 1 && (
          <>
            <button
              type="button"
              className="button"
              aria-label="Previous attachment"
              onClick={() => onIndexChange((index - 1 + count) % count)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {index + 1} / {count}
            </span>
            <button
              type="button"
              className="button"
              aria-label="Next attachment"
              onClick={() => onIndexChange((index + 1) % count)}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
