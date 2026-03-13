/**
 * Nutrition Preference Engine — Automatisches Lernen von Ernaehrungs-Praeferenzen.
 *
 * Three inference sources (all rule-based, no LLM):
 * 1. Chat extraction — regex patterns for explicit food likes/dislikes
 * 2. Meal history — frequent ingredient detection from logged meals
 * 3. Recipe tags — dietary patterns from recipe metadata
 *
 * Confidence management with time decay.
 * Upsert semantics via UNIQUE(user_id, preference_type, value).
 */

import { supabase } from '../supabase';

// ── Types ──────────────────────────────────────────────────────────────

export type PreferenceType =
  | 'liked_ingredient'
  | 'disliked_ingredient'
  | 'cooking_style'
  | 'cuisine_preference'
  | 'dietary_pattern'
  | 'portion_size';

export type PreferenceSource = 'explicit' | 'inferred' | 'buddy_chat';

export interface NutritionPreference {
  preference_type: PreferenceType;
  value: string;
  confidence: number;
  source: PreferenceSource;
}

export interface StoredPreference extends NutritionPreference {
  id: string;
  user_id: string;
  occurrence_count: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const MAX_PREFERENCES_PER_USER = 50;
const LS_INFERENCE_KEY = 'fitbuddy_pref_inference_last';

// ── 1. Chat-Based Extraction ──────────────────────────────────────────

// German dislike patterns — capture the food item
const DISLIKE_DE = [
  /(?:mag|esse?|vertrage?)\s+(?:kein(?:e[nms]?)?|nicht?|ungern)\s+(.{2,40})/i,
  /(?:hasse?|verabscheue?)\s+(.{2,40})/i,
  /ohne\s+(\w{2,30})\s+bitte/i,
  /(\w{2,30})\s+(?:schmeckt|mag)\s+(?:mir\s+)?(?:nicht|gar\s+nicht)/i,
  /(?:bitte\s+)?(?:kein(?:e[nms]?)?)\s+(.{2,40})\s+(?:mehr|empfehlen|vorschlagen)/i,
];

const DISLIKE_EN = [
  /(?:don'?t|can'?t|won'?t)\s+(?:eat|like|tolerate|stand)\s+(.{2,40})/i,
  /(?:hate|dislike|despise)\s+(.{2,40})/i,
  /(?:no|without)\s+(\w{2,30})\s+please/i,
  /(\w{2,30})\s+(?:makes?\s+me\s+(?:sick|nauseous)|(?:is|are)\s+disgusting)/i,
  /(?:allergic|intolerant)\s+to\s+(.{2,40})/i,
];

// German like patterns
const LIKE_DE = [
  /(?:liebe|mag|esse?\s+(?:gern|am\s+liebsten))\s+(.{2,40})/i,
  /(\w{2,30})\s+(?:ist|sind)\s+mein(?:e?)\s+(?:lieblings|favorit)/i,
  /(?:koennte?\s+jeden\s+tag)\s+(.{2,40})\s+essen/i,
  /(?:bin\s+(?:ein\s+)?(?:grosser?\s+)?fan\s+von)\s+(.{2,40})/i,
];

const LIKE_EN = [
  /(?:love|really\s+like|enjoy|adore)\s+(.{2,40})/i,
  /(\w{2,30})\s+(?:is|are)\s+my\s+(?:favorite|favourite)/i,
  /(?:could\s+eat)\s+(.{2,40})\s+(?:every\s+day|all\s+day)/i,
  /(?:big\s+fan\s+of)\s+(.{2,40})/i,
];

// Cuisine preference patterns
const CUISINE_DE = [
  /(?:liebe?|mag|bevorzuge?|esse?\s+gern)\s+(?:.*?)(asiatisch|italienisch|mexikanisch|indisch|deutsch|griechisch|tuerkisch|japanisch|thai|chinesisch|koreanisch|mediterran)/i,
];

const CUISINE_EN = [
  /(?:love|like|prefer|enjoy)\s+(?:.*?)(asian|italian|mexican|indian|german|greek|turkish|japanese|thai|chinese|korean|mediterranean)\s+(?:food|cuisine|cooking)/i,
];

// Cooking style patterns
const COOKING_STYLE_DE = [
  /(?:mache?|bin|betreibe?)\s+(?:.*?)(meal\s*prep|vorkochen|batch\s*cooking)/i,
  /(?:koche?\s+(?:am\s+liebsten\s+)?)(schnell|einfach|aufwendig|gern|nicht\s+gern)/i,
  /(?:bevorzuge?)\s+(?:.*?)(schnelle?\s+(?:gerichte?|kueche)|einfache?\s+rezepte?)/i,
];

const COOKING_STYLE_EN = [
  /(?:do|prefer|like)\s+(?:.*?)(meal\s*prep|batch\s*cooking|cooking\s+in\s+advance)/i,
  /(?:like\s+(?:to\s+)?cook(?:ing)?)\s+(?:.*?)(quick|simple|elaborate|complex)/i,
  /(?:prefer)\s+(?:.*?)(quick\s+meals?|simple\s+recipes?|easy\s+cooking)/i,
];

// Portion size patterns
const PORTION_DE = [
  /(?:esse?|mag|bevorzuge?)\s+(?:.*?)(kleine|grosse|normale)\s+(?:portionen?|mengen?)/i,
  /(?:esse?\s+(?:lieber\s+)?)(wenig|viel|reichlich)/i,
];

const PORTION_EN = [
  /(?:eat|prefer|like)\s+(?:.*?)(small|large|big|normal)\s+(?:portions?|servings?|amounts?)/i,
  /(?:eat\s+(?:rather\s+)?)(little|a\s+lot|plenty)/i,
];

/**
 * Extract nutrition preferences from a single user message.
 * Returns preferences found (may be empty).
 */
export function extractNutritionPreferences(
  message: string,
  language: string,
): NutritionPreference[] {
  const prefs: NutritionPreference[] = [];
  const msg = message.trim();

  // Skip very short messages
  if (msg.length < 10) return prefs;

  const isDE = language === 'de';

  // Dislikes
  const dislikePatterns = isDE ? DISLIKE_DE : DISLIKE_EN;
  for (const pattern of dislikePatterns) {
    const match = msg.match(pattern);
    if (match?.[1]) {
      prefs.push({
        preference_type: 'disliked_ingredient',
        value: normalizeValue(match[1]),
        confidence: 0.7,
        source: 'buddy_chat',
      });
      break;
    }
  }

  // Likes
  const likePatterns = isDE ? LIKE_DE : LIKE_EN;
  for (const pattern of likePatterns) {
    const match = msg.match(pattern);
    if (match?.[1]) {
      prefs.push({
        preference_type: 'liked_ingredient',
        value: normalizeValue(match[1]),
        confidence: 0.7,
        source: 'buddy_chat',
      });
      break;
    }
  }

  // Cuisine
  const cuisinePatterns = isDE ? CUISINE_DE : CUISINE_EN;
  for (const pattern of cuisinePatterns) {
    const match = msg.match(pattern);
    if (match?.[1]) {
      prefs.push({
        preference_type: 'cuisine_preference',
        value: normalizeValue(match[1]),
        confidence: 0.7,
        source: 'buddy_chat',
      });
      break;
    }
  }

  // Cooking style
  const cookingPatterns = isDE ? COOKING_STYLE_DE : COOKING_STYLE_EN;
  for (const pattern of cookingPatterns) {
    const match = msg.match(pattern);
    if (match?.[1]) {
      prefs.push({
        preference_type: 'cooking_style',
        value: normalizeValue(match[1]),
        confidence: 0.7,
        source: 'buddy_chat',
      });
      break;
    }
  }

  // Portion size
  const portionPatterns = isDE ? PORTION_DE : PORTION_EN;
  for (const pattern of portionPatterns) {
    const match = msg.match(pattern);
    if (match?.[1]) {
      prefs.push({
        preference_type: 'portion_size',
        value: normalizeValue(match[1]),
        confidence: 0.6,
        source: 'buddy_chat',
      });
      break;
    }
  }

  return prefs;
}

// ── 2. Meal History Inference ─────────────────────────────────────────

// German stopwords for meal name tokenization
const STOPWORDS = new Set([
  'mit', 'und', 'ohne', 'ein', 'eine', 'einem', 'einen', 'einer', 'vom',
  'zum', 'auf', 'in', 'der', 'die', 'das', 'den', 'dem', 'des', 'von',
  'fuer', 'aus', 'nach', 'bei', 'ueber', 'unter', 'an', 'ca', 'circa',
  'ca.', 'g', 'ml', 'kg', 'stk', 'stueck', 'portion', 'portionen',
  'with', 'and', 'without', 'the', 'a', 'an', 'some', 'of', 'for', 'from',
  'small', 'large', 'big', 'medium', 'half', 'double', 'extra',
  'kcal', 'protein', 'kohlenhydrate', 'fett', 'gramm',
]);

// Common ingredient synonym mappings (value = canonical form)
const SYNONYMS: Record<string, string> = {
  haehnchen: 'haehnchen', huhn: 'haehnchen', chicken: 'haehnchen', poulet: 'haehnchen',
  'chicken breast': 'haehnchen', haehnchenbrust: 'haehnchen', haehnchenfilet: 'haehnchen',
  reis: 'reis', rice: 'reis', basmati: 'reis', jasmin: 'reis',
  lachs: 'lachs', salmon: 'lachs',
  thunfisch: 'thunfisch', tuna: 'thunfisch',
  ei: 'eier', eier: 'eier', egg: 'eier', eggs: 'eier',
  avocado: 'avocado', avocados: 'avocado',
  brokkoli: 'brokkoli', broccoli: 'brokkoli',
  kartoffel: 'kartoffel', kartoffeln: 'kartoffel', potato: 'kartoffel', potatoes: 'kartoffel',
  nudeln: 'nudeln', pasta: 'nudeln', spaghetti: 'nudeln', penne: 'nudeln',
  quark: 'quark', magerquark: 'quark', skyr: 'skyr',
  haferflocken: 'haferflocken', oats: 'haferflocken', porridge: 'haferflocken',
  tofu: 'tofu',
  spinat: 'spinat', spinach: 'spinat',
  rindfleisch: 'rindfleisch', beef: 'rindfleisch', steak: 'rindfleisch',
};

interface MealRow {
  name: string;
  date?: string;
}

/**
 * Infer liked ingredients from meal history (last 30 days).
 * Ingredients appearing 5+ times get preference status.
 */
export function inferFromMealHistory(meals: MealRow[]): NutritionPreference[] {
  if (!meals || meals.length < 5) return [];

  const counts: Record<string, number> = {};

  for (const meal of meals) {
    const tokens = tokenizeMealName(meal.name);
    // Use a Set to avoid counting the same ingredient twice per meal
    const unique = new Set(tokens);
    for (const token of unique) {
      counts[token] = (counts[token] || 0) + 1;
    }
  }

  const prefs: NutritionPreference[] = [];
  for (const [ingredient, count] of Object.entries(counts)) {
    if (count >= 5) {
      prefs.push({
        preference_type: 'liked_ingredient',
        value: ingredient,
        confidence: mealCountToConfidence(count),
        source: 'inferred',
      });
    }
  }

  // Sort by count descending, take top 15
  return prefs
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 15);
}

function tokenizeMealName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-zäöüß\s-]/g, '') // Keep letters + umlauts
    .split(/[\s\-,]+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
    .map(w => SYNONYMS[w] ?? w);
}

