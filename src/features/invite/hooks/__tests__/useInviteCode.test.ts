import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateInviteCode,
  buildInviteLink,
  storeReferralCode,
  getStoredReferralCode,
  incrementReferralCount,
  getReferralCount,
} from '../useInviteCode';

describe('generateInviteCode', () => {
  it('generates a code in BUDDY-XXXX format', () => {
    const code = generateInviteCode('991acc4d-44d9-4021-b4cf-d788e44c3bb1');
    expect(code).toMatch(/^BUDDY-[A-Z2-9]{4}$/);
  });

  it('generates consistent codes for the same user ID', () => {
    const userId = '991acc4d-44d9-4021-b4cf-d788e44c3bb1';
    const code1 = generateInviteCode(userId);
    const code2 = generateInviteCode(userId);
    expect(code1).toBe(code2);
  });

  it('generates different codes for different user IDs', () => {
    const code1 = generateInviteCode('991acc4d-44d9-4021-b4cf-d788e44c3bb1');
    const code2 = generateInviteCode('913f0883-a511-44d9-8111-78dfd4eb5222');
    expect(code1).not.toBe(code2);
  });

  it('only uses non-ambiguous characters (no I, O, 0, 1)', () => {
    // Generate codes for many user IDs to check character set
    const testIds = Array.from({ length: 50 }, (_, i) =>
      `test-user-${i}-${Math.random().toString(36)}`
    );
    for (const id of testIds) {
      const code = generateInviteCode(id);
      const suffix = code.replace('BUDDY-', '');
      expect(suffix).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
    }
  });
});

describe('buildInviteLink', () => {
  it('builds a valid invite link', () => {
    const link = buildInviteLink('BUDDY-ABCD');
    expect(link).toContain('/join/BUDDY-ABCD');
  });

  it('uses the current origin', () => {
    const link = buildInviteLink('BUDDY-XY23');
    expect(link).toBe(`${window.location.origin}/join/BUDDY-XY23`);
  });
});

describe('referral code storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves a referral code', () => {
    storeReferralCode('BUDDY-TEST');
    expect(getStoredReferralCode()).toBe('BUDDY-TEST');
  });

  it('returns null when no referral code is stored', () => {
    expect(getStoredReferralCode()).toBeNull();
  });
});

describe('referral count', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts at zero for a new user', () => {
    expect(getReferralCount('user-123')).toBe(0);
  });

  it('increments and returns the new count', () => {
    const count1 = incrementReferralCount('user-456');
    expect(count1).toBe(1);

    const count2 = incrementReferralCount('user-456');
    expect(count2).toBe(2);

    expect(getReferralCount('user-456')).toBe(2);
  });
});
