/**
 * Product Lookup — searches Open Food Facts for nutritional data.
 *
 * Two-tier approach:
 * 1. Open Food Facts API (free, DSGVO-konform, real packaging data)
 * 2. OpenAI Web Search fallback (if OFF returns nothing)
 *
 * Called when the Nutrition Agent generates ACTION:search_product.
 * Results are fed back to the agent as context for a follow-up response.
 *
 * CORS Note: Both OFF APIs lack proper CORS headers.
 * - On the Vite dev server (port 5173), requests are proxied via vite.config.ts
 * - On other ports (e.g. network access), we use direct URLs which may fail
 *   due to CORS — the OpenAI Web Search fallback covers this case.
 *
 * @see https://wiki.openfoodfacts.org/API
 */

// ── Query Cleaning ────────────────────────────────────────────────────

/** German noise words that hurt product search quality */
const NOISE_WORDS = new Set([
  'ohne', 'mit', 'und', 'oder', 'von', 'für', 'fuer',
  'zucker', 'zuckerfrei', 'zuckerzusatz',
  'fett', 'fettarm', 'fettfrei', 'fettreduziert',
  'laktosefrei', 'glutenfrei', 'vegan', 'bio',
  'light', 'zero', 'diet', 'sugar', 'free',
  'das', 'der', 'die', 'den', 'dem', 'ein', 'eine',
]);

/** Replace German umlauts with ASCII equivalents for search APIs */
function normalizeUmlauts(s: string): string {
  return s
    .replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
    .replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
    .replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss');
}

/**
 * Clean up a user query for product search:
 * - Normalize umlauts (ö→oe) for ASCII-based search APIs
 * - Remove noise words that confuse text search ("ohne Zucker" → "")
 * - Keep brand names and product types
 */
function cleanSearchQuery(raw: string): string {
  const normalized = normalizeUmlauts(raw);
  const words = normalized.split(/\s+/).filter(w => {
    const lower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    return lower.length > 1 && !NOISE_WORDS.has(lower);
  });
  // If cleaning removed everything, fall back to just the normalized query
  return words.length > 0 ? words.join(' ') : normalized;
}

// ── Resilient Fetch ───────────────────────────────────────────────────

/**
 * Resilient fetch wrapper: tries Vite proxy first (/api/off-*),
 * falls back to direct URL if proxy returns HTML (not on Vite port).
 * This allows the app to work both on localhost:5173 (proxy) and
 * other ports/devices (direct, may hit CORS but worth trying).
 */
async function fetchWithProxyFallback(
  proxyUrl: string,
  directUrl: string,
  timeoutMs: number,
): Promise<Response> {
  try {
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(timeoutMs) });
    // If proxy isn't configured (wrong port), we get an HTML 404 page back
    const ct = response.headers.get('content-type') ?? '';
    if (!response.ok || !ct.includes('json')) {
      console.warn(`[ProductLookup] Proxy returned non-JSON (${response.status}), trying direct URL...`);
      throw new Error('proxy-not-available');
    }
    return response;
  } catch (proxyErr) {
    // Proxy failed → try direct URL (may fail with CORS in browser, but works in some configs)
    console.log(`[ProductLookup] Proxy unavailable, trying direct: ${directUrl.slice(0, 80)}...`);
    return fetch(directUrl, { signal: AbortSignal.timeout(timeoutMs) });
  }
}

export interface ProductLookupResult {
  found: boolean;
  source: 'openfoodfacts' | 'websearch' | 'none';
  product?: {
    name: string;
    brand?: string;
    serving_size_g?: number;
    serving_label?: string;
    // Per 100g values
    calories_per_100g?: number;
    protein_per_100g?: number;
    carbs_per_100g?: number;
    fat_per_100g?: number;
    fiber_per_100g?: number;
    // Per serving (if available)
    calories_per_serving?: number;
    protein_per_serving?: number;
    carbs_per_serving?: number;
    fat_per_serving?: number;
    // Metadata
    image_url?: string;
    ingredients_text?: string;
    nutriscore_grade?: string;
  };
  /** Human-readable summary for the LLM */
  summary: string;
}

