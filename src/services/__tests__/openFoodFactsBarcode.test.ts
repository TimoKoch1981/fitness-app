/**
 * Open Food Facts Barcode Lookup Service — Tests
 *
 * Tests: Success lookup, product not found, network error, response mapping,
 *        empty barcode, serving size parsing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lookupBarcode, type BarcodeProduct } from '../openFoodFactsBarcode';

// ── Mock fetch globally ──────────────────────────────────────────────

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Helpers ──────────────────────────────────────────────────────────

function mockOkResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  };
}

function mockErrorResponse(status: number, statusText: string) {
  return {
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({}),
  };
}

// ── Sample API Response ──────────────────────────────────────────────

const SAMPLE_PRODUCT_RESPONSE = {
  status: 1,
  status_verbose: 'product found',
  code: '4005500258292',
  product: {
    product_name: 'Nutella',
    product_name_de: 'Nutella Nuss-Nougat-Creme',
    brands: 'Ferrero',
    nutriments: {
      'energy-kcal_100g': 539,
      proteins_100g: 6.3,
      carbohydrates_100g: 57.5,
      fat_100g: 30.9,
      fiber_100g: 3.4,
    },
    serving_size: '15 g',
    serving_quantity: 15,
    image_front_small_url: 'https://images.openfoodfacts.org/images/products/400/550/025/8292/front_de.3.200.jpg',
  },
};

// ── Tests ────────────────────────────────────────────────────────────

describe('lookupBarcode', () => {
  it('returns mapped product on success', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(SAMPLE_PRODUCT_RESPONSE));

    const result = await lookupBarcode('4005500258292');

    expect(result).not.toBeNull();
    const product = result as BarcodeProduct;
    expect(product.name).toBe('Nutella Nuss-Nougat-Creme');
    expect(product.brand).toBe('Ferrero');
    expect(product.calories).toBe(539);
    expect(product.protein).toBe(6.3);
    expect(product.carbs).toBe(57.5);
    expect(product.fat).toBe(30.9);
    expect(product.fiber).toBe(3.4);
    expect(product.serving_size_g).toBe(15);
    expect(product.barcode).toBe('4005500258292');
    expect(product.image_url).toBe(
      'https://images.openfoodfacts.org/images/products/400/550/025/8292/front_de.3.200.jpg'
    );
  });

  it('returns null when product is not found (status 0)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 0,
        status_verbose: 'product not found',
        code: '0000000000000',
      })
    );

    const result = await lookupBarcode('0000000000000');
    expect(result).toBeNull();
  });

  it('returns null when product has no name', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        status_verbose: 'product found',
        code: '1234567890123',
        product: {
          product_name: '',
          nutriments: { 'energy-kcal_100g': 100 },
        },
      })
    );

    const result = await lookupBarcode('1234567890123');
    expect(result).toBeNull();
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(lookupBarcode('4005500258292')).rejects.toThrow('Network error');
  });

  it('throws on non-OK HTTP response', async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse(500, 'Internal Server Error'));

    await expect(lookupBarcode('4005500258292')).rejects.toThrow(
      'Open Food Facts API error: 500 Internal Server Error'
    );
  });

  it('returns null for empty barcode string', async () => {
    const result = await lookupBarcode('');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null for whitespace-only barcode', async () => {
    const result = await lookupBarcode('   ');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('prefers German product name over generic', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        code: '123',
        product: {
          product_name: 'Hazelnut Spread',
          product_name_de: 'Haselnussaufstrich',
          nutriments: { 'energy-kcal_100g': 500 },
        },
      })
    );

    const result = await lookupBarcode('123');
    expect(result?.name).toBe('Haselnussaufstrich');
  });

  it('falls back to generic name when no German name', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        code: '123',
        product: {
          product_name: 'Hazelnut Spread',
          nutriments: { 'energy-kcal_100g': 500 },
        },
      })
    );

    const result = await lookupBarcode('123');
    expect(result?.name).toBe('Hazelnut Spread');
  });

  it('handles missing nutriments gracefully', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        code: '123',
        product: {
          product_name: 'Mystery Food',
        },
      })
    );

    const result = await lookupBarcode('123');
    expect(result).not.toBeNull();
    expect(result!.calories).toBe(0);
    expect(result!.protein).toBe(0);
    expect(result!.carbs).toBe(0);
    expect(result!.fat).toBe(0);
    expect(result!.fiber).toBe(0);
  });

  it('defaults serving size to 100g when not provided', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        code: '123',
        product: {
          product_name: 'Test',
          nutriments: { 'energy-kcal_100g': 200 },
        },
      })
    );

    const result = await lookupBarcode('123');
    expect(result!.serving_size_g).toBe(100);
  });

  it('parses serving size from string', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        code: '123',
        product: {
          product_name: 'Test',
          serving_size: '30 g',
          nutriments: { 'energy-kcal_100g': 200 },
        },
      })
    );

    const result = await lookupBarcode('123');
    expect(result!.serving_size_g).toBe(30);
  });

  it('uses serving_quantity when available', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        code: '123',
        product: {
          product_name: 'Test',
          serving_size: '1 bar',
          serving_quantity: 40,
          nutriments: { 'energy-kcal_100g': 200 },
        },
      })
    );

    const result = await lookupBarcode('123');
    expect(result!.serving_size_g).toBe(40);
  });

  it('falls back to null image_url when no images', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        code: '123',
        product: {
          product_name: 'Test',
          nutriments: { 'energy-kcal_100g': 200 },
        },
      })
    );

    const result = await lookupBarcode('123');
    expect(result!.image_url).toBeNull();
  });

  it('encodes barcode in URL', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ status: 0, code: 'test' })
    );

    await lookupBarcode('4005500258292');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://world.openfoodfacts.org/api/v2/product/4005500258292.json',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('FitBuddy'),
        }),
      })
    );
  });

  it('rounds nutriment values correctly', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        status: 1,
        code: '123',
        product: {
          product_name: 'Precision Test',
          nutriments: {
            'energy-kcal_100g': 123.456,
            proteins_100g: 4.567,
            carbohydrates_100g: 20.123,
            fat_100g: 8.999,
            fiber_100g: 2.345,
          },
        },
      })
    );

    const result = await lookupBarcode('123');
    expect(result!.calories).toBe(123);   // Math.round
    expect(result!.protein).toBe(4.6);    // 1 decimal
    expect(result!.carbs).toBe(20.1);     // 1 decimal
    expect(result!.fat).toBe(9);          // 1 decimal
    expect(result!.fiber).toBe(2.3);      // 1 decimal
  });
});
