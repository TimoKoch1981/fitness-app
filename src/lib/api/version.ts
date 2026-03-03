/**
 * API versioning constants and helpers.
 *
 * Provides a central place to manage the current API version,
 * build versioned URLs, and detect deprecated versions.
 */

/** Current API version. */
export const API_VERSION = 'v1';

/** Base path for versioned API endpoints. */
export const API_BASE_PATH = `/api/${API_VERSION}`;

/** Header name used to communicate the API version. */
export const API_VERSION_HEADER = 'X-API-Version';

/** Header name for the client version (app build). */
export const CLIENT_VERSION_HEADER = 'X-Client-Version';

/** Header returned by the server when a version is deprecated. */
export const DEPRECATION_HEADER = 'X-Deprecated';

/** Supported API versions (newest first). */
const SUPPORTED_VERSIONS = ['v1'] as const;

/** Deprecated versions that are still functional but will be removed. */
const DEPRECATED_VERSIONS: string[] = [];

/**
 * Build a full API URL for a given path.
 *
 * @example getApiUrl('/meals') → '/api/v1/meals'
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_PATH}${cleanPath}`;
}

/**
 * Check whether a given API version is deprecated.
 */
export function isDeprecated(version: string): boolean {
  return DEPRECATED_VERSIONS.includes(version);
}

/**
 * Return the latest (current) supported API version string.
 */
export function getLatestVersion(): string {
  return SUPPORTED_VERSIONS[0];
}

/**
 * Check whether a given version string is still supported.
 */
export function isSupported(version: string): boolean {
  return (SUPPORTED_VERSIONS as readonly string[]).includes(version) ||
    DEPRECATED_VERSIONS.includes(version);
}