/**
 * Search Open Food Facts using search-a-licious API (better relevance than v1).
 * Only returns a result if the match quality is high enough (multiple query words match).
 * V1 API is skipped entirely in favor of the faster Web Search fallback.
 */
async function searchOpenFoodFacts(query: string): Promise<ProductLookupResult> {
  // search-a-licious is fast (~1-2s) and has good text search
  const salResult = await searchViaSearchALicious(query);
  if (salResult.found) return salResult;

  // Skip V1 API entirely — it's notoriously slow (10s+ timeout) and unreliable.
  // The OpenAI Web Search fallback in lookupProduct() is faster and more accurate.
  console.log(`[ProductLookup] search-a-licious found no good match, skipping V1 API`);
  return { found: false, source: 'none', summary: '' };
}

/**
 * search-a-licious API — better text search for product names.
 * Uses cleaned query (no noise words, ASCII umlauts) for better relevance.
 * @see https://search.openfoodfacts.org
 */
async function searchViaSearchALicious(query: string): Promise<ProductLookupResult> {
  try {
    const cleaned = cleanSearchQuery(query);
    console.log(`[ProductLookup] search-a-licious query: "${query}" → "${cleaned}"`);

    const encoded = encodeURIComponent(cleaned);
    const proxyUrl = `/api/off-search/search?q=${encoded}&page_size=10&langs=de`;
    const directUrl = `https://search.openfoodfacts.org/search?q=${encoded}&page_size=10&langs=de`;

    const response = await fetchWithProxyFallback(proxyUrl, directUrl, 8000);

    if (!response.ok) {
      console.warn(`[ProductLookup] search-a-licious returned ${response.status}`);
      return { found: false, source: 'none', summary: '' };
    }

    const data = await response.json();
    const hits = data.hits;

    if (!hits || hits.length === 0) {
      return { found: false, source: 'none', summary: '' };
    }

    // Find best match: score by query term overlap in product_name + brands
    // Use ORIGINAL query words (with umlauts) for scoring against product data
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !NOISE_WORDS.has(w));
    // Also include ASCII-normalized versions for matching
    const queryWordsNorm = queryWords.map(w => normalizeUmlauts(w));
    // Stems: first 4+ chars for fuzzy matching ("fruechte" → "frue", "müsli" → "müsl")
    const queryStems = queryWordsNorm.map(w => w.length > 4 ? w.slice(0, Math.max(4, Math.ceil(w.length * 0.6))) : w);

    const scored = hits
      .filter((h: Record<string, unknown>) => h.nutriments)
      .map((h: Record<string, unknown>) => {
        const name = ((h.product_name as string) ?? '').toLowerCase();
        // brands can be string OR array from search-a-licious
        const brandsRaw = h.brands;
        const brand = Array.isArray(brandsRaw)
          ? brandsRaw.join(' ').toLowerCase()
          : ((brandsRaw as string) ?? '').toLowerCase();
        const combined = `${name} ${brand}`;
        const combinedNorm = normalizeUmlauts(combined);
        // Score: exact match = 2 points, stem match = 1 point
        let score = 0;
        for (let i = 0; i < queryWords.length; i++) {
          if (combined.includes(queryWords[i]) || combinedNorm.includes(queryWordsNorm[i])) {
            score += 2; // exact word match
          } else if (combinedNorm.includes(queryStems[i])) {
            score += 1; // stem/prefix match (e.g. "fruechte" matches "fruchtiges")
          }
        }
        return { hit: h, score };
      })
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    // Require meaningful overlap to avoid returning wrong products.
    // For multi-word queries (e.g. "Kölln Hafermüsli Früchte"), require 2+ word matches.
    // For short queries (1-2 words), require at least 1 match.
    const minScore = queryWords.length >= 3 ? 3 : 1; // ~2 exact matches or 1 exact + 1 stem
    if (scored.length === 0 || scored[0].score < minScore) {
      console.log(`[ProductLookup] search-a-licious: best score ${scored[0]?.score ?? 0} < ${minScore} for "${cleaned}"`);
      return { found: false, source: 'none', summary: '' };
    }

    console.log(`[ProductLookup] search-a-licious: best match "${(scored[0].hit.product_name as string)}" (score ${scored[0].score})`);
    const best = scored[0].hit;
    return buildOFFResult(best, query);
  } catch (err) {
    console.warn('[ProductLookup] search-a-licious failed:', err);
    return { found: false, source: 'none', summary: '' };
  }
}

