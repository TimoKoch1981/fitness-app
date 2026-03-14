/**
 * Supabase Edge Function: recipe-import
 *
 * Extracts structured recipe data from a URL using a 3-tier cascade:
 * 1. JSON-LD (schema.org/Recipe) — ~80% of food blogs
 * 2. Microdata (itemprop) — fallback for older sites
 * 3. AI fallback (gpt-4o-mini via ai-proxy pattern) — for unstructured pages
 *
 * Security:
 * - Auth: Validates Supabase JWT
 * - Rate Limiting: 10 imports per user per hour
 * - SSRF Protection: Blocks private IPs
 * - Max HTML size: 500KB
 * - Request timeout: 10s
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

// ── SSRF Protection ───────────────────────────────────────────────────

function isPrivateIP(hostname: string): boolean {
  // Block private/reserved IPs
  const patterns = [
    /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
    /^0\./, /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/,
    /^localhost$/i, /^.*\.local$/i,
  ];
  return patterns.some(p => p.test(hostname));
}

// ── JSON-LD Extraction ────────────────────────────────────────────────

interface ImportedRecipe {
  title: string;
  description: string;
  ingredients: { name: string; amount: number; unit: string }[];
  steps: { text: string; duration_min?: number }[];
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  image_url: string | null;
  source_url: string;
  import_method: 'json_ld' | 'microdata' | 'ai';
  meal_type: string | null;
  tags: string[];
  allergens: string[];
}

/** Parse ISO 8601 duration (PT10M, PT1H30M) to minutes */
function parseDuration(iso: string | undefined | null): number {
  if (!iso || typeof iso !== 'string') return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0');
}

