/**
 * API client wrapper that adds versioning headers to requests.
 *
 * Wraps the Supabase client with version negotiation,
 * deprecation warning detection, and client version reporting.
 */

import {
  API_VERSION,
  API_VERSION_HEADER,
  CLIENT_VERSION_HEADER,
  DEPRECATION_HEADER,
} from './version';

/** Application build version (injected by Vite at build time). */
const CLIENT_VERSION = '1.0.0';

/**
 * Add API version headers to an existing headers object.
 *
 * @returns A new headers record with version headers appended.
 */
export function addVersionHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  return {
    ...headers,
    [API_VERSION_HEADER]: API_VERSION,
    [CLIENT_VERSION_HEADER]: CLIENT_VERSION,
  };
}

/**
 * Check response headers for deprecation warnings.
 *
 * @returns The deprecation message if present, otherwise null.
 */
export function checkDeprecation(
  headers: Headers | Record<string, string>,
): string | null {
  if (headers instanceof Headers) {
    return headers.get(DEPRECATION_HEADER);
  }
  return (headers as Record<string, string>)[DEPRECATION_HEADER] ?? null;
}

/**
 * Process a fetch Response to detect deprecation warnings.
 * Logs a console warning if the API signals deprecation.
 */
export function handleDeprecationResponse(response: Response): void {
  const deprecation = response.headers.get(DEPRECATION_HEADER);
  if (deprecation) {
    console.warn(
      `[API Deprecation] ${deprecation}. Please update to the latest API version.`,
    );
  }
}
