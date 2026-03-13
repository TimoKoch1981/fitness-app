/**
 * useRecipeImage — Upload recipe photos to Supabase Storage.
 * Images stored in recipe-images/{userId}/{recipeId}.webp
 * Uses WebP compression for optimal size.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';

const BUCKET = 'recipe-images';
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 1200;

/** Compress image to WebP via canvas */
async function compressToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if too large
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          resolve(blob);
        },
        'image/webp',
        0.82
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

export function useRecipeImage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File, recipeId: string): Promise<string | null> => {
      if (!user?.id) return null;

      setError(null);
      setUploading(true);

      try {
        // Validate file size
        if (file.size > MAX_SIZE * 2) {
          setError('Bild zu gross (max 4MB)');
          return null;
        }

        // Compress to WebP
        const webpBlob = await compressToWebP(file);

        // Check compressed size
        if (webpBlob.size > MAX_SIZE) {
          setError('Komprimiertes Bild zu gross (max 2MB)');
          return null;
        }

        const path = `${user.id}/${recipeId}.webp`;

        // Upload (upsert to overwrite existing)
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, webpBlob, {
            contentType: 'image/webp',
            upsert: true,
          });

        if (uploadError) {
          setError(uploadError.message);
          return null;
        }

        // Get public URL
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upload fehlgeschlagen';
        setError(msg);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user?.id]
  );

  const deleteImage = useCallback(
    async (recipeId: string) => {
      if (!user?.id) return;
      const path = `${user.id}/${recipeId}.webp`;
      await supabase.storage.from(BUCKET).remove([path]);
    },
    [user?.id]
  );

  return { uploadImage, deleteImage, uploading, error };
}