function mealCountToConfidence(count: number): number {
  // 5 → 0.5, 10 → 0.7, 15 → 0.8, 20+ → 0.9
  return Math.min(0.9, 0.3 + count * 0.04);
}

// ── 3. Recipe Tag Inference ───────────────────────────────────────────

interface RecipeRow {
  tags?: string[];
}

/**
 * Infer dietary patterns from user recipe tags.
 * Tags appearing on 3+ recipes become preferences.
 */
export function inferFromRecipes(recipes: RecipeRow[]): NutritionPreference[] {
  if (!recipes || recipes.length < 3) return [];

  const tagCounts: Record<string, number> = {};
  for (const recipe of recipes) {
    if (!recipe.tags) continue;
    for (const tag of recipe.tags) {
      const normalized = tag.toLowerCase().trim();
      if (normalized.length >= 3) {
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      }
    }
  }

  const prefs: NutritionPreference[] = [];
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count >= 3) {
      prefs.push({
        preference_type: 'dietary_pattern',
        value: tag,
        confidence: recipeCountToConfidence(count),
        source: 'inferred',
      });
    }
  }

  return prefs.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

function recipeCountToConfidence(count: number): number {
  // 3 → 0.5, 5 → 0.7, 10+ → 0.9
  return Math.min(0.9, 0.3 + count * 0.06);
}

