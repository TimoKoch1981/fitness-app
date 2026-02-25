/**
 * Input validation & sanitization utilities.
 * Protects against XSS, SQL injection, and other input-based attacks.
 */

/** Strip HTML tags from input. */
export function stripHtml(input: string): string {
  return input.replace(/<\/?[a-z][^>]*>/gi, '').replace(/&#x?[0-9a-fA-F]+;/g, '');
}

/** Escape HTML entities to prevent XSS. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Check if input contains potential XSS patterns. */
export function containsXSS(input: string): boolean {
  // Create fresh regex each call to avoid stateful `g` flag + lastIndex issues
  return /<script\b[^>]*>[\s\S]*?<\/script>/i.test(input)
    || /\bon\w+\s*=/i.test(input)
    || /javascript\s*:/i.test(input)
    || /<img[^>]+onerror/i.test(input)
    || /<svg[^>]+onload/i.test(input);
}

/** Check if input contains potential SQL injection patterns. */
export function containsSQLInjection(input: string): boolean {
  const patterns = [
    /\b(DROP|ALTER|CREATE)\s+TABLE\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\s+SET\b/i,
    /\bUNION\s+(ALL\s+)?SELECT\b/i,
    /\bSELECT\s+.+\s+FROM\b/i,
    /\bEXEC(\s+|\()/i,
    /--\s*$/m,                // SQL line comment at end
    /\/\*[\s\S]*?\*\//,      // SQL block comment
  ];
  return patterns.some(re => re.test(input));
}

/** Sanitize text input: strip tags, enforce max length. */
export function sanitizeText(input: string, maxLength = 5000): string {
  let sanitized = input.trim();
  sanitized = stripHtml(sanitized);
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}

/** Validate input is safe (no XSS, no SQL injection, within length). */
export function isValidInput(input: string, maxLength = 5000): boolean {
  if (!input || input.length > maxLength) return false;
  if (containsXSS(input)) return false;
  if (containsSQLInjection(input)) return false;
  return true;
}
