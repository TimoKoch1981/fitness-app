import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export interface MFAEnrollment {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string; // data:image/svg+xml URI
    secret: string;
    uri: string;
  };
}

/**
 * Hook for MFA (Multi-Factor Authentication) with TOTP.
 * Supports: enroll, verify enrollment, unenroll, and login challenge.
 */
export function useMFA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if the current user has MFA enrolled.
   */
  const getMFAFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return { factors: [], error: error.message };
    return { factors: data?.totp ?? [], error: null };
  }, []);

  /**
   * Start MFA enrollment — returns QR code + secret.
   */
  const enrollMFA = useCallback(async (): Promise<{ enrollment: MFAEnrollment | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'FitBuddy Authenticator',
      });
      if (error) {
        setError(error.message);
        return { enrollment: null, error: error.message };
      }
      return { enrollment: data as MFAEnrollment, error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify enrollment with a TOTP code from the authenticator app.
   */
  const verifyEnrollment = useCallback(async (factorId: string, code: string): Promise<{ error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) {
        setError(challengeError.message);
        return { error: challengeError.message };
      }

      // Verify with the TOTP code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) {
        setError(verifyError.message);
        return { error: verifyError.message };
      }

      return { error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove MFA factor (unenroll).
   */
  const unenrollMFA = useCallback(async (factorId: string): Promise<{ error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        setError(error.message);
        return { error: error.message };
      }
      return { error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create and verify a MFA challenge during login.
   */
  const verifyChallenge = useCallback(async (factorId: string, code: string): Promise<{ error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) {
        setError(challengeError.message);
        return { error: challengeError.message };
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) {
        setError(verifyError.message);
        return { error: verifyError.message };
      }

      return { error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getMFAFactors,
    enrollMFA,
    verifyEnrollment,
    unenrollMFA,
    verifyChallenge,
  };
}
