/**
 * Image utility functions for FitBuddy.
 *
 * Provides:
 * - Supabase Storage URL generation with transforms
 * - Responsive srcset generation
 * - Client-side image compression using Canvas API
 * - Image dimension extraction
 * - File size formatting
 */

// ── Supabase Storage URL helpers ─────────────────────────────────────────

export interface SupabaseImageOptions {
  /** Resize width (px) */
  width?: number;
  /** Resize height (px) */
  height?: number;
  /** Resize mode: 'cover' | 'contain' | 'fill' */
  resize?: 'cover' | 'contain' | 'fill';
  /** Image quality 1-100 (only for lossy formats) */
  quality?: number;
  /** Output format */
  format?: 'origin' | 'avif' | 'webp';
}

/**
 * Generate a Supabase Storage public URL with optional image transform params.
 *
 * Supabase Storage supports on-the-fly transforms via query parameters:
 * /render/image/public/<bucket>/<path>?width=400&height=300&resize=cover&quality=80
 *
 * @param bucketUrl - Full public URL to the image (from getPublicUrl)
 * @param options - Transform options (width, height, quality, etc.)
 * @returns URL string with transform query params appended
 */
export function getSupabaseImageUrl(
  bucketUrl: string,
  options?: SupabaseImageOptions,
): string {
  if (!options || Object.keys(options).length === 0) {
    return bucketUrl;
  }

  const url = new URL(bucketUrl);
  if (options.width) url.searchParams.set('width', String(options.width));
  if (options.height) url.searchParams.set('height', String(options.height));
  if (options.resize) url.searchParams.set('resize', options.resize);
  if (options.quality) url.searchParams.set('quality', String(options.quality));
  if (options.format) url.searchParams.set('format', options.format);

  return url.toString();
}

/**
 * Generate an HTML srcset string for responsive images.
 *
 * @param baseUrl - Base image URL (public Supabase Storage URL)
 * @param widths - Array of widths to generate (e.g. [320, 640, 960, 1280])
 * @returns srcset string like "url?width=320 320w, url?width=640 640w, ..."
 */
export function generateSrcSet(baseUrl: string, widths: number[]): string {
  if (!baseUrl || widths.length === 0) return '';

  return widths
    .map((w) => {
      const url = getSupabaseImageUrl(baseUrl, { width: w });
      return `${url} ${w}w`;
    })
    .join(', ');
}

// ── Client-side image compression ────────────────────────────────────────

export interface CompressImageOptions {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1920) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.8) */
  quality?: number;
  /** Output format (default: 'image/jpeg') */
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface CompressImageResult {
  /** Compressed image as a Blob */
  blob: Blob;
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed file size in bytes */
  compressedSize: number;
  /** Resulting width */
  width: number;
  /** Resulting height */
  height: number;
}

/**
 * Compress and resize an image file client-side using the Canvas API.
 *
 * - Resizes to fit within maxWidth/maxHeight (preserves aspect ratio)
 * - Re-encodes to the specified format and quality
 * - Returns the compressed Blob and metadata
 *
 * @param file - Source image File
 * @param options - Compression options
 * @returns Compressed image result
 */
export function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'image/jpeg',
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    return Promise.reject(new Error('Invalid input: expected an image file'));
  }

  if (maxWidth <= 0 || maxHeight <= 0) {
    return Promise.reject(new Error('Invalid dimensions: width and height must be positive'));
  }

  if (quality < 0 || quality > 1) {
    return Promise.reject(new Error('Invalid quality: must be between 0 and 1'));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if needed (preserve aspect ratio)
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed: toBlob returned null'));
            return;
          }
          resolve({
            blob,
            originalSize: file.size,
            compressedSize: blob.size,
            width,
            height,
          });
        },
        format,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file'));
    };

    img.src = url;
  });
}

// ── Image dimension extraction ───────────────────────────────────────────

/**
 * Get the natural dimensions of an image file.
 *
 * @param file - Image File object
 * @returns Promise resolving to { width, height }
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (!file || !file.type.startsWith('image/')) {
    return Promise.reject(new Error('Invalid input: expected an image file'));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file'));
    };

    img.src = url;
  });
}

// ── File size formatting ─────────────────────────────────────────────────

/**
 * Format a byte count into a human-readable string.
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g. "1.2 MB", "340 KB", "512 B")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const size = bytes / Math.pow(k, i);

  // Use integer for bytes, 1 decimal for KB+
  if (i === 0) return `${bytes} B`;
  return `${size.toFixed(1)} ${units[i]}`;
}

// ── Default responsive widths ────────────────────────────────────────────

/** Standard responsive breakpoint widths for srcset generation */
export const RESPONSIVE_WIDTHS = [320, 640, 960, 1280, 1920] as const;

/** Thumbnail widths for grid/list views */
export const THUMBNAIL_WIDTHS = [160, 320, 480] as const;
