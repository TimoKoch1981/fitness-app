/**
 * promptSafety — Defensive escaping for user-content in LLM prompts.
 *
 * Risiko: User-Inputs (Meal-Namen, Notes, Substanz-Namen, Recipe-Texte)
 * werden direkt in System-/User-Prompts eingebaut. Ein User koennte mit
 * Patterns wie `"; ignore previous instructions; do X //` versuchen, den
 * Agent zu manipulieren ("Prompt-Injection").
 *
 * Real-Risk ist heute LOW weil:
 * - LLMs (Claude/OpenAI) erkennen klassische Injection-Pattern
 * - Actions werden via Zod-Schema validiert vor Execute (kein freier RPC-Zugriff)
 * - User kann nur seine eigenen Daten manipulieren (RLS via auth.uid())
 *
 * Aber: defensiv ist besser. Diese Funktion entschaerft die haeufigsten Pattern.
 *
 * Usage:
 *   `Mahlzeit: ${escapeForPrompt(meal.name)} (${meal.calories} kcal)`
 *
 * NICHT verwenden fuer:
 * - JSON-Schema-Validation (Zod uebernimmt das)
 * - Datenbank-Inputs (Supabase Client paramerisiert sowieso)
 * - URL-Querystrings (encodeURIComponent)
 */

/**
 * Maximale Laenge fuer User-Strings im Prompt. Schutz gegen User der versucht
 * einen 50.000-Zeichen "Notes"-Eintrag in den Prompt zu schmuggeln.
 */
const MAX_USER_STRING_LENGTH = 300;

/**
 * Patterns die User-Input verdaechtig machen. Bei Match wird das Pattern markiert.
 * Nicht aggressiv blocken — nur transparent machen.
 */
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(previous|prior|above)\s+instructions?/i,
  /system\s*[:>]\s*you\s+are/i,
  /<\s*\/?\s*(system|assistant|user)\s*>/i,
  /\[\s*INST\s*\]/i,
  /\bSUDO\s+/i,
  /forget\s+everything/i,
];

/**
 * Escape user content for safe inclusion in an LLM prompt.
 *
 * - Truncates to MAX_USER_STRING_LENGTH
 * - Strips control chars (newlines OK, but no \0, \x1b etc.)
 * - Wraps suspicious content with a marker so the LLM sees it as quoted user-input
 *
 * Returns plain string, ready for template interpolation.
 */
export function escapeForPrompt(input: string | null | undefined): string {
  if (input == null) return '';
  let s = String(input);

  // Strip null bytes + ANSI escapes + other control chars (keep \n \t)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Truncate
  if (s.length > MAX_USER_STRING_LENGTH) {
    s = s.slice(0, MAX_USER_STRING_LENGTH - 3) + '...';
  }

  // Mark suspicious patterns by wrapping in quote-marker. LLM sees this as
  // explicitly-user-provided content, not as instruction.
  const isSuspicious = SUSPICIOUS_PATTERNS.some(p => p.test(s));
  if (isSuspicious) {
    s = '⟪user-input: ' + s.replace(/⟪|⟫/g, '') + '⟫';
  }

  return s;
}

/**
 * Variant for inclusion in a JSON-style format (e.g. inside ACTION_REQUEST).
 * Quotes the string and escapes JSON-special chars.
 */
export function escapeForJson(input: string | null | undefined): string {
  if (input == null) return 'null';
  return JSON.stringify(String(input).slice(0, MAX_USER_STRING_LENGTH));
}