// ── 4. Confidence Management ──────────────────────────────────────────

/**
 * Calculate confidence score based on occurrence count and recency.
 */
export function calculateConfidence(
  occurrenceCount: number,
  lastSeenAt: Date,
  source: PreferenceSource,
): number {
  // Base confidence from repetition (caps at 0.9)
  const base = Math.min(0.9, 0.3 + occurrenceCount * 0.1);

  // Time decay: 90-day half-life, floor at 0.3
  const daysSince = Math.max(0, (Date.now() - lastSeenAt.getTime()) / (1000 * 60 * 60 * 24));
  const decay = Math.max(0.3, 1.0 - daysSince / 90);

  let confidence = base * decay;

  // Explicit/chat sources get a bonus
  if (source === 'explicit' || source === 'buddy_chat') {
    confidence = Math.min(1.0, confidence + 0.2);
  }

  return Math.round(confidence * 100) / 100; // 2 decimal places
}

// ── 5. Upsert Logic ──────────────────────────────────────────────────

/**
 * Upsert preferences into the database.
 * On conflict: increment occurrence_count, recalculate confidence.
 */
export async function upsertPreferences(
  userId: string,
  prefs: NutritionPreference[],
): Promise<void> {
  if (prefs.length === 0) return;

  try {
    const now = new Date().toISOString();

    // Upsert each preference individually (Supabase doesn't support
    // complex ON CONFLICT DO UPDATE with expressions easily)
    for (const pref of prefs) {
      // Check if exists
      const { data: existing } = await supabase
        .from('user_nutrition_preferences')
        .select('id, occurrence_count, source')
        .eq('user_id', userId)
        .eq('preference_type', pref.preference_type)
        .eq('value', pref.value)
        .single();

      if (existing) {
        // Update: increment count, recalculate confidence
        const newCount = existing.occurrence_count + 1;
        // Keep the higher-priority source (explicit > buddy_chat > inferred)
        const bestSource = prioritizeSource(existing.source as PreferenceSource, pref.source);
        const newConfidence = calculateConfidence(newCount, new Date(), bestSource);

        await supabase
          .from('user_nutrition_preferences')
          .update({
            occurrence_count: newCount,
            confidence: newConfidence,
            source: bestSource,
            last_seen_at: now,
            updated_at: now,
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('user_nutrition_preferences')
          .insert({
            user_id: userId,
            preference_type: pref.preference_type,
            value: pref.value,
            confidence: pref.confidence,
            source: pref.source,
            occurrence_count: 1,
            last_seen_at: now,
          });
      }
    }

    // Enforce max preferences limit — delete lowest confidence
    await enforceLimit(userId);
  } catch (err) {
    console.warn('[PreferenceEngine] Upsert error:', err);
  }
}

function prioritizeSource(existing: PreferenceSource, incoming: PreferenceSource): PreferenceSource {
  const priority: Record<PreferenceSource, number> = { explicit: 3, buddy_chat: 2, inferred: 1 };
  return priority[incoming] >= priority[existing] ? incoming : existing;
}

async function enforceLimit(userId: string): Promise<void> {
  const { count } = await supabase
    .from('user_nutrition_preferences')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (count && count > MAX_PREFERENCES_PER_USER) {
    // Delete lowest confidence entries
    const toDelete = count - MAX_PREFERENCES_PER_USER;
    const { data: lowest } = await supabase
      .from('user_nutrition_preferences')
      .select('id')
      .eq('user_id', userId)
      .order('confidence', { ascending: true })
      .limit(toDelete);

    if (lowest && lowest.length > 0) {
      await supabase
        .from('user_nutrition_preferences')
        .delete()
        .in('id', lowest.map(r => r.id));
    }
  }
}

// ── 6. Daily Batch Inference ──────────────────────────────────────────

/**
 * Run daily preference inference from meal history + recipes.
 * Guarded by localStorage timestamp (max once per 24h).
 */
export async function runDailyPreferenceInference(userId: string): Promise<void> {
  try {
    // Guard: only run once per 24h
    const lastRun = localStorage.getItem(LS_INFERENCE_KEY);
    if (lastRun) {
      const elapsed = Date.now() - parseInt(lastRun, 10);
      if (elapsed < 24 * 60 * 60 * 1000) return; // < 24h
    }

    // Fetch last 30 days of meals
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: meals } = await supabase
      .from('meals')
      .select('name, date')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Fetch all user recipes (not just favorites)
    const { data: recipes } = await supabase
      .from('recipes')
      .select('tags')
      .eq('user_id', userId);

    const allPrefs: NutritionPreference[] = [];

    if (meals && meals.length >= 5) {
      allPrefs.push(...inferFromMealHistory(meals));
    }

    if (recipes && recipes.length >= 3) {
      allPrefs.push(...inferFromRecipes(recipes));
    }

    if (allPrefs.length > 0) {
      await upsertPreferences(userId, allPrefs);
    }

    // Mark as done
    localStorage.setItem(LS_INFERENCE_KEY, String(Date.now()));
  } catch (err) {
    console.warn('[PreferenceEngine] Daily inference error:', err);
  }
}

/**
 * Check if daily inference should run (>24h since last run).
 */
export function shouldRunDailyInference(): boolean {
  const lastRun = localStorage.getItem(LS_INFERENCE_KEY);
  if (!lastRun) return true;
  return Date.now() - parseInt(lastRun, 10) > 24 * 60 * 60 * 1000;
}

// ── Helpers ───────────────────────────────────────────────────────────

function normalizeValue(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]+$/, '') // Remove trailing punctuation
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .slice(0, 60);             // Cap length
}
