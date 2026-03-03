/**
 * Open Food Facts Barcode Lookup Service
 *
 * Queries the Open Food Facts API v2 to retrieve product nutrition data
 * based on EAN-13, EAN-8, UPC-A barcodes.
 *
 * @see https://wiki.openfoodfacts.org/API/Read/Product
 */

// ── Types ────────────────────────────────────────────────────────────

/** Mapped product result from Open Food Facts */
export interface BarcodeProduct {
  name: string;
  brand: string;
  calories: number;    // kcal per 100g
  protein: number;     // g per 100g
  carbs: number;       // g per 100g
  fat: number;         // g per 100g
  fiber: number;       // g per 100g
  serving_size_g: number;
  barcode: string;
  image_url: string | null;
}

/** Raw Open Food Facts API v2 response (partial) */
interface OpenFoodFactsResponse {
  status: number;          // 1 = found, 0 = not found
  status_verbose: string;
  code: string;
  product?: {
    product_name?: string;
    product_name_de?: string;
    brands?: string;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'energy-kcal'?: number;
      proteins_100g?: number;
      proteins?: number;
      carbohydrates_100g?: number;
      carbohydrates?: number;
      fat_100g?: number;
      fat?: number;
      fiber_100g?: number;
      fiber?: number;
    };
    serving_size?: string;
    serving_quantity?: number;
    image_front_url?: string;
    image_front_small_url?: string;
    image_url?: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Parse serving size string to grams.
 * Open Food Facts returns e.g. "30 g", "250 ml", "1 piece (50g)".
 * Falls back to 100g if unparseable.
 */
function parseServingSizeG(raw?: string, quantity?: number): number {
  if (quantity && quantity > 0) return quantity;
  if (!raw) return 100;

  // Try to find a number followed by 'g' or 'ml'
  const match = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml)/i);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }

  // Try to find parenthesized grams: "(50g)"
  const parenMatch = raw.match(/\((\d+(?:[.,]\d+)?)\s*g\)/i);
  if (parenMatch) {
    return parseFloat(parenMatch[1].replace(',', '.'));
  }

  return 100;
}

// ── Main Lookup ─────────────────────────────────────────────────────

/**
 * Look up a product by barcode via Open Food Facts API v2.
 *
 * @param barcode - EAN-13, EAN-8, or UPC-A barcode string
 * @returns BarcodeProduct if found, null otherwise
 * @throws Error on network failure
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;

  const response = await fetch(url, {
    headers: {
      // Open Food Facts requests a User-Agent for API usage tracking
      'User-Agent': 'FitBuddy/1.0 (https://fudda.de)',
    },
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts API error: ${response.status} ${response.statusText}`);
  }

  const data: OpenFoodFactsResponse = await response.json();

  // Product not found
  if (data.status !== 1 || !data.product) {
    return null;
  }

  const product = data.product;
  const nutriments = product.nutriments ?? {};

  // Prefer German product name, fallback to generic
  const name = product.product_name_de || product.product_name || '';
  if (!name) return null; // No usable name → treat as not found

  return {
    name,
    brand: product.brands ?? '',
    calories: Math.round(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0),
    protein: Math.round((nutriments.proteins_100g ?? nutriments.proteins ?? 0) * 10) / 10,
    carbs: Math.round((nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0) * 10) / 10,
    fat: Math.round((nutriments.fat_100g ?? nutriments.fat ?? 0) * 10) / 10,
    fiber: Math.round((nutriments.fiber_100g ?? nutriments.fiber ?? 0) * 10) / 10,
    serving_size_g: parseServingSizeG(product.serving_size, product.serving_quantity),
    barcode: cleanBarcode,
    image_url: product.image_front_small_url ?? product.image_front_url ?? product.image_url ?? null,
  };
}
