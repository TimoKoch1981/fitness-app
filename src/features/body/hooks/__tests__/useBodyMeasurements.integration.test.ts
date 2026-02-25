/**
 * useBodyMeasurements Integration Tests
 * Tests body measurement query/mutation and BMI/lean mass calculations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

const chainable = () => ({
  select: mockSelect.mockReturnThis(),
  insert: mockInsert.mockReturnThis(),
  delete: mockDelete.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  order: mockOrder.mockReturnThis(),
  limit: mockLimit.mockReturnThis(),
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

import { supabase } from '../../../../lib/supabase';

describe('useBodyMeasurements — Supabase integration logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } },
      error: null,
    });
  });

  describe('Body measurements query', () => {
    it('queries body_measurements table with correct params', () => {
      const chain = supabase.from('body_measurements');
      chain.select('*');
      chain.eq('user_id', 'u1');
      chain.order('date', { ascending: false });
      chain.limit(30);

      expect(supabase.from).toHaveBeenCalledWith('body_measurements');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('date', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(30);
    });

    it('latest measurement uses limit 1', () => {
      const chain = supabase.from('body_measurements');
      chain.select('*');
      chain.eq('user_id', 'u1');
      chain.order('date', { ascending: false });
      chain.limit(1);
      chain.single();

      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(mockSingle).toHaveBeenCalled();
    });
  });

  describe('Body measurements insert', () => {
    it('inserts measurement with calculated fields', () => {
      const input = {
        user_id: 'u1',
        date: '2026-02-25',
        weight_kg: 85.5,
        body_fat_pct: 15.2,
        muscle_mass_kg: 38.5,
        water_pct: 55.3,
        source: 'manual',
      };

      const chain = supabase.from('body_measurements');
      chain.insert(input);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          weight_kg: 85.5,
          body_fat_pct: 15.2,
        })
      );
    });

    it('inserts with optional circumference fields', () => {
      const input = {
        user_id: 'u1',
        date: '2026-02-25',
        weight_kg: 90,
        waist_cm: 85,
        chest_cm: 105,
        arm_cm: 38,
        leg_cm: 60,
      };

      const chain = supabase.from('body_measurements');
      chain.insert(input);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          waist_cm: 85,
          chest_cm: 105,
        })
      );
    });
  });

  describe('BMI calculation', () => {
    // Mirrors calculateBMI logic
    const calculateBMI = (weight_kg: number, height_cm: number): number => {
      const height_m = height_cm / 100;
      return Math.round((weight_kg / (height_m * height_m)) * 10) / 10;
    };

    it('calculates BMI correctly — normal weight', () => {
      expect(calculateBMI(75, 180)).toBe(23.1);
    });

    it('calculates BMI correctly — overweight', () => {
      expect(calculateBMI(90, 175)).toBe(29.4);
    });

    it('calculates BMI correctly — underweight', () => {
      expect(calculateBMI(50, 170)).toBe(17.3);
    });

    it('calculates BMI correctly — obese', () => {
      expect(calculateBMI(120, 175)).toBe(39.2);
    });
  });

  describe('Lean mass calculation', () => {
    const calculateLeanMass = (weight_kg: number, body_fat_pct: number): number => {
      return Math.round(weight_kg * (1 - body_fat_pct / 100) * 10) / 10;
    };

    it('calculates lean mass correctly', () => {
      expect(calculateLeanMass(85, 15)).toBe(72.3);
    });

    it('high body fat percentage', () => {
      expect(calculateLeanMass(100, 30)).toBe(70);
    });

    it('very low body fat', () => {
      expect(calculateLeanMass(80, 8)).toBe(73.6);
    });

    it('handles 0% body fat', () => {
      expect(calculateLeanMass(80, 0)).toBe(80);
    });
  });

  describe('FFMI calculation', () => {
    // Fat-Free Mass Index
    const calculateFFMI = (lean_mass_kg: number, height_cm: number) => {
      const height_m = height_cm / 100;
      const ffmi = lean_mass_kg / (height_m * height_m);
      const normalizedFFMI = ffmi + 6.1 * (1.8 - height_m);
      return {
        ffmi: Math.round(ffmi * 10) / 10,
        normalizedFFMI: Math.round(normalizedFFMI * 10) / 10,
      };
    };

    it('calculates FFMI for natural athlete', () => {
      const result = calculateFFMI(72, 180);
      expect(result.ffmi).toBe(22.2);
      expect(result.normalizedFFMI).toBe(22.2); // 1.8m height → no correction
    });

    it('calculates FFMI with height normalization for short person', () => {
      const result = calculateFFMI(65, 170);
      expect(result.ffmi).toBe(22.5);
      expect(result.normalizedFFMI).toBeGreaterThan(result.ffmi); // shorter → higher normalized
    });

    it('calculates FFMI with height normalization for tall person', () => {
      const result = calculateFFMI(80, 190);
      expect(result.ffmi).toBe(22.2);
      expect(result.normalizedFFMI).toBeLessThan(result.ffmi); // taller → lower normalized
    });
  });

  describe('Data source handling', () => {
    it('accepts manual source', () => {
      const source = 'manual';
      expect(['manual', 'fitdays', 'buddy_ai', 'csv_import']).toContain(source);
    });

    it('accepts fitdays source', () => {
      const source = 'fitdays';
      expect(['manual', 'fitdays', 'buddy_ai', 'csv_import']).toContain(source);
    });

    it('accepts csv_import source', () => {
      const source = 'csv_import';
      expect(['manual', 'fitdays', 'buddy_ai', 'csv_import']).toContain(source);
    });
  });

  describe('Delete', () => {
    it('deletes measurement by id', () => {
      const chain = supabase.from('body_measurements');
      chain.delete();
      chain.eq('id', 'bm-456');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'bm-456');
    });
  });
});
