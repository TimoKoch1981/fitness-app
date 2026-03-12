/**
 * BuddyAvatar — Central avatar component for the KI-Buddy.
 *
 * Renders the buddy's avatar based on the user's chosen variant (coach/trainer/sensei)
 * and the current emotional state. Tries multiple image formats (.webp → .png → .jpg).
 * Falls back to styled gradient circle with initials when no image is available.
 *
 * For the FAB idle state, an optional looping video can be displayed instead of
 * a static image (if a .mp4 file exists for the variant).
 *
 * Usage:
 *   <BuddyAvatar size="fab" />           // reads variant from profile
 *   <BuddyAvatar size="sm" variant="trainer" />  // explicit variant (e.g. settings preview)
 */
import { useState, useRef, useEffect } from 'react';
import type { BuddyAvatarStyle } from '../../types/health';

export type BuddyState = 'idle' | 'thinking' | 'celebrating' | 'encouraging' | 'concerned' | 'explaining' | 'greeting';
export type BuddySize = 'xs' | 'sm' | 'md' | 'lg' | 'fab' | 'preview';

interface VariantConfig {
  initials: string;
  gradient: string;
  ring: string;
  pingColor: string;
  label: { de: string; en: string };
  description: { de: string; en: string };
}

export const BUDDY_VARIANTS: Record<BuddyAvatarStyle, VariantConfig> = {
  coach: {
    initials: 'C',
    gradient: 'from-teal-500 to-emerald-600',
    ring: 'ring-teal-400',
    pingColor: 'bg-teal-400',
    label: { de: 'Coach', en: 'Coach' },
    description: { de: 'Freundlich & motivierend', en: 'Friendly & motivating' },
  },
  trainer: {
    initials: 'T',
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'ring-blue-400',
    pingColor: 'bg-blue-400',
    label: { de: 'Trainer', en: 'Trainer' },
    description: { de: 'Fordernd & energetisch', en: 'Demanding & energetic' },
  },
  sensei: {
    initials: 'S',
    gradient: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-400',
    pingColor: 'bg-amber-400',
    label: { de: 'Sensei', en: 'Sensei' },
    description: { de: 'Ruhig & weise', en: 'Calm & wise' },
  },
};

const SIZE_CLASSES: Record<BuddySize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  fab: 'w-14 h-14',
  preview: 'w-20 h-20',
};

const TEXT_SIZE: Record<BuddySize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  fab: 'text-lg',
  preview: 'text-2xl',
};

/** Image formats to try, in order of preference */
const IMG_FORMATS = ['webp', 'png', 'jpg'] as const;

interface BuddyAvatarProps {
  size?: BuddySize;
  state?: BuddyState;
  variant?: BuddyAvatarStyle;
  showRing?: boolean;
  className?: string;
  /** Override content inside (e.g. agent icon emoji) */
  agentIcon?: string;
  /** Show video loop instead of static image (for FAB idle) */
  useVideo?: boolean;
}

export function BuddyAvatar({
  size = 'md',
  state = 'idle',
  variant = 'coach',
  showRing = false,
  className = '',
  agentIcon,
  useVideo = false,
}: BuddyAvatarProps) {
  const config = BUDDY_VARIANTS[variant] ?? BUDDY_VARIANTS.coach;
  const sizeClass = SIZE_CLASSES[size];
  const textClass = TEXT_SIZE[size];

  // Image loading with format fallback chain
  const [formatIdx, setFormatIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgSrc = `/buddy/${variant}-${state}.${IMG_FORMATS[formatIdx]}`;

  // Video support
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoSrc = `/buddy/${variant}-${state}.mp4`;
  const showVideo = useVideo && state === 'idle' && !videoError;

  // Reset states when variant or state changes
  useEffect(() => {
    setFormatIdx(0);
    setImgLoaded(false);
    setImgError(false);
    setVideoLoaded(false);
    setVideoError(false);
  }, [variant, state]);

  const handleImgError = () => {
    // Try next format
    if (formatIdx < IMG_FORMATS.length - 1) {
      setFormatIdx(prev => prev + 1);
    } else {
      // All formats failed
      setImgError(true);
    }
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 ${sizeClass} ${
        showRing ? `ring-2 ${config.ring} ring-offset-1` : ''
      } ${className}`}
    >
      {/* Video layer — looping video for FAB idle state */}
      {showVideo && (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-300 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
        />
      )}

      {/* Image layer — shown when loaded, hidden when video is playing */}
      {!imgError && !(showVideo && videoLoaded) && (
        <img
          src={imgSrc}
          alt={`Buddy ${variant}`}
          className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImgLoaded(true)}
          onError={handleImgError}
          loading={state === 'idle' ? 'eager' : 'lazy'}
        />
      )}

      {/* Fallback gradient with initials — visible when no image/video loaded */}
      <div
        className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center transition-opacity duration-300 ${
          (imgLoaded && !imgError) || (showVideo && videoLoaded) ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className={`text-white font-bold ${textClass} leading-none`}>
          {agentIcon || config.initials}
        </span>
      </div>
    </div>
  );
}
