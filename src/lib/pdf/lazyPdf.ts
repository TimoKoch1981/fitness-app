/**
 * lazyPdf — single entry point for dynamically loading the jsPDF stack.
 *
 * jsPDF + jspdf-autotable are ~822KB combined in the initial bundle if
 * statically imported. Only the Doctor Report, Recipe Import, Nutrition
 * Export, Training Plan PDF, and Workout History PDF use them — features
 * that are touched by <5% of users on <5% of sessions.
 *
 * This helper imports them on first use and caches the result. After the
 * first call (which fetches the chunk over the network), subsequent calls
 * return the cached references synchronously.
 *
 * Usage from a PDF utility:
 *   import { loadPdf } from '../../../lib/pdf/lazyPdf';
 *   export async function exportSomething(data) {
 *     const { jsPDF, autoTable } = await loadPdf();
 *     const doc = new jsPDF();
 *     autoTable(doc, { ... });
 *   }
 */

import type { jsPDF as JsPDFType } from 'jspdf';
import type autoTableType from 'jspdf-autotable';

export interface PdfStack {
  jsPDF: typeof JsPDFType;
  autoTable: typeof autoTableType;
}

let cached: PdfStack | null = null;
let inflight: Promise<PdfStack> | null = null;

/**
 * Lazily load jsPDF + jspdf-autotable. Returns the cached value on subsequent
 * calls. Safe to call from multiple places in parallel (single in-flight
 * promise dedupes the network fetch).
 */
export async function loadPdf(): Promise<PdfStack> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    // jspdf-autotable exports the autoTable function as default
    const autoTable = autoTableModule.default;
    cached = { jsPDF, autoTable };
    return cached;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
