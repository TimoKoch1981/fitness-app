import { describe, it, expect } from 'vitest';
import { calculateDaysSinceLastActivity } from '../useInactivityCheck';
import {
  pickMotivationMessage,
  getMessageTier,
  getTierKey,
  TIER_3_MESSAGES,
  TIER_5_MESSAGES,
  TIER_7_MESSAGES,
} from '../../utils/motivationMessages';

// ── calculateDaysSinceLastActivity ──────────────────────────────────

describe('calculateDaysSinceLastActivity', () => {
  it('returns null when both meal and workout gaps are null', () => {
    expect(calculateDaysSinceLastActivity(null, null)).toBe(null);
  });

  it('returns meal gap when workout gap is null', () => {
    expect(calculateDaysSinceLastActivity(5, null)).toBe(5);
  });

  it('returns workout gap when meal gap is null', () => {
    expect(calculateDaysSinceLastActivity(null, 3)).toBe(3);
  });

  it('returns the minimum of meal and workout gaps', () => {
    expect(calculateDaysSinceLastActivity(5, 3)).toBe(3);
    expect(calculateDaysSinceLastActivity(2, 7)).toBe(2);
  });

  it('returns 0 when both gaps are 0', () => {
    expect(calculateDaysSinceLastActivity(0, 0)).toBe(0);
  });
});

// ── getMessageTier ──────────────────────────────────────────────────

describe('getMessageTier', () => {
  it('returns tier 3 messages for 3-4 days inactivity', () => {
    expect(getMessageTier(3)).toBe(TIER_3_MESSAGES);
    expect(getMessageTier(4)).toBe(TIER_3_MESSAGES);
  });

  it('returns tier 5 messages for 5-6 days inactivity', () => {
    expect(getMessageTier(5)).toBe(TIER_5_MESSAGES);
    expect(getMessageTier(6)).toBe(TIER_5_MESSAGES);
  });

  it('returns tier 7 messages for 7+ days inactivity', () => {
    expect(getMessageTier(7)).toBe(TIER_7_MESSAGES);
    expect(getMessageTier(14)).toBe(TIER_7_MESSAGES);
    expect(getMessageTier(30)).toBe(TIER_7_MESSAGES);
  });
});

// ── pickMotivationMessage ───────────────────────────────────────────

describe('pickMotivationMessage', () => {
  it('picks a message from the correct tier for 3 days', () => {
    const msg = pickMotivationMessage(3);
    expect(TIER_3_MESSAGES).toContainEqual(msg);
  });

  it('picks a message from the correct tier for 7 days', () => {
    const msg = pickMotivationMessage(7);
    expect(TIER_7_MESSAGES).toContainEqual(msg);
  });

  it('returns a message with required fields', () => {
    const msg = pickMotivationMessage(5);
    expect(msg).toHaveProperty('textKey');
    expect(msg).toHaveProperty('actionRoute');
    expect(msg).toHaveProperty('actionLabelKey');
    expect(['/training', '/nutrition']).toContain(msg.actionRoute);
  });

  it('returns consistent results for the same day (date-seeded)', () => {
    const msg1 = pickMotivationMessage(3);
    const msg2 = pickMotivationMessage(3);
    expect(msg1).toEqual(msg2);
  });
});

// ── getTierKey ──────────────────────────────────────────────────────

describe('getTierKey', () => {
  it('returns gentle for 3-4 days', () => {
    expect(getTierKey(3)).toBe('gentle');
    expect(getTierKey(4)).toBe('gentle');
  });

  it('returns supportive for 5-6 days', () => {
    expect(getTierKey(5)).toBe('supportive');
    expect(getTierKey(6)).toBe('supportive');
  });

  it('returns reengagement for 7+ days', () => {
    expect(getTierKey(7)).toBe('reengagement');
    expect(getTierKey(30)).toBe('reengagement');
  });
});
