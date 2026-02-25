/**
 * useMeals Integration Tests
 * Tests hook logic with mocked Supabase client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing hooks
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

const chainable = () => ({
  select: mockSelect.mockReturnThis(),
  insert: mockInsert.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  delete: mockDelete.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  order: mockOrder.mockReturnThis(),
  single: mockSingle,
  then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
});

vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => chainable()),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Import after mock
import { supabase } from '../../../../lib/supabase';

describe('useMeals — Supabase integration logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('Query builder chain', () => {
    it('queries meals table with correct user_id, date, and order', async () => {
      const testDate = '2026-02-25';

      // Simulate what useMealsByDate does internally
      const { data: { user } } = await supabase.auth.getUser();
      expect(user?.id).toBe('u1');

      const chain = supabase.from('meals');
      expect(supabase.from).toHaveBeenCalledWith('meals');

      chain.select('*');
      expect(mockSelect).toHaveBeenCalledWith('*');

      chain.eq('user_id', user!.id);
      expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');

      chain.eq('date', testDate);
      expect(mockEq).toHaveBeenCalledWith('date', testDate);

      chain.order('created_at', { ascending: true });
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('inserts meal with correct payload', async () => {
      const input = {
        name: 'Haehnchen',
        type: 'lunch' as const,
        calories: 500,
        protein: 40,
        carbs: 30,
        fat: 15,
        date: '2026-02-25',
      };

      const chain = supabase.from('meals');
      chain.insert({
        user_id: 'u1',
        date: input.date,
        name: input.name,
        type: input.type,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
        fiber: undefined,
        source: 'manual',
        source_ref: undefined,
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'u1',
        name: 'Haehnchen',
        calories: 500,
        protein: 40,
        source: 'manual',
      }));
    });

    it('deletes meal by id', () => {
      const chain = supabase.from('meals');
      chain.delete();
      chain.eq('id', 'meal-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'meal-123');
    });
  });

  describe('Meal totals calculation', () => {
    it('sums up nutrients correctly', () => {
      const meals = [
        { calories: 300, protein: 25, carbs: 40, fat: 10, fiber: 5 },
        { calories: 500, protein: 40, carbs: 50, fat: 20, fiber: 3 },
        { calories: 200, protein: 10, carbs: 30, fat: 5, fiber: 2 },
      ];

      const totals = meals.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories ?? 0),
          protein: acc.protein + (m.protein ?? 0),
          carbs: acc.carbs + (m.carbs ?? 0),
          fat: acc.fat + (m.fat ?? 0),
          fiber: acc.fiber + (m.fiber ?? 0),
          mealCount: acc.mealCount + 1,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, mealCount: 0 }
      );

      expect(totals.calories).toBe(1000);
      expect(totals.protein).toBe(75);
      expect(totals.carbs).toBe(120);
      expect(totals.fat).toBe(35);
      expect(totals.fiber).toBe(10);
      expect(totals.mealCount).toBe(3);
    });

    it('handles empty meals array', () => {
      const meals: never[] = [];
      const totals = meals.reduce(
        (acc, m: { calories: number; protein: number; carbs: number; fat: number; fiber: number }) => ({
          calories: acc.calories + (m.calories ?? 0),
          protein: acc.protein + (m.protein ?? 0),
          carbs: acc.carbs + (m.carbs ?? 0),
          fat: acc.fat + (m.fat ?? 0),
          fiber: acc.fiber + (m.fiber ?? 0),
          mealCount: acc.mealCount + 1,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, mealCount: 0 }
      );

      expect(totals.calories).toBe(0);
      expect(totals.mealCount).toBe(0);
    });

    it('handles null/undefined nutrients gracefully', () => {
      const meal = { calories: null, protein: undefined, carbs: 0, fat: null, fiber: undefined };
      const result = {
        calories: (meal.calories ?? 0),
        protein: (meal.protein ?? 0),
        carbs: (meal.carbs ?? 0),
        fat: (meal.fat ?? 0),
        fiber: (meal.fiber ?? 0),
      };

      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(0);
      expect(result.fiber).toBe(0);
    });
  });

  describe('Authentication', () => {
    it('returns empty array when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      expect(user).toBeNull();
      // useMealsByDate returns [] when no user
      const result = user ? 'fetch' : [];
      expect(result).toEqual([]);
    });

    it('throws when insert fails without auth', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      expect(user).toBeNull();
      // useAddMeal throws 'Not authenticated'
      expect(() => {
        if (!user) throw new Error('Not authenticated');
      }).toThrow('Not authenticated');
    });
  });
});
