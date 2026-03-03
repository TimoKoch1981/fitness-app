/**
 * useImagePreload — Preloads an image using the Image() constructor.
 *
 * Useful for above-the-fold images or hero images that need to be
 * visible immediately without lazy-loading delay.
 *
 * Returns the loading state, any error, and the resolved src URL.
 */

import { useState, useEffect } from 'react';

export interface UseImagePreloadResult {
  /** Whether the image has finished loading */
  isLoaded: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** The source URL (same as input, available after load) */
  src: string | null;
}

/**
 * Preload an image in the background using the Image() constructor.
 *
 * @param url - Image URL to preload (pass empty string or undefined to skip)
 * @returns { isLoaded, error, src }
 */
export function useImagePreload(url: string | undefined): UseImagePreloadResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setIsLoaded(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoaded(false);
    setError(null);

    const img = new Image();

    img.onload = () => {
      if (!cancelled) {
        setIsLoaded(true);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setError('Failed to load image');
        setIsLoaded(false);
      }
    };

    img.src = url;

    // If image is already cached, onload fires synchronously
    if (img.complete) {
      setIsLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [url]);

  return {
    isLoaded,
    error,
    src: isLoaded ? (url ?? null) : null,
  };
}
