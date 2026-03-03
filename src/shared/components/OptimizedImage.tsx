/**
 * OptimizedImage — Reusable image component with performance optimizations.
 *
 * Features:
 * - Native lazy loading (loading="lazy") with IntersectionObserver fallback
 * - Blur placeholder while loading (CSS blur on low-opacity background)
 * - Responsive sizing via `sizes` attribute
 * - Error state with customizable fallback icon
 * - Fade-in animation on load (framer-motion)
 * - Accessible alt text support
 * - Optional aspect ratio container
 * - Priority mode to skip lazy loading (above-the-fold images)
 */

import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';

export interface OptimizedImageProps {
  /** Image source URL */
  src: string;
  /** Accessible alt text (required for a11y) */
  alt: string;
  /** Image width in pixels (sets width attribute) */
  width?: number;
  /** Image height in pixels (sets height attribute) */
  height?: number;
  /** Additional CSS class names */
  className?: string;
  /** Responsive sizes attribute (e.g. "(max-width: 640px) 100vw, 50vw") */
  sizes?: string;
  /** srcSet for responsive images */
  srcSet?: string;
  /** Aspect ratio string for the container (e.g. "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Custom fallback icon component for error state (default: ImageOff) */
  fallbackIcon?: React.ReactNode;
  /** Skip lazy loading — use for above-the-fold / hero images */
  priority?: boolean;
  /** Object-fit style (default: 'cover') */
  objectFit?: CSSProperties['objectFit'];
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  /** Additional inline styles for the image element */
  style?: CSSProperties;
}

/**
 * Optimized image component with lazy loading, fade-in animation,
 * blur placeholder, and error fallback.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  sizes,
  srcSet,
  aspectRatio,
  fallbackIcon,
  priority = false,
  objectFit = 'cover',
  onClick,
  style,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver fallback for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const el = containerRef.current;
    if (!el) return;

    // Check for native lazy loading support — if available, just render immediately
    if ('loading' in HTMLImageElement.prototype) {
      setIsInView(true);
      return;
    }

    // Fallback: use IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
  }, []);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Container style for aspect ratio
  const containerStyle: CSSProperties = aspectRatio
    ? { aspectRatio, position: 'relative', overflow: 'hidden' }
    : {};

  return (
    <div
      ref={containerRef}
      className={`optimized-image-container ${aspectRatio ? 'w-full' : ''}`}
      style={containerStyle}
    >
      {/* Blur placeholder background */}
      {!isLoaded && !hasError && isInView && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          aria-hidden="true"
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded">
          {fallbackIcon ?? (
            <ImageOff className="h-8 w-8 text-gray-300" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Actual image — only render when in view */}
      {isInView && !hasError && (
        <motion.img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          srcSet={srcSet}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
          className={className}
          style={{
            objectFit,
            ...style,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