/**
 * V1 API fallback — full-text search via /cgi/search.pl
 * Note: This API is notoriously slow (often 10s+), so we use a tight 4s timeout.
 * If it doesn't respond quickly, we skip to web search fallback.
 */
/** @internal V1 fallback — kept for future use when search-a-licious is down */
export async function searchViaV1API(query: string): Promise<ProductLookupResult> {
  try {
    const cleaned = cleanSearchQuery(query);
    console.log(`[ProductLookup] V1 API query: "${cleaned}"`);

    const encoded = encodeURIComponent(cleaned);
    const fields = 'product_name,brands,nutriments,serving_size,serving_quantity,image_front_small_url,ingredients_text_de,ingredients_text,nutriscore_grade';
    const proxyUrl = `/api/off-v1/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process&json=1&page_size=5&fields=${fields}`;
    const directUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process&json=1&page_size=5&fields=${fields}`;

    const response = await fetchWithProxyFallback(proxyUrl, directUrl, 4000);

    if (!response.ok) {
      console.warn(`[ProductLookup] OFF v1 API returned ${response.status}`);
      return { found: false, source: 'none', summary: `Open Food Facts API error (${response.status})` };
    }

    const data = await response.json();
    const products = data.products;

    if (!products || products.length === 0) {
      return { found: false, source: 'none', summary: `Kein Produkt "${query}" in Open Food Facts gefunden.` };
    }

    // Find best match with nutriments data
    const best = products.find(
      (p: Record<string, unknown>) => p.nutriments && (p.nutriments as Record<string, unknown>)['energy-kcal_100g']
    ) ?? products[0];

    return buildOFFResult(best, query);
  } catch (err) {
    console.warn('[ProductLookup] OFF v1 search failed:', err);
    return {
      found: false,
      source: 'none',
      summary: `Open Food Facts Suche fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
    };
  }
}

/**
 * Build a ProductLookupResult from an Open Food Facts product hit.
 */
