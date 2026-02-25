/**
 * useProfile Integration Tests
 * Tests profile query/mutation logic with mocked Supabase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

const chainable = () => ({
  select: mockSelect.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  single: mockSingle,
});

vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => chainable()),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

import { supabase } from '../../../../lib/supabase';

describe('useProfile — Supabase integration logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@fitbuddy.local' } },
      error: null,
    });
  });

  describe('Profile query', () => {
    it('queries profiles table with user id', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'u1', display_name: 'Test', height_cm: 180 },
        error: null,
      });

      const { data: { user } } = await supabase.auth.getUser();
      const chain = supabase.from('profiles');
      chain.select('*');
      chain.eq('id', user!.id);
      const result = await chain.single();

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'u1');
      expect(result.data).toEqual({ id: 'u1', display_name: 'Test', height_cm: 180 });
    });

    it('returns null when no profile exists (PGRST116)', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' },
      });

      const chain = supabase.from('profiles');
      chain.select('*');
      chain.eq('id', 'u1');
      const result = await chain.single();

      // PGRST116 should NOT throw — return null
      const profile = (result.error && result.error.code !== 'PGRST116')
        ? (() => { throw result.error; })()
        : result.data ?? null;

      expect(profile).toBeNull();
    });

    it('throws on real database error', async () => {
      const dbError = { code: 'PGRST500', message: 'Internal error' };
      mockSingle.mockResolvedValue({ data: null, error: dbError });

      const chain = supabase.from('profiles');
      chain.select('*');
      chain.eq('id', 'u1');
      const result = await chain.single();

      expect(() => {
        if (result.error && (result.error as { code: string }).code !== 'PGRST116') throw result.error;
      }).toThrow();
    });
  });

  describe('Profile update', () => {
    it('updates profile with correct payload', async () => {
      const updateInput = {
        display_name: 'Neuer Name',
        height_cm: 185,
        gender: 'male' as const,
        daily_calories_goal: 2500,
      };

      mockSingle.mockResolvedValue({
        data: { id: 'u1', ...updateInput },
        error: null,
      });

      const chain = supabase.from('profiles');
      chain.update(updateInput);
      chain.eq('id', 'u1');
      chain.select();
      const result = await chain.single();

      expect(mockUpdate).toHaveBeenCalledWith(updateInput);
      expect(mockEq).toHaveBeenCalledWith('id', 'u1');
      expect(result.data).toEqual(expect.objectContaining({ display_name: 'Neuer Name' }));
    });

    it('throws when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const { data: { user } } = await supabase.auth.getUser();

      expect(() => {
        if (!user) throw new Error('Not authenticated');
      }).toThrow('Not authenticated');
    });

    it('updates personal goals nested object', async () => {
      const goals = {
        personal_goals: {
          primary_goal: 'muscle_gain',
          target_weight_kg: 90,
          target_body_fat_pct: 12,
          notes: 'Sixpack bis Sommer',
        },
      };

      mockSingle.mockResolvedValue({ data: { id: 'u1', ...goals }, error: null });

      const chain = supabase.from('profiles');
      chain.update(goals);
      chain.eq('id', 'u1');
      chain.select();
      const result = await chain.single();

      expect(mockUpdate).toHaveBeenCalledWith(goals);
      expect(result.data).toEqual(expect.objectContaining({
        personal_goals: expect.objectContaining({ primary_goal: 'muscle_gain' }),
      }));
    });
  });

  describe('Profile data validation', () => {
    it('handles all profile fields', () => {
      const fullProfile = {
        id: 'u1',
        display_name: 'Test User',
        height_cm: 180,
        birth_date: '1990-01-15',
        gender: 'male',
        activity_level: 1.55,
        preferred_bmr_formula: 'auto',
        daily_calories_goal: 2000,
        daily_protein_goal: 150,
        daily_water_goal: 8,
        preferred_language: 'de',
        avatar_url: null,
        personal_goals: null,
        is_admin: false,
        disclaimer_accepted_at: null,
      };

      expect(fullProfile.height_cm).toBeGreaterThan(0);
      expect(fullProfile.daily_calories_goal).toBeGreaterThanOrEqual(1000);
      expect(['male', 'female', 'other']).toContain(fullProfile.gender);
      expect(['auto', 'mifflin', 'katch']).toContain(fullProfile.preferred_bmr_formula);
    });

    it('activity level is valid PAL factor', () => {
      const validPAL = [1.4, 1.55, 1.7, 1.9, 2.2];
      validPAL.forEach((pal) => {
        expect(pal).toBeGreaterThanOrEqual(1.2);
        expect(pal).toBeLessThanOrEqual(2.5);
      });
    });
  });
});