/** Extract numeric value from nutrition string like "320 kcal" or "28g" */
function parseNutritionValue(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const match = String(val).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/** Parse ingredient string like "200g Haehnchenbrust" into structured data */
function parseIngredientString(s: string): { name: string; amount: number; unit: string } {
  const trimmed = s.trim();
  // Try: amount unit name
  const match = trimmed.match(/^([\d.,/]+)\s*(g|kg|ml|l|EL|TL|Stueck|Tasse|Tassen|Becher|Prise|Scheibe[n]?|Zehe[n]?|Bund|cup|cups|tbsp|tsp|oz|lb|lbs|clove[s]?|piece[s]?|pinch)?\s+(.+)$/i);
  if (match) {
    const rawAmt = match[1].replace(',', '.');
    let amount: number;
    if (rawAmt.includes('/')) {
      const [n, d] = rawAmt.split('/').map(Number);
      amount = d ? n / d : Number(rawAmt);
    } else {
      amount = Number(rawAmt);
    }
    return { name: match[3].trim(), amount: amount || 1, unit: match[2] || 'Stueck' };
  }
  // Fallback: whole string as name
  return { name: trimmed, amount: 1, unit: 'Stueck' };
}

/** Detect meal_type from recipe name/category */
function detectMealType(name: string, category?: string): string | null {
  const combined = `${name} ${category || ''}`.toLowerCase();
  if (/breakfast|fruehstueck|frühstück|morning|porridge|pancake|oat|muesli|granola/.test(combined)) return 'breakfast';
  if (/lunch|mittag|bowl|wrap|salat|salad/.test(combined)) return 'lunch';
  if (/dinner|abend|hauptgericht|main|braten|steak|auflauf|casserole/.test(combined)) return 'dinner';
  if (/snack|riegel|bar|smoothie|shake|dip|hummus/.test(combined)) return 'snack';
  if (/pre.?work|vor.?training/.test(combined)) return 'pre_workout';
  if (/post.?work|nach.?training|recovery/.test(combined)) return 'post_workout';
  return null;
}

/** Known allergen patterns (matches types.ts on frontend) */
const ALLERGEN_PATTERNS: Record<string, RegExp> = {
  gluten: /weizen|mehl|brot|nudel|pasta|semmelbr|paniermehl|hafer|roggen|gerste|dinkel|couscous|bulgur|tortilla|wheat|flour|bread|oat|barley|rye/i,
  laktose: /milch|joghurt|quark|kaese|sahne|butter|cream|mozzarella|parmesan|gouda|feta|ricotta|milk|yogurt|cheese|dairy/i,
  ei: /\bei(er)?\b|eigelb|eiweiss|meringue|\begg[s]?\b/i,
  nuesse: /mandel|haselnuss|walnuss|cashew|pistazie|pekan|macadamia|erdnuss|peanut|almond|walnut|hazelnut|pecan|nut/i,
  soja: /soja|tofu|edamame|miso|tempeh|soy/i,
  fisch: /lachs|thunfisch|kabeljau|forelle|hering|sardine|makrele|pangasius|dorade|zander|salmon|tuna|cod|trout|fish/i,
  krusten: /garnele|shrimp|krebs|hummer|langustine|krabbe|prawn|crab|lobster|shellfish/i,
  sellerie: /sellerie|celery/i,
  senf: /senf|mostrich|mustard/i,
  sesam: /sesam|tahini|sesame/i,
};

function detectAllergens(ingredients: { name: string }[]): string[] {
  const detected = new Set<string>();
  for (const ing of ingredients) {
    for (const [allergen, pattern] of Object.entries(ALLERGEN_PATTERNS)) {
      if (pattern.test(ing.name)) detected.add(allergen);
    }
  }
  return Array.from(detected).sort();
}

/** Auto-tags from macros */
function deriveAutoTags(r: { calories_per_serving: number; protein_per_serving: number; carbs_per_serving: number; fat_per_serving: number; prep_time_min: number; cook_time_min: number }): string[] {
  const tags: string[] = [];
  if (r.protein_per_serving >= 30) tags.push('High-Protein');
  if (r.carbs_per_serving <= 20) tags.push('Low-Carb');
  if (r.fat_per_serving <= 10) tags.push('Low-Fat');
  if (r.calories_per_serving <= 300) tags.push('Kalorienarm');
  if ((r.prep_time_min + r.cook_time_min) <= 15) tags.push('Schnell');
  return tags;
}

// ── JSON-LD Extraction ────────────────────────────────────────────────

function extractJsonLd(html: string): ImportedRecipe | null {
  // Find all JSON-LD blocks
  const regex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      let data = JSON.parse(match[1]);

      // Handle @graph arrays
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        data = data['@graph'];
      }

      // Handle arrays
      if (Array.isArray(data)) {
        const recipe = data.find((item: Record<string, unknown>) =>
          item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
        if (recipe) data = recipe;
        else continue;
      }

      // Check if this is a Recipe type
      const type = data['@type'];
      if (type !== 'Recipe' && !(Array.isArray(type) && type.includes('Recipe'))) continue;

      // Extract ingredients
      const rawIngredients = data.recipeIngredient || data.ingredients || [];
      const ingredients = (Array.isArray(rawIngredients) ? rawIngredients : [])
        .map((s: string) => parseIngredientString(String(s)))
        .filter((i: { name: string }) => i.name);

      // Extract instructions
      let steps: { text: string; duration_min?: number }[] = [];
      const rawInstructions = data.recipeInstructions;
      if (Array.isArray(rawInstructions)) {
        steps = rawInstructions.map((s: string | Record<string, unknown>) => {
          if (typeof s === 'string') return { text: s };
          if (s && typeof s === 'object') {
            // HowToStep or HowToSection
            if (s['@type'] === 'HowToSection' && Array.isArray(s.itemListElement)) {
              return (s.itemListElement as Record<string, unknown>[]).map((sub) => ({
                text: String(sub.text || sub.name || ''),
              }));
            }
            return { text: String(s.text || s.name || '') };
          }
          return { text: String(s) };
        }).flat().filter((s: { text: string }) => s.text);
      } else if (typeof rawInstructions === 'string') {
        steps = rawInstructions.split(/\n+/).filter(Boolean).map((t: string) => ({ text: t.trim() }));
      }

      // Extract nutrition
      const nutrition = data.nutrition || {};
      const calories = parseNutritionValue(nutrition.calories);
      const protein = parseNutritionValue(nutrition.proteinContent);
      const carbs = parseNutritionValue(nutrition.carbohydrateContent);
      const fat = parseNutritionValue(nutrition.fatContent);

      // Extract servings
      let servings = 1;
      const yieldVal = data.recipeYield;
      if (yieldVal) {
        if (typeof yieldVal === 'number') servings = yieldVal;
        else if (Array.isArray(yieldVal)) {
          const num = yieldVal.find((v: unknown) => typeof v === 'number' || /^\d+$/.test(String(v)));
          if (num) servings = Number(num);
        } else {
          const m = String(yieldVal).match(/(\d+)/);
          if (m) servings = parseInt(m[1]);
        }
      }

      // Extract image
      let image_url: string | null = null;
      if (data.image) {
        if (typeof data.image === 'string') image_url = data.image;
        else if (Array.isArray(data.image)) image_url = data.image[0];
        else if (data.image.url) image_url = data.image.url;
      }

      const recipe: ImportedRecipe = {
        title: String(data.name || 'Importiertes Rezept'),
        description: String(data.description || '').slice(0, 500),
        ingredients,
        steps,
        servings,
        prep_time_min: parseDuration(data.prepTime),
        cook_time_min: parseDuration(data.cookTime),
        calories_per_serving: calories,
        protein_per_serving: protein,
        carbs_per_serving: carbs,
        fat_per_serving: fat,
        image_url,
        source_url: '', // filled by caller
        import_method: 'json_ld',
        meal_type: detectMealType(String(data.name || ''), data.recipeCategory),
        tags: [],
        allergens: [],
      };

      recipe.tags = deriveAutoTags(recipe);
      recipe.allergens = detectAllergens(recipe.ingredients);

      return recipe;
    } catch {
      // Invalid JSON-LD block, try next
      continue;
    }
  }
  return null;
}

