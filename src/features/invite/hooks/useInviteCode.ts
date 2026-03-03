import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';

const REFERRAL_STORAGE_KEY = 'fitbuddy_referred_by';
const REFERRAL_COUNT_KEY = 'fitbuddy_referral_count';

/**
 * Generate a deterministic 4-char alphanumeric code from a user ID.
 * Uses a simple hash derived from the UUID characters.
 */
export function generateInviteCode(userId: string): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // Simple djb2 hash, keep as 32-bit int
  }
  // Make hash positive
  hash = Math.abs(hash);

  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CHARS[hash % CHARS.length];
    hash = Math.floor(hash / CHARS.length);
  }

  return `BUDDY-${code}`;
}

/**
 * Build the full invite link for a given code.
 */
export function buildInviteLink(code: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://fudda.de';
  return `${base}/join/${code}`;
}

/**
 * Store a referral code (called from JoinPage when a user visits an invite link).
 */
export function storeReferralCode(code: string): void {
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, code);
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

/**
 * Get the stored referral code (if any).
 */
export function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Increment the referral count for the current user.
 * In a real app this would be a DB counter; here we use localStorage as a placeholder.
 */
export function incrementReferralCount(userId: string): number {
  try {
    const key = `${REFERRAL_COUNT_KEY}_${userId}`;
    const current = parseInt(localStorage.getItem(key) ?? '0', 10);
    const next = current + 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 0;
  }
}

/**
 * Get the referral count for a user.
 */
export function getReferralCount(userId: string): number {
  try {
    const key = `${REFERRAL_COUNT_KEY}_${userId}`;
    return parseInt(localStorage.getItem(key) ?? '0', 10);
  } catch {
    return 0;
  }
}

/**
 * Hook: provides invite code, link, clipboard copy, and referral tracking.
 */
export function useInviteCode() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);

  const inviteCode = useMemo(() => {
    if (!user?.id) return '';
    return generateInviteCode(user.id);
  }, [user?.id]);

  const inviteLink = useMemo(() => {
    if (!inviteCode) return '';
    return buildInviteLink(inviteCode);
  }, [inviteCode]);

  const referredBy = useMemo(() => getStoredReferralCode(), []);

  // Load referral count on mount
  useEffect(() => {
    if (user?.id) {
      setReferralCount(getReferralCount(user.id));
    }
  }, [user?.id]);

  const copyToClipboard = useCallback(async () => {
    if (!inviteLink) return false;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      } catch {
        return false;
      }
    }
  }, [inviteLink]);

  return {
    inviteCode,
    inviteLink,
    copied,
    copyToClipboard,
    referredBy,
    referralCount,
  };
}
