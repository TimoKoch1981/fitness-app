/**
 * UserAvatar — Read-only avatar display component.
 *
 * Shows the user's avatar image or a gradient fallback with User icon.
 * Used in chat messages and other places where avatar is displayed.
 */

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
} as const;

const ICON_SIZES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-6 w-6',
} as const;

export function UserAvatar({ avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClass = SIZES[size];
  const iconSize = ICON_SIZES[size];
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center ${className}`}>
      <User className={`${iconSize} text-white`} />
    </div>
  );
}