function buildOFFResult(best: Record<string, unknown>, query: string): ProductLookupResult {
  const n = (best.nutriments ?? {}) as Record<string, number>;
  const servingQty = best.serving_quantity;
  const servingG = servingQty
    ? parseFloat(String(servingQty))
    : parseServingSize(best.serving_size as string | undefined);

  const cal100 = n['energy-kcal_100g'] ?? n['energy_kcal_100g'] ?? undefined;
  const p100 = n['proteins_100g'] ?? undefined;
  const c100 = n['carbohydrates_100g'] ?? undefined;
  const f100 = n['fat_100g'] ?? undefined;
  const fiber100 = n['fiber_100g'] ?? undefined;

  // Skip products without calorie data
  if (cal100 == null) {
    return { found: false, source: 'none', summary: '' };
  }

  // Calculate per-serving if serving size known
  let calServ: number | undefined;
  let pServ: number | undefined;
  let cServ: number | undefined;
  let fServ: number | undefined;

  if (servingG && cal100 != null) {
    const factor = servingG / 100;
    calServ = Math.round(cal100 * factor);
    pServ = p100 != null ? Math.round(p100 * factor * 10) / 10 : undefined;
    cServ = c100 != null ? Math.round(c100 * factor * 10) / 10 : undefined;
    fServ = f100 != null ? Math.round(f100 * factor * 10) / 10 : undefined;
  }

  // brands can be string or array from different OFF APIs
  const brandsRaw = best.brands;
  const brandStr = Array.isArray(brandsRaw)
    ? brandsRaw.join(', ')
    : ((brandsRaw as string) ?? undefined);

  const product = {
    name: (best.product_name as string) ?? query,
    brand: brandStr || undefined,
    serving_size_g: servingG ?? undefined,
    serving_label: (best.serving_size as string) ?? undefined,
    calories_per_100g: Math.round(cal100),
    protein_per_100g: p100 != null ? Math.round(p100 * 10) / 10 : undefined,
    carbs_per_100g: c100 != null ? Math.round(c100 * 10) / 10 : undefined,
    fat_per_100g: f100 != null ? Math.round(f100 * 10) / 10 : undefined,
    fiber_per_100g: fiber100 != null ? Math.round(fiber100 * 10) / 10 : undefined,
    calories_per_serving: calServ,
    protein_per_serving: pServ,
    carbs_per_serving: cServ,
    fat_per_serving: fServ,
    image_url: (best.image_front_small_url as string) ?? undefined,
    ingredients_text: (best.ingredients_text_de as string) ?? (best.ingredients_text as string) ?? undefined,
    nutriscore_grade: (best.nutriscore_grade as string) ?? undefined,
  };

  // Build summary for LLM
  const lines: string[] = [];
  lines.push(`## Recherche-Ergebnis: ${product.name}${product.brand ? ` (${product.brand})` : ''}`);
  lines.push(`Quelle: Open Food Facts (Herstellerangaben von der Verpackung)`);
  lines.push(`\nPro 100g: ${product.calories_per_100g} kcal | ${product.protein_per_100g ?? '?'}g P | ${product.carbs_per_100g ?? '?'}g C | ${product.fat_per_100g ?? '?'}g F`);
  if (product.fiber_per_100g != null) {
    lines.push(`Ballaststoffe: ${product.fiber_per_100g}g pro 100g`);
  }
  if (servingG && calServ != null) {
    lines.push(`Pro Portion (${product.serving_label ?? servingG + 'g'}): ${calServ} kcal | ${pServ ?? '?'}g P | ${cServ ?? '?'}g C | ${fServ ?? '?'}g F`);
  }
  if (product.ingredients_text) {
    const short = product.ingredients_text.length > 200
      ? product.ingredients_text.slice(0, 200) + '...'
      : product.ingredients_text;
    lines.push(`\nZutaten: ${short}`);
  }
  lines.push(`\nVerwende diese EXAKTEN Werte in deiner Antwort und markiere sie als "(Herstellerangabe)".`);
  lines.push(`Erstelle ACTION:save_product + ACTION:log_meal mit diesen Werten.`);

  return {
    found: true,
    source: 'openfoodfacts',
    product,
    summary: lines.join('\n'),
  };
}

/**
 * Fallback: Use OpenAI web search to find nutritional data.
 * Only called when Open Food Facts returns nothing.
 */
