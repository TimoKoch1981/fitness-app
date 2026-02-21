/**
 * useAvatar — Upload & delete avatar images via Supabase Storage.
 *
 * Upload flow:
 * 1. Client-side compression (max 500×500, ≤200KB, WebP)
 * 2. Upload to `avatars/{user_id}/avatar.webp` (upsert)
 * 3. Get public URL → update profiles.avatar_url
 *
 * Delete flow:
 * 1. Remove file from Storage
 * 2. Set profiles.avatar_url = null
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../../lib/supabase';
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

// ── Upload Avatar ────────────────────────────────────────────────────────

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 2. Compress image (client-side)
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

      // 3. Upload to Storage (upsert)
      const filePath = `${user.id}/${AVATAR_FILENAME}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, compressed, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 4. Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      // Append cache-buster to force reload after update
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // 5. Update profile with avatar URL
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}

// ── Delete Avatar ────────────────────────────────────────────────────────

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}
