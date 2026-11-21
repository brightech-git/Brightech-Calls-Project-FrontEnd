import type { LightboxItem } from '@/src/components/ui/MediaLightbox';
import type { CallStatusMedia, CallStatusRecord } from '../type/call-status.types';

/** One file shown in a call's file list, labelled with where it came from. */
export type CallFile = LightboxItem & { active?: boolean | null; source?: string };

/** The files attached to one status update (older rows keep a single IMAGE path). */
export function statusFiles(status: CallStatusRecord): CallStatusMedia[] {
  if (status.media && status.media.length > 0) return status.media;
  if (status.IMAGE) return [{ mediaUrl: status.IMAGE, mediaType: null, active: true }];
  return [];
}
