/**
 * Supabase Edge Function: recipe-search
 *
 * KI-gestützte Rezept-Websuche:
 * 1. Query-Aufbereitung via GPT-4o-mini (Fitness-Kontext, Sprachoptimierung)
 * 2. Web-Suche via DuckDuckGo (kostenlos, kein API Key)
 * 3. Ergebnis-Filterung (Rezept-Relevanz, Deduplizierung)
 *
 * Security:
 * - Auth: Validates Supabase JWT
 * - Rate Limiting: 10 searches per user per hour
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Rate Limiting ─────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitEntry { count: number; resetAt: number; }
const rateLimitMap = new Map<string, RateLimitEntry>();

function extractUserIdFromJWT(token: string): string | null {
  try {
    const parts = token.replace(/^Bearer\s+/i, '').split('.');
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) payload += '=';
    const json = JSON.parse(atob(payload));
    return json.sub ?? null;
  } catch { return null; }
}

function checkRateLimit(userId: string): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (entry && now >= entry.resetAt) rateLimitMap.delete(userId);
  const current = rateLimitMap.get(userId);
  if (!current) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count++;
  return { allowed: true };
}

// Cleanup expired entries every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitMap) { if (now >= v.resetAt) rateLimitMap.delete(k); }
}, 10 * 60 * 1000);

// ── Types ─────────────────────────────────────────────────────────────

interface SearchRequest {
  query: string;
  context?: {
    goals?: string[];
    restrictions?: string[];
  };
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  thumbnail: string | null;
  source: string;
}

// ── KI Query-Aufbereitung ─────────────────────────────────────────────

async function optimizeQuery(
  query: string,
  context?: SearchRequest['context']
): Promise<string[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    // Fallback: use raw query + "Rezept"
    const q = query.toLowerCase().includes('rezept') || query.toLowerCase().includes('recipe')
      ? query
      : `${query} Rezept`;
    return [q];
  }

  const contextStr = context
    ? `\nFitness-Ziele: ${context.goals?.join(', ') || 'keine'}\nEinschraenkungen: ${context.restrictions?.join(', ') || 'keine'}`
    : '';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Suchassistent fuer Fitness-Rezepte. Optimiere die Suchanfrage fuer eine Websuche nach Rezepten.
Antworte NUR mit JSON: {"queries": ["query1", "query2"]}
Regeln:
- Behalte die Originalsprache bei
- Fuege "Rezept" hinzu falls nicht vorhanden
- Erweitere vage Begriffe (z.B. "was Schnelles" → "schnelle Rezepte unter 20 Minuten")
- Wenn Fitness-Kontext gegeben: fuege relevante Begriffe hinzu (High-Protein, kalorienarm, etc.)
- Max 2 optimierte Queries`,
          },
          {
            role: 'user',
            content: `Suchanfrage: "${query}"${contextStr}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error('[recipe-search] OpenAI error:', response.status);
      return [query.includes('Rezept') || query.includes('recipe') ? query : `${query} Rezept`];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
      return parsed.queries.slice(0, 2);
    }
  } catch (err) {
    console.error('[recipe-search] Query optimization failed:', err);
  }

  // Fallback
  return [query.includes('Rezept') || query.includes('recipe') ? query : `${query} Rezept`];
}

// ── DuckDuckGo Search ─────────────────────────────────────────────────

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    kl: 'de-de',  // region: Germany
  });

  const response = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FitBuddy/1.0; Recipe Search)',
      'Accept': 'text/html',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    console.error('[recipe-search] DuckDuckGo error:', response.status);
    throw new Error(`DuckDuckGo search error: ${response.status}`);
  }

  const html = await response.text();
  return parseDuckDuckGoResults(html);
}

function parseDuckDuckGoResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Match result blocks: <a class="result__a" href="...">title</a> + <a class="result__snippet">snippet</a>
  const resultBlocks = html.split(/class="result\s/g).slice(1); // skip first (before results)

  for (const block of resultBlocks) {
    if (results.length >= 15) break;

    // Extract URL from result__a href
    const urlMatch = block.match(/class="result__a"[^>]*href="([^"]+)"/);
    // Extract title text
    const titleMatch = block.match(/class="result__a"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/);
    // Extract snippet
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/);

    if (!urlMatch?.[1]) continue;

    // DuckDuckGo wraps URLs in a redirect — extract the actual URL
    let url = urlMatch[1];
    const uddgMatch = url.match(/uddg=([^&]+)/);
    if (uddgMatch?.[1]) {
      url = decodeURIComponent(uddgMatch[1]);
    }

    // Skip non-http URLs and ad links
    if (!url.startsWith('http')) continue;
    if (url.includes('duckduckgo.com')) continue;

    const title = stripHtml(titleMatch?.[1] || '').trim();
    const snippet = stripHtml(snippetMatch?.[1] || '').trim().slice(0, 200);

    if (!title) continue;

    results.push({
      title,
      url,
      snippet,
      thumbnail: null, // DuckDuckGo HTML doesn't provide thumbnails
      source: extractHostname(url),
    });
  }

  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&auml;/g, 'ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß');
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch { return url; }
}

function isRecipeRelevant(result: SearchResult): boolean {
  const text = `${result.title} ${result.snippet} ${result.url}`.toLowerCase();
  const recipeKeywords = [
    'rezept', 'recipe', 'zutaten', 'ingredients', 'zubereitung',
    'kochen', 'backen', 'gericht', 'mahlzeit', 'essen',
    'chefkoch', 'eatsmarter', 'lecker', 'cookidoo', 'allrecipes',
    'food', 'cook', 'meal', 'dish', 'kitchen',
  ];
  return recipeKeywords.some(kw => text.includes(kw));
}

function deduplicateByDomain(results: SearchResult[], maxPerDomain = 2): SearchResult[] {
  const domainCount = new Map<string, number>();
  return results.filter(r => {
    const count = domainCount.get(r.source) || 0;
    if (count >= maxPerDomain) return false;
    domainCount.set(r.source, count + 1);
    return true;
  });
}

// ── Main Handler ──────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Auth
    const authHeader = req.headers.get('authorization') || '';
    const userId = extractUserIdFromJWT(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'unauthorized', message: 'Nicht angemeldet.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit
    const rl = checkRateLimit(userId);
    if (!rl.allowed) {
      const minutes = Math.ceil(rl.retryAfterSeconds / 60);
      return new Response(JSON.stringify({
        success: false,
        error: 'rate_limited',
        message: `Zu viele Suchen. Versuch es in ${minutes} Minuten erneut.`,
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(rl.retryAfterSeconds),
        },
      });
    }

    // Parse body
    const body: SearchRequest = await req.json();
    if (!body.query || typeof body.query !== 'string' || body.query.trim().length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'invalid_query', message: 'Bitte gib einen Suchbegriff ein.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const query = body.query.trim().slice(0, 200); // max 200 chars

    // Step 1: KI query optimization
    const optimizedQueries = await optimizeQuery(query, body.context);
    console.log(`[recipe-search] User: ${userId.slice(0, 8)}... | Original: "${query}" | Optimized: ${JSON.stringify(optimizedQueries)}`);

    // Step 2: DuckDuckGo Search (use first optimized query, merge results if 2 queries)
    let allResults: SearchResult[] = [];
    for (const q of optimizedQueries) {
      try {
        const results = await searchDuckDuckGo(q);
        allResults.push(...results);
      } catch (err) {
        console.error(`[recipe-search] DuckDuckGo search failed for "${q}":`, err);
      }
    }

    if (allResults.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        results: [],
        query_used: optimizedQueries[0] || query,
        result_count: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Filter + deduplicate
    // Deduplicate by URL first
    const urlSet = new Set<string>();
    allResults = allResults.filter(r => {
      if (urlSet.has(r.url)) return false;
      urlSet.add(r.url);
      return true;
    });

    // Filter for recipe relevance
    const relevant = allResults.filter(isRecipeRelevant);
    const finalResults = deduplicateByDomain(
      relevant.length > 0 ? relevant : allResults.slice(0, 5), // fallback if no "recipe" keywords found
      2
    ).slice(0, 10);

    return new Response(JSON.stringify({
      success: true,
      results: finalResults,
      query_used: optimizedQueries[0] || query,
      result_count: finalResults.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[recipe-search] Unexpected error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'internal_error',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
