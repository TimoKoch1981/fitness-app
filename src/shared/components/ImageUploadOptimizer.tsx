/**
 * ImageUploadOptimizer — Wrapper component for file inputs that
 * auto-compresses images before upload.
 *
 * Features:
 * - Client-side compression (Canvas API) before upload
 * - Configurable max width and JPEG quality
 * - Shows compression stats ("2.4 MB -> 340 KB")
 * - Progress indicator during compression
 * - Renders children (trigger button) or a default upload area
 */

import { useState, useRef, useCallback } from 'react';
import { Loader2, CheckCircle, ImageIcon } from 'lucide-react';
import {
  compressImage,
  formatFileSize,
  type CompressImageOptions,
  type CompressImageResult,
} from '../utils/imageUtils';

export interface ImageUploadOptimizerProps {
  /** Called with the compressed image blob and metadata */
  onCompressed: (result: CompressImageResult & { file: File }) => void;
  /** Called on compression error */
  onError?: (error: Error) => void;
  /** Max width for photos (default: 1920) */
  maxWidth?: number;
  /** Max height for photos (default: 1920) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.8) */
  quality?: number;
  /** Output format (default: 'image/jpeg') */
  format?: CompressImageOptions['format'];
  /** Accept attribute for file input (default: 'image/*') */
  accept?: string;
  /** Whether to allow camera capture */
  capture?: boolean;
  /** Whether compression is disabled (pass through original) */
  disabled?: boolean;
  /** Custom trigger element (renders inside a clickable wrapper) */
  children?: React.ReactNode;
  /** Additional class name for the wrapper */
  className?: string;
}

export function ImageUploadOptimizer({
  onCompressed,
  onError,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8,
  format = 'image/jpeg',
  accept = 'image/*',
  capture = false,
  disabled = false,
  children,
  className = '',
}: ImageUploadOptimizerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [stats, setStats] = useState<{ original: string; compressed: string } | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';

      setIsCompressing(true);
      setStats(null);

      try {
        const result = await compressImage(file, {
          maxWidth,
          maxHeight,
          quality,
          format,
        });

        setStats({
          original: formatFileSize(result.originalSize),
          compressed: formatFileSize(result.compressedSize),
        });

        // Create a new File from the compressed blob
        const extension = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
        const compressedFile = new File(
          [result.blob],
          file.name.replace(/\.[^.]+$/, `.${extension}`),
          { type: format },
        );

        onCompressed({ ...result, file: compressedFile });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Compression failed');
        onError?.(error);
      } finally {
        setIsCompressing(false);
      }
    },
    [maxWidth, maxHeight, quality, format, onCompressed, onError],
  );

  const triggerFileSelect = useCallback(() => {
    if (!disabled && !isCompressing) {
      fileInputRef.current?.click();
    }
  }, [disabled, isCompressing]);

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        capture={capture ? 'environment' : undefined}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isCompressing}
      />

      {/* Trigger area */}
      <div
        onClick={triggerFileSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerFileSelect();
          }
        }}
        className={disabled || isCompressing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      >
        {children ?? (
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500 text-sm hover:bg-gray-100 transition-colors">
            <ImageIcon className="h-5 w-5" />
            <span>Select image</span>
          </div>
        )}
      </div>

      {/* Compression progress */}
      {isCompressing && (
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />
          <span>Compressing image...</span>
        </div>
      )}

      {/* Compression stats */}
      {stats && !isCompressing && (
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span>
            {stats.original} &rarr; {stats.compressed}
          </span>
        </div>
      )}
    </div>
  );
}
