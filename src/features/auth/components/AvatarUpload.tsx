/**
 * AvatarUpload — Circular avatar with camera overlay for uploading profile pictures.
 *
 * Features:
 * - Gradient circle with User icon when no avatar
 * - Displays current avatar with cache-busted URL
 * - Camera icon bottom-right to trigger file input
 * - Upload progress indicator (spinner overlay)
 * - Delete button when avatar exists
 * - Client-side compression via useUploadAvatar hook
 */

import { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, User, Loader2 } from 'lucide-react';
import { useUploadAvatar, useDeleteAvatar } from '../hooks/useAvatar';
import { useTranslation } from '../../../i18n';

interface AvatarUploadProps {
  avatarUrl?: string | null;
  displayName?: string;
}

export function AvatarUpload({ avatarUrl, displayName }: AvatarUploadProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const prevAvatarUrlRef = useRef(avatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const isUploading = uploadAvatar.isPending;
  const isDeleting = deleteAvatar.isPending;
  const isBusy = isUploading || isDeleting;

  const currentImage = previewUrl ?? avatarUrl;

  // Clear preview only when the server avatar URL has actually CHANGED to a new value.
  // This prevents clearing the preview on re-renders where avatarUrl hasn't changed.
  useEffect(() => {
    if (previewUrl && avatarUrl && avatarUrl !== prevAvatarUrlRef.current) {
      // Server has delivered a NEW URL → safe to drop the local preview
      setPreviewUrl(null);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    }
    prevAvatarUrlRef.current = avatarUrl;
  }, [avatarUrl, previewUrl]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant preview
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);

    try {
      await uploadAvatar.mutateAsync(file);
      // Preview stays visible until useEffect detects new avatarUrl from server
    } catch {
      // Revert preview on error
      setPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
      previewObjectUrlRef.current = null;
    } finally {
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAvatar.mutateAsync();
    } catch {
      // Error is handled by mutation
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar Circle */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg">
          {currentImage ? (
            <img
              src={currentImage}
              alt={displayName ?? 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
          )}

          {/* Loading overlay */}
          {isBusy && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Camera button (bottom-right) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-teal-600 transition-colors disabled:opacity-50"
        >
          <Camera className="h-3.5 w-3.5 text-white" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Delete button (only when avatar exists) */}
      {avatarUrl && !isBusy && (
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          {isDE ? 'Bild entfernen' : 'Remove photo'}
        </button>
      )}
    </div>
  );
}
