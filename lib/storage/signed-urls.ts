import type { SupabaseClient } from '@supabase/supabase-js';

const isAbsoluteHttpUrl = (value: string) =>
  value.startsWith('http://') || value.startsWith('https://');

const decodePathSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Normalize a storage object reference into a bucket-relative path.
 * Supports:
 * - raw paths: "folder/file.pdf"
 * - prefixed paths: "reports/folder/file.pdf"
 * - legacy public/signed URLs
 */
export const extractStoragePath = (
  reference: string | null | undefined,
  bucket: string
): string | null => {
  const trimmed = (reference || '').trim();
  if (!trimmed) return null;

  if (!isAbsoluteHttpUrl(trimmed)) {
    const withoutLeadingSlash = trimmed.replace(/^\/+/, '');
    if (withoutLeadingSlash.startsWith(`${bucket}/`)) {
      return withoutLeadingSlash.slice(bucket.length + 1);
    }
    return withoutLeadingSlash;
  }

  try {
    const url = new URL(trimmed);
    const path = url.pathname;
    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ];

    for (const marker of markers) {
      const index = path.indexOf(marker);
      if (index >= 0) {
        return decodePathSegment(path.slice(index + marker.length));
      }
    }

    const fallbackMarker = `/${bucket}/`;
    const fallbackIndex = path.lastIndexOf(fallbackMarker);
    if (fallbackIndex >= 0) {
      return decodePathSegment(path.slice(fallbackIndex + fallbackMarker.length));
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

export const createSignedStorageUrl = async (
  supabase: SupabaseClient,
  bucket: string,
  reference: string | null | undefined,
  expiresInSeconds: number = 900
): Promise<string | null> => {
  const objectPath = extractStoragePath(reference, bucket);
  if (!objectPath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error) {
    console.error(`Failed to create signed URL for bucket "${bucket}" and path "${objectPath}"`, error);
    return null;
  }

  return data?.signedUrl || null;
};
