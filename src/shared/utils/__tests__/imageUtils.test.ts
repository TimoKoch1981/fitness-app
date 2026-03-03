/**
 * Tests for imageUtils — Supabase URL generation, srcset, compression,
 * dimensions, and file size formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSupabaseImageUrl,
  generateSrcSet,
  compressImage,
  getImageDimensions,
  formatFileSize,
  RESPONSIVE_WIDTHS,
  THUMBNAIL_WIDTHS,
} from '../imageUtils';

// ── getSupabaseImageUrl ──────────────────────────────────────────────────

describe('getSupabaseImageUrl', () => {
  const baseUrl = 'https://fudda.de/storage/v1/object/public/posing-photos/user1/photo.webp';

  it('returns the original URL when no options are provided', () => {
    expect(getSupabaseImageUrl(baseUrl)).toBe(baseUrl);
  });

  it('returns the original URL when options is an empty object', () => {
    expect(getSupabaseImageUrl(baseUrl, {})).toBe(baseUrl);
  });

  it('appends width parameter', () => {
    const result = getSupabaseImageUrl(baseUrl, { width: 400 });
    const url = new URL(result);
    expect(url.searchParams.get('width')).toBe('400');
  });

  it('appends height parameter', () => {
    const result = getSupabaseImageUrl(baseUrl, { height: 300 });
    const url = new URL(result);
    expect(url.searchParams.get('height')).toBe('300');
  });

  it('appends multiple parameters', () => {
    const result = getSupabaseImageUrl(baseUrl, {
      width: 640,
      height: 480,
      resize: 'cover',
      quality: 80,
      format: 'webp',
    });
    const url = new URL(result);
    expect(url.searchParams.get('width')).toBe('640');
    expect(url.searchParams.get('height')).toBe('480');
    expect(url.searchParams.get('resize')).toBe('cover');
    expect(url.searchParams.get('quality')).toBe('80');
    expect(url.searchParams.get('format')).toBe('webp');
  });

  it('preserves existing query parameters in the base URL', () => {
    const urlWithParams = baseUrl + '?t=1234567890';
    const result = getSupabaseImageUrl(urlWithParams, { width: 320 });
    const url = new URL(result);
    expect(url.searchParams.get('t')).toBe('1234567890');
    expect(url.searchParams.get('width')).toBe('320');
  });
});

// ── generateSrcSet ───────────────────────────────────────────────────────

describe('generateSrcSet', () => {
  const baseUrl = 'https://fudda.de/storage/v1/object/public/posing-photos/user1/photo.webp';

  it('generates srcset with multiple widths', () => {
    const result = generateSrcSet(baseUrl, [320, 640, 960]);
    expect(result).toContain('320w');
    expect(result).toContain('640w');
    expect(result).toContain('960w');
    // Should have 2 commas for 3 entries
    expect(result.split(',').length).toBe(3);
  });

  it('returns empty string for empty widths array', () => {
    expect(generateSrcSet(baseUrl, [])).toBe('');
  });

  it('returns empty string for empty base URL', () => {
    expect(generateSrcSet('', [320, 640])).toBe('');
  });

  it('includes width query param in each srcset entry', () => {
    const result = generateSrcSet(baseUrl, [320]);
    expect(result).toContain('width=320');
    expect(result).toContain('320w');
  });
});

// ── formatFileSize ───────────────────────────────────────────────────────

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(340 * 1024)).toBe('340.0 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe('2.4 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  it('handles negative values', () => {
    expect(formatFileSize(-1)).toBe('0 B');
    expect(formatFileSize(-1024)).toBe('0 B');
  });
});

// ── compressImage input validation ───────────────────────────────────────

describe('compressImage', () => {
  it('rejects non-image files', async () => {
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await expect(compressImage(textFile)).rejects.toThrow('Invalid input: expected an image file');
  });

  it('rejects when file is null-ish', async () => {
    await expect(compressImage(null as unknown as File)).rejects.toThrow(
      'Invalid input: expected an image file',
    );
  });

  it('rejects invalid dimensions (zero width)', async () => {
    const imageFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressImage(imageFile, { maxWidth: 0 })).rejects.toThrow(
      'Invalid dimensions',
    );
  });

  it('rejects invalid dimensions (negative height)', async () => {
    const imageFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressImage(imageFile, { maxHeight: -100 })).rejects.toThrow(
      'Invalid dimensions',
    );
  });

  it('rejects invalid quality (> 1)', async () => {
    const imageFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressImage(imageFile, { quality: 1.5 })).rejects.toThrow(
      'Invalid quality',
    );
  });

  it('rejects invalid quality (< 0)', async () => {
    const imageFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressImage(imageFile, { quality: -0.5 })).rejects.toThrow(
      'Invalid quality',
    );
  });
});

// ── getImageDimensions input validation ──────────────────────────────────

describe('getImageDimensions', () => {
  it('rejects non-image files', async () => {
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await expect(getImageDimensions(textFile)).rejects.toThrow(
      'Invalid input: expected an image file',
    );
  });

  it('rejects null input', async () => {
    await expect(getImageDimensions(null as unknown as File)).rejects.toThrow(
      'Invalid input: expected an image file',
    );
  });
});

// ── Constants ────────────────────────────────────────────────────────────

describe('constants', () => {
  it('RESPONSIVE_WIDTHS contains standard breakpoints', () => {
    expect(RESPONSIVE_WIDTHS).toEqual([320, 640, 960, 1280, 1920]);
  });

  it('THUMBNAIL_WIDTHS contains smaller sizes', () => {
    expect(THUMBNAIL_WIDTHS).toEqual([160, 320, 480]);
  });
});
