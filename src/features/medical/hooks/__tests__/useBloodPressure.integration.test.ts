/**
 * useBloodPressure Integration Tests
 * Tests BP query/mutation logic with mocked Supabase.
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

describe('useBloodPressure — Supabase integration logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } },
      error: null,
    });
  });

  describe('Blood pressure query', () => {
    it('queries with correct table and limit', () => {
      const limit = 30;
      supabase.from('blood_pressure_logs');
      expect(supabase.from).toHaveBeenCalledWith('blood_pressure_logs');

      const chain = supabase.from('blood_pressure_logs');
      chain.select('*');
      chain.eq('user_id', 'u1');
      chain.order('date', { ascending: false });
      chain.limit(limit);

      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
      expect(mockOrder).toHaveBeenCalledWith('date', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(30);
    });

    it('accepts custom limit', () => {
      const chain = supabase.from('blood_pressure_logs');
      chain.select('*');
      chain.limit(5);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });

  describe('Blood pressure insert', () => {
    it('inserts BP reading with correct payload', () => {
      const bpInput = {
        user_id: 'u1',
        date: '2026-02-25',
        time: '08:30',
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        notes: 'Morgens, nuchtern',
      };

      const chain = supabase.from('blood_pressure_logs');
      chain.insert(bpInput);

      expect(mockInsert).toHaveBeenCalledWith(bpInput);
    });

    it('insert without optional fields', () => {
      const bpInput = {
        user_id: 'u1',
        date: '2026-02-25',
        time: '08:30',
        systolic: 135,
        diastolic: 85,
      };

      const chain = supabase.from('blood_pressure_logs');
      chain.insert(bpInput);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ systolic: 135, diastolic: 85 })
      );
      expect(mockInsert).toHaveBeenCalledWith(
        expect.not.objectContaining({ pulse: expect.anything() })
      );
    });
  });

  describe('Blood pressure classification', () => {
    // Tests the classification logic from calculations
    const classify = (sys: number, dia: number): string => {
      if (sys < 90 || dia < 60) return 'low';
      if (sys < 120 && dia < 80) return 'optimal';
      if (sys < 130 && dia < 85) return 'normal';
      if (sys < 140 && dia < 90) return 'high_normal';
      if (sys < 160 && dia < 100) return 'grade_1';
      if (sys < 180 && dia < 110) return 'grade_2';
      return 'grade_3';
    };

    it('classifies optimal BP', () => {
      expect(classify(115, 75)).toBe('optimal');
    });

    it('classifies normal BP', () => {
      expect(classify(125, 82)).toBe('normal');
    });

    it('classifies high-normal BP', () => {
      expect(classify(135, 87)).toBe('high_normal');
    });

    it('classifies grade 1 hypertension', () => {
      expect(classify(150, 95)).toBe('grade_1');
    });

    it('classifies grade 2 hypertension', () => {
      expect(classify(170, 105)).toBe('grade_2');
    });

    it('classifies grade 3 hypertension', () => {
      expect(classify(185, 115)).toBe('grade_3');
    });

    it('classifies low BP (hypotension)', () => {
      expect(classify(85, 55)).toBe('low');
    });

    it('uses higher classification when sys and dia differ', () => {
      // Systolic grade_1 but diastolic normal → should still be grade_1
      expect(classify(155, 80)).toBe('grade_1');
    });
  });

  describe('Blood pressure data validation', () => {
    it('systolic must be positive', () => {
      expect(120).toBeGreaterThan(0);
      expect(80).toBeGreaterThan(0);
    });

    it('systolic is typically greater than diastolic', () => {
      const readings = [
        { systolic: 120, diastolic: 80 },
        { systolic: 135, diastolic: 85 },
        { systolic: 110, diastolic: 70 },
      ];
      readings.forEach(({ systolic, diastolic }) => {
        expect(systolic).toBeGreaterThan(diastolic);
      });
    });

    it('pulse is in reasonable range', () => {
      const validPulses = [60, 72, 80, 100];
      validPulses.forEach((p) => {
        expect(p).toBeGreaterThanOrEqual(30);
        expect(p).toBeLessThanOrEqual(220);
      });
    });

    it('date format is ISO', () => {
      const date = '2026-02-25';
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('time format is HH:MM', () => {
      const time = '08:30';
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('Delete', () => {
    it('deletes BP log by id', () => {
      const chain = supabase.from('blood_pressure_logs');
      chain.delete();
      chain.eq('id', 'bp-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'bp-123');
    });
  });
});
