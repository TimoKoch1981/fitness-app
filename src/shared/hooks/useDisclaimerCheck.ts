import { useState, useEffect, useCallback } from 'react';
import { useProfile, useUpdateProfile } from '../../features/auth/hooks/useProfile';

const STORAGE_KEY_PREFIX = 'fitbuddy-disclaimer-';

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Checks whether the user has accepted the disclaimer.
 * Fast path: localStorage (no network). Slow path: profile DB.
 * Returns accepted=null while loading.
 */
export function useDisclaimerCheck(userId: string | undefined) {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) {
      setAccepted(null);
      return;
    }

    // Fast path: check localStorage
    const cached = localStorage.getItem(getStorageKey(userId));
    if (cached) {
      setAccepted(true);
      return;
    }

    // Slow path: wait for profile from DB
    if (profileLoading) return;

    if (profile?.disclaimer_accepted_at) {
      // DB says accepted → warm up localStorage cache
      localStorage.setItem(getStorageKey(userId), profile.disclaimer_accepted_at);
      setAccepted(true);
    } else {
      setAccepted(false);
    }
  }, [userId, profile, profileLoading]);

  const markAccepted = useCallback(() => {
    if (!userId) return;
    const now = new Date().toISOString();
    // Optimistic: update localStorage + state immediately
    localStorage.setItem(getStorageKey(userId), now);
    setAccepted(true);
    // Persist to DB
    updateProfile.mutate({ disclaimer_accepted_at: now });
  }, [userId, updateProfile]);

  return { accepted, markAccepted };
}
