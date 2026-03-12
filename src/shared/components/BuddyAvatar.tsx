/**
 * BuddyAvatar — Central avatar component for the KI-Buddy.
 *
 * Renders the buddy's avatar based on the user's chosen variant (coach/trainer/sensei)
 * and the current emotional state. Falls back to styled gradient circle with initials
 * when images are not yet available.
 *
 * Usage:
 *   <BuddyAvatar size="fab" />           // reads variant from profile
 *   <BuddyAvatar size="sm" variant="trainer" />  // explicit variant (e.g. settings preview)
 */
import { useState } from 'react';
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

interface BuddyAvatarProps {
  size?: BuddySize;
  state?: BuddyState;
  variant?: BuddyAvatarStyle;
  showRing?: boolean;
  className?: string;
  /** Override content inside (e.g. agent icon emoji) */
  agentIcon?: string;
}

export function BuddyAvatar({
  size = 'md',
  state = 'idle',
  variant = 'coach',
  showRing = false,
  className = '',
  agentIcon,
}: BuddyAvatarProps) {
  const config = BUDDY_VARIANTS[variant] ?? BUDDY_VARIANTS.coach;
  const sizeClass = SIZE_CLASSES[size];
  const textClass = TEXT_SIZE[size];

  // Try to load image from /buddy/{variant}-{state}.webp
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgSrc = `/buddy/${variant}-${state}.webp`;

  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 ${sizeClass} ${
        showRing ? `ring-2 ${config.ring} ring-offset-1` : ''
      } ${className}`}
    >
      {/* Image layer — shown when loaded, hidden on error */}
      {!imgError && (
        <img
          src={imgSrc}
          alt={`Buddy ${variant}`}
          className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          loading={state === 'idle' ? 'eager' : 'lazy'}
        />
      )}

      {/* Fallback gradient with initials — always rendered as base, visible when no image */}
      <div
        className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center transition-opacity duration-300 ${
          imgLoaded && !imgError ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className={`text-white font-bold ${textClass} leading-none`}>
          {agentIcon || config.initials}
        </span>
      </div>
    </div>
  );
}
