/**
 * PDF Text Extractor — Uses pdfjs-dist to extract text from PDF files.
 *
 * Lazy-loads pdfjs-dist only when needed (code-split).
 * Falls back gracefully if PDF.js fails to load.
 */

/**
 * Extract text content from all pages of a PDF file.
 * Returns concatenated text from all pages, separated by newlines.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamic import — pdfjs-dist is only loaded when a PDF is actually uploaded
  const pdfjsLib = await import('pdfjs-dist');

  // Configure worker — use inline worker to avoid separate file
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText);
  }

  return pageTexts.join('\n\n');
}

/**
 * Check if extracted text has enough content to be useful.
 * Scanned PDFs with no OCR layer return very little text.
 */
export function hasUsableText(text: string): boolean {
  // At least 50 characters of non-whitespace content
  const stripped = text.replace(/\s+/g, '');
  return stripped.length > 50;
}

/**
 * Convert a PDF page to a JPEG image (base64).
 * Used as fallback for scanned PDFs without text layer.
 */
export async function pdfPageToImage(
  file: File,
  pageNumber = 1,
  maxSize = 1600,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(maxSize / viewport.width, maxSize / viewport.height, 2);
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // pdfjs-dist v5 requires 'canvas' in RenderParameters
  await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas } as Parameters<typeof page.render>[0]).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return dataUrl.split(',')[1]; // Strip data URI prefix
}
