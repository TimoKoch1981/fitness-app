/**
 * Share Image Generator — Converts a DOM element to a shareable image blob.
 *
 * Uses html2canvas to render a "share card" DOM node to a canvas,
 * then converts it to a PNG blob for download or Web Share API.
 */

import html2canvas from 'html2canvas';

/**
 * Render a DOM element to a PNG Blob.
 */
export async function elementToBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2, // Retina quality
    backgroundColor: null,
    useCORS: true,
    logging: false,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share via Web Share API (if supported), fallback to download.
 * Returns true if shared via Web Share, false if downloaded.
 */
export async function shareOrDownload(
  blob: Blob,
  title: string,
  text: string,
  filename: string
): Promise<boolean> {
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    } catch {
      // User cancelled or error → fallback to download
      downloadBlob(blob, filename);
      return false;
    }
  }

  // Fallback: download
  downloadBlob(blob, filename);
  return false;
}