// ── Microdata Extraction ──────────────────────────────────────────────

function extractMicrodata(html: string): ImportedRecipe | null {
  // Simple regex-based microdata extraction
  // Look for itemprop attributes related to Recipe
  const hasRecipeScope = /itemtype\s*=\s*["']https?:\/\/schema\.org\/Recipe["']/i.test(html);
  if (!hasRecipeScope) return null;

  const extractProp = (prop: string): string | null => {
    const regex = new RegExp(`itemprop\\s*=\\s*["']${prop}["'][^>]*>([^<]+)`, 'i');
    const match = html.match(regex);
    if (match) return match[1].trim();
    // Also check content attribute
    const contentRegex = new RegExp(`itemprop\\s*=\\s*["']${prop}["'][^>]*content\\s*=\\s*["']([^"']+)["']`, 'i');
    const contentMatch = html.match(contentRegex);
    return contentMatch ? contentMatch[1].trim() : null;
  };

  const title = extractProp('name');
  if (!title) return null;

  // Extract all ingredients
  const ingredientRegex = /itemprop\s*=\s*["']recipeIngredient["'][^>]*>([^<]+)/gi;
  const ingredients: { name: string; amount: number; unit: string }[] = [];
  let ingredientMatch;
  while ((ingredientMatch = ingredientRegex.exec(html)) !== null) {
    ingredients.push(parseIngredientString(ingredientMatch[1].trim()));
  }

  // Extract instructions
  const instructionRegex = /itemprop\s*=\s*["']recipeInstructions?["'][^>]*>([\s\S]*?)<\//gi;
  const steps: { text: string }[] = [];
  let instrMatch;
  while ((instrMatch = instructionRegex.exec(html)) !== null) {
    const text = instrMatch[1].replace(/<[^>]+>/g, '').trim();
    if (text) steps.push({ text });
  }

  const recipe: ImportedRecipe = {
    title,
    description: extractProp('description') || '',
    ingredients,
    steps,
    servings: parseInt(extractProp('recipeYield') || '1') || 1,
    prep_time_min: parseDuration(extractProp('prepTime')),
    cook_time_min: parseDuration(extractProp('cookTime')),
    calories_per_serving: parseNutritionValue(extractProp('calories')),
    protein_per_serving: parseNutritionValue(extractProp('proteinContent')),
    carbs_per_serving: parseNutritionValue(extractProp('carbohydrateContent')),
    fat_per_serving: parseNutritionValue(extractProp('fatContent')),
    image_url: null,
    source_url: '',
    import_method: 'microdata',
    meal_type: detectMealType(title, extractProp('recipeCategory') || undefined),
    tags: [],
    allergens: [],
  };

  recipe.tags = deriveAutoTags(recipe);
  recipe.allergens = detectAllergens(recipe.ingredients);

  return recipe;
}

// ── AI Fallback ───────────────────────────────────────────────────────

async function extractWithAI(html: string, url: string): Promise<ImportedRecipe | null> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    console.error('[recipe-import] No OPENAI_API_KEY set — AI fallback disabled');
    return null;
  }

  // Strip HTML to plain text, limit to ~4000 chars
  const textContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);

  if (textContent.length < 50) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Rezept-Extraktor. Extrahiere strukturierte Rezeptdaten aus dem folgenden Webseitentext. Antworte NUR mit validem JSON, kein Markdown. Wenn kein Rezept erkennbar ist, antworte mit {"error": "no_recipe"}.`,
          },
          {
            role: 'user',
            content: `Extrahiere das Rezept als JSON mit diesen Feldern:
{
  "title": "string",
  "description": "string (max 200 Zeichen)",
  "ingredients": [{"name": "string", "amount": number, "unit": "string"}],
  "steps": [{"text": "string"}],
  "servings": number,
  "prep_time_min": number,
  "cook_time_min": number,
  "calories_per_serving": number (schaetze falls nicht angegeben),
  "protein_per_serving": number (schaetze),
  "carbs_per_serving": number (schaetze),
  "fat_per_serving": number (schaetze)
}

Webseitentext von ${new URL(url).hostname}:
${textContent}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error(`[recipe-import] OpenAI error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (parsed.error) return null;

    // Log token usage
    const usage = result.usage;
    if (usage) {
      console.log(`[recipe-import] AI tokens: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`);
    }

    const recipe: ImportedRecipe = {
      title: parsed.title || 'Importiertes Rezept',
      description: (parsed.description || '').slice(0, 500),
      ingredients: (parsed.ingredients || []).map((i: Record<string, unknown>) => ({
        name: String(i.name || ''),
        amount: Number(i.amount) || 1,
        unit: String(i.unit || 'Stueck'),
      })),
      steps: (parsed.steps || []).map((s: Record<string, unknown>) => ({
        text: String(s.text || ''),
      })).filter((s: { text: string }) => s.text),
      servings: parsed.servings || 1,
      prep_time_min: parsed.prep_time_min || 0,
      cook_time_min: parsed.cook_time_min || 0,
      calories_per_serving: parsed.calories_per_serving || 0,
      protein_per_serving: parsed.protein_per_serving || 0,
      carbs_per_serving: parsed.carbs_per_serving || 0,
      fat_per_serving: parsed.fat_per_serving || 0,
      image_url: null,
      source_url: '',
      import_method: 'ai',
      meal_type: detectMealType(parsed.title || ''),
      tags: [],
      allergens: [],
    };

    recipe.tags = deriveAutoTags(recipe);
    recipe.allergens = detectAllergens(recipe.ingredients);

    return recipe;
  } catch (err) {
    console.error('[recipe-import] AI extraction failed:', err);
    return null;
  }
}

// ── Main Handler ──────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') || '';
  const userId = extractUserIdFromJWT(authHeader);
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'unauthorized', message: 'Nicht angemeldet.' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Rate Limit ────────────────────────────────────────────────────
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({
      success: false, error: 'rate_limited',
      message: `Zu viele Imports. Versuch es in ${Math.ceil(rateCheck.retryAfterSeconds / 60)} Minuten erneut.`,
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateCheck.retryAfterSeconds) },
    });
  }

  // ── Parse request ─────────────────────────────────────────────────
  let url: string;
  try {
    const body = await req.json();
    url = body.url;
    if (!url || typeof url !== 'string') throw new Error('Missing URL');
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'invalid_request', message: 'URL fehlt oder ist ungueltig.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    // Add https:// if missing
    if (!url.match(/^https?:\/\//i)) url = 'https://' + url;
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid protocol');
    if (url.length > 2048) throw new Error('URL too long');
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'invalid_url', message: 'Ungueltige URL.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // SSRF protection
  if (isPrivateIP(parsedUrl.hostname)) {
    return new Response(JSON.stringify({ success: false, error: 'blocked_url', message: 'Diese URL ist nicht erlaubt.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Fetch HTML ────────────────────────────────────────────────────
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FitBuddy/1.0; +https://fudda.de)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false, error: 'fetch_failed',
        message: `Seite konnte nicht geladen werden (HTTP ${response.status}).`,
      }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return new Response(JSON.stringify({
        success: false, error: 'not_html',
        message: 'Die URL verweist nicht auf eine Webseite.',
      }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read max 500KB
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body');
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const MAX_BYTES = 500 * 1024;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      chunks.push(value);
      if (totalBytes > MAX_BYTES) break;
    }

    const decoder = new TextDecoder('utf-8', { fatal: false });
    html = chunks.map(c => decoder.decode(c, { stream: true })).join('') + decoder.decode();
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'Timeout: Seite hat zu lange zum Laden gebraucht.'
      : 'Seite konnte nicht geladen werden. Pruefe die URL.';
    return new Response(JSON.stringify({ success: false, error: 'fetch_error', message }), {
      status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── 3-Tier Extraction ─────────────────────────────────────────────
  console.log(`[recipe-import] Processing ${parsedUrl.hostname}${parsedUrl.pathname.slice(0, 50)} (${(html.length / 1024).toFixed(0)}KB)`);

  // Tier 1: JSON-LD
  let recipe = extractJsonLd(html);
  if (recipe) {
    console.log(`[recipe-import] ✅ JSON-LD: "${recipe.title}" (${recipe.ingredients.length} ingredients)`);
  }

  // Tier 2: Microdata
  if (!recipe) {
    recipe = extractMicrodata(html);
    if (recipe) {
      console.log(`[recipe-import] ✅ Microdata: "${recipe.title}" (${recipe.ingredients.length} ingredients)`);
    }
  }

  // Tier 3: AI Fallback
  if (!recipe) {
    console.log('[recipe-import] No structured data found, trying AI fallback...');
    recipe = await extractWithAI(html, url);
    if (recipe) {
      console.log(`[recipe-import] ✅ AI: "${recipe.title}" (${recipe.ingredients.length} ingredients)`);
    }
  }

  // No recipe found
  if (!recipe) {
    return new Response(JSON.stringify({
      success: false,
      error: 'no_recipe_found',
      message: 'Auf dieser Seite wurde kein Rezept erkannt. Versuch eine andere URL oder erstelle das Rezept manuell.',
    }), {
      status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Set source URL
  recipe.source_url = url;

  // ── Round macros to 1 decimal place ────────────────────────────────
  recipe.calories_per_serving = Math.round(recipe.calories_per_serving);
  recipe.protein_per_serving = Math.round(recipe.protein_per_serving * 10) / 10;
  recipe.carbs_per_serving = Math.round(recipe.carbs_per_serving * 10) / 10;
  recipe.fat_per_serving = Math.round(recipe.fat_per_serving * 10) / 10;

  // ── Download image and re-upload to Supabase Storage ──────────────
  if (recipe.image_url) {
    try {
      const imgUrl = recipe.image_url;
      console.log(`[recipe-import] Downloading image: ${imgUrl.slice(0, 80)}...`);

      const imgController = new AbortController();
      const imgTimeout = setTimeout(() => imgController.abort(), 8000);

      const imgResponse = await fetch(imgUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FitBuddy/1.0; +https://fudda.de)',
          'Accept': 'image/*',
          'Referer': url, // Some sites check referer
        },
        signal: imgController.signal,
      });

      clearTimeout(imgTimeout);

      if (imgResponse.ok) {
        const contentType = imgResponse.headers.get('Content-Type') || 'image/jpeg';
        if (contentType.startsWith('image/')) {
          const imgData = await imgResponse.arrayBuffer();
          const imgSize = imgData.byteLength;

          // Max 2MB, skip if too large
          if (imgSize <= 2 * 1024 * 1024) {
            const ext = contentType.includes('png') ? 'png'
              : contentType.includes('webp') ? 'webp' : 'jpg';
            const imgId = crypto.randomUUID();
            const storagePath = `${userId}/${imgId}.${ext}`;

            const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://kong:8000';
            const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

            const uploadRes = await fetch(
              `${SUPABASE_URL}/storage/v1/object/recipe-images/${storagePath}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                  'Content-Type': contentType,
                  'x-upsert': 'true',
                },
                body: imgData,
              }
            );

            if (uploadRes.ok) {
              // Build public URL (external URL, not internal kong)
              recipe.image_url = `https://fudda.de/storage/v1/object/public/recipe-images/${storagePath}`;
              console.log(`[recipe-import] ✅ Image uploaded: ${storagePath} (${(imgSize / 1024).toFixed(0)}KB)`);
            } else {
              console.error(`[recipe-import] Image upload failed: ${uploadRes.status} ${await uploadRes.text().catch(() => '')}`);
              recipe.image_url = null; // Don't hotlink — set null
            }
          } else {
            console.log(`[recipe-import] Image too large (${(imgSize / 1024 / 1024).toFixed(1)}MB), skipping`);
            recipe.image_url = null;
          }
        } else {
          recipe.image_url = null;
        }
      } else {
        console.log(`[recipe-import] Image fetch failed: ${imgResponse.status}`);
        recipe.image_url = null;
      }
    } catch (err) {
      console.error('[recipe-import] Image download error:', err);
      recipe.image_url = null; // Don't hotlink on error
    }
  }

  // ── Success ───────────────────────────────────────────────────────
  return new Response(JSON.stringify({
    success: true,
    source: recipe.import_method,
    recipe,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
