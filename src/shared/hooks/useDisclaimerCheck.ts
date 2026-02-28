import { useState, useEffect, useCallback } from 'react';
import { useProfile, useUpdateProfile } from '../../features/auth/hooks/useProfile';

const STORAGE_KEY_PREFIX = 'fitbuddy-consent-v2-';

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Checks whether the user has accepted ALL granular consents.
 *
 * DSGVO-konform: 3 separate Einwilligungen erforderlich:
 * 1. consent_health_data_at  — Art. 9 Abs. 2 lit. a (Gesundheitsdaten)
 * 2. consent_ai_processing_at — KI-Verarbeitung (Daten an LLM)
 * 3. consent_third_country_at — Art. 49 (Drittlandtransfer USA)
 *
 * Alle 3 muessen gesetzt sein → App nutzbar.
 *
 * Fast path: localStorage (no network). Slow path: profile DB.
 * Returns accepted=null while loading.
 *
 * NOTE: Users who accepted the old single disclaimer (disclaimer_accepted_at)
 * but NOT the granular consents will see the modal again.
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

    // Fast path: check localStorage for v2 consent
    const cached = localStorage.getItem(getStorageKey(userId));
    if (cached === 'all_consents_granted') {
      setAccepted(true);
      return;
    }

    // Slow path: wait for profile from DB
    if (profileLoading) return;

    // Check ALL 3 granular consents
    const allConsentsGranted =
      !!profile?.consent_health_data_at &&
      !!profile?.consent_ai_processing_at &&
      !!profile?.consent_third_country_at;

    if (allConsentsGranted) {
      // DB says all consents granted → warm up localStorage cache
      localStorage.setItem(getStorageKey(userId), 'all_consents_granted');
      setAccepted(true);
    } else {
      setAccepted(false);
    }
  }, [userId, profile, profileLoading]);

  const markAccepted = useCallback(() => {
    if (!userId) return;
    const now = new Date().toISOString();
    // Optimistic: update localStorage + state immediately
    localStorage.setItem(getStorageKey(userId), 'all_consents_granted');
    setAccepted(true);
    // Persist ALL consents + legacy disclaimer_accepted_at to DB
    updateProfile.mutate({
      disclaimer_accepted_at: now,
      consent_health_data_at: now,
      consent_ai_processing_at: now,
      consent_third_country_at: now,
    });
  }, [userId, updateProfile]);

  return { accepted, markAccepted };
}
