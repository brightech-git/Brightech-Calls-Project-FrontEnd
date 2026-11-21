import { apiConfig } from '@/lib/api/config';

export function ResolveImage(path: string | null | undefined) {
  if (!path) return '';

  const base = process.env.NEXT_PUBLIC_IMAGE_URL || apiConfig.baseURL;
  try {
    const url = new URL(path, new URL(base).origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}
