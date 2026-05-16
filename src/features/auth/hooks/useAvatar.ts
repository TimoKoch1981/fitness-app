/**
 * useAvatar — Upload & delete avatar images via Supabase Storage.
 *
 * Upload flow (PH6 update 2026-05-16):
 * 1. Client-side compression (max 500×500, ≤200KB, WebP)
 * 2. POST base64 to Edge Function `validate-avatar`
 *    - Function checks magic-bytes (WebP/JPEG/PNG, ablehnen sonst)
 *    - Function uploaded via service_role (umgeht spoofable Content-Type-Check)
 * 3. Update profiles.avatar_url with returned public_url (mit cache-buster)
 *
 * Delete flow:
 * 1. Remove file from Storage
 * 2. Set profiles.avatar_url = null
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../../lib/supabase';
import { withTelemetry } from '../../../lib/telemetry/actionLog';
import { PROFILE_KEY } from './useProfile';

const BUCKET = 'avatars';
const AVATAR_FILENAME = 'avatar.webp';

// ── Compression options ──────────────────────────────────────────────────

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2, // 200 KB
  maxWidthOrHeight: 500,
  useWebWorker: true,
  fileType: 'image/webp' as const,
};

// ── Helpers ──────────────────────────────────────────────────────────────

/** Convert a Blob to base64 string (without data:-prefix). */
async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

// ── Upload Avatar ────────────────────────────────────────────────────────

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withTelemetry('upload_avatar', 'ui', async (file: File) => {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 2. Compress image (client-side)
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

      // 3. PH6: Upload via Edge Function (server-magic-bytes-check)
      const fileB64 = await blobToBase64(compressed);
      const { data, error: fnError } = await supabase.functions.invoke<{
        ok: boolean;
        public_url: string;
        path: string;
        format: string;
        error?: string;
      }>('validate-avatar', {
        body: { file_b64: fileB64 },
      });

      if (fnError) {
        throw new Error(fnError.message ?? 'Avatar-Upload fehlgeschlagen');
      }
      if (!data?.ok || !data.public_url) {
        throw new Error(data?.error ?? 'Avatar-Validation fehlgeschlagen');
      }

      // 4. Cache-buster anhaengen (gleicher Pfad bei upsert)
      const publicUrl = `${data.public_url}?t=${Date.now()}`;

      // 5. Update profile with avatar URL
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      return publicUrl;
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}

// ── Delete Avatar ────────────────────────────────────────────────────────

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withTelemetry('delete_avatar', 'ui', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Remove file from Storage
      const filePath = `${user.id}/${AVATAR_FILENAME}`;
      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove([filePath]);

      if (removeError) throw removeError;

      // 2. Clear avatar_url in profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (profileError) throw profileError;
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}