async function searchViaWebSearch(query: string): Promise<ProductLookupResult> {
  try {
    // Check if OpenAI API key is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return {
        found: false,
        source: 'none',
        summary: 'Web-Suche nicht verfügbar (kein API-Key).',
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Nährwert-Recherche-Assistent. Suche die EXAKTEN Nährwerte für das genannte Produkt.
Antworte NUR in diesem JSON-Format, nichts anderes:
{"name":"Produktname","brand":"Marke","calories_per_100g":X,"protein_per_100g":X,"carbs_per_100g":X,"fat_per_100g":X,"serving_size_g":X,"serving_label":"z.B. 1 Portion (50g)","ingredients":"Zutatenliste kurz","source":"URL oder Quelle"}
Wenn du das Produkt nicht findest, antworte: {"found":false}`,
          },
          {
            role: 'user',
            content: `Finde die Nährwerte für: "${query}"`,
          },
        ],
        web_search_options: {
          search_context_size: 'medium',
        },
        temperature: 0.1,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(15000), // 15s timeout for web search
    });

    if (!response.ok) {
      console.warn(`[ProductLookup] Web search returned ${response.status}`);
      return { found: false, source: 'none', summary: `Web-Suche Fehler (${response.status})` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { found: false, source: 'none', summary: 'Web-Suche lieferte keine Ergebnisse.' };
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { found: false, source: 'none', summary: 'Web-Suche Ergebnis nicht parsbar.' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.found === false) {
      return { found: false, source: 'none', summary: `Web-Suche: Produkt "${query}" nicht gefunden.` };
    }

    const product = {
      name: parsed.name ?? query,
      brand: parsed.brand,
      calories_per_100g: parsed.calories_per_100g,
      protein_per_100g: parsed.protein_per_100g,
      carbs_per_100g: parsed.carbs_per_100g,
      fat_per_100g: parsed.fat_per_100g,
      serving_size_g: parsed.serving_size_g,
      serving_label: parsed.serving_label,
      ingredients_text: parsed.ingredients,
    };

    const lines: string[] = [];
    lines.push(`## Recherche-Ergebnis: ${product.name}${product.brand ? ` (${product.brand})` : ''}`);
    lines.push(`Quelle: Web-Recherche${parsed.source ? ` — ${parsed.source}` : ''}`);
    if (product.calories_per_100g != null) {
      lines.push(`\nPro 100g: ${product.calories_per_100g} kcal | ${product.protein_per_100g ?? '?'}g P | ${product.carbs_per_100g ?? '?'}g C | ${product.fat_per_100g ?? '?'}g F`);
    }
    if (product.ingredients_text) {
      lines.push(`\nZutaten: ${product.ingredients_text}`);
    }
    lines.push(`\nVerwende diese Werte in deiner Antwort und markiere sie als "(Web-Recherche)".`);
    lines.push(`Erstelle ACTION:save_product + ACTION:log_meal mit diesen Werten.`);

    return {
      found: true,
      source: 'websearch',
      product,
      summary: lines.join('\n'),
    };
  } catch (err) {
    console.warn('[ProductLookup] Web search failed:', err);
    return {
      found: false,
      source: 'none',
      summary: `Web-Suche fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
    };
  }
}

/**
 * Main lookup function: Open Food Facts first, then Web Search fallback.
 * Typical timing: search-a-licious ~1-2s, V1 ~4s (timeout), web search ~3-5s.
 */
export async function lookupProduct(query: string): Promise<ProductLookupResult> {
  const t0 = Date.now();
  console.log(`[ProductLookup] ──── Starting search for: "${query}" ────`);

  // Tier 1: Open Food Facts (search-a-licious → V1 fallback)
  const offResult = await searchOpenFoodFacts(query);
  if (offResult.found) {
    console.log(`[ProductLookup] ✅ Found in Open Food Facts: "${offResult.product?.name}" (${Date.now() - t0}ms)`);
    return offResult;
  }

  console.log(`[ProductLookup] OFF returned nothing (${Date.now() - t0}ms), trying web search...`);

  // Tier 2: OpenAI Web Search fallback
  const webResult = await searchViaWebSearch(query);
  if (webResult.found) {
    console.log(`[ProductLookup] ✅ Found via web search: "${webResult.product?.name}" (${Date.now() - t0}ms)`);
    return webResult;
  }

  // Nothing found
  console.log(`[ProductLookup] ❌ Product "${query}" not found anywhere. (${Date.now() - t0}ms)`);
  return {
    found: false,
    source: 'none',
    summary: `Produkt "${query}" konnte weder in Open Food Facts noch per Web-Suche gefunden werden. Frage den Nutzer nach den Nährwerten von der Verpackung.`,
  };
}

// ── Helper ────────────────────────────────────────────────────────────

/** Parse serving size string like "45g" or "1 portion (30 g)" into grams */
function parseServingSize(raw?: string): number | undefined {
  if (!raw) return undefined;
  const match = raw.match(/(\d+(?:[.,]\d+)?)\s*g/i);
  if (match) return parseFloat(match[1].replace(',', '.'));
  return undefined;
}
