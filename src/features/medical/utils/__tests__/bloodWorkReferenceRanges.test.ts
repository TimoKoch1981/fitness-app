import { describe, it, expect } from 'vitest';
import {
  REFERENCE_RANGES,
  ALL_MARKER_KEYS,
  GROUP_ORDER,
  GROUP_LABELS,
  getReferenceRange,
  getMarkerStatus,
  getMarkersByGroup,
  type Gender,
} from '../bloodWorkReferenceRanges';

// ── Data Integrity ──────────────────────────────────────────────────────────

describe('REFERENCE_RANGES data integrity', () => {
  it('should have exactly 38 markers', () => {
    expect(ALL_MARKER_KEYS.length).toBe(39);
  });

  it('every marker has required fields', () => {
    for (const [key, ref] of Object.entries(REFERENCE_RANGES)) {
      expect(ref.unit).toBeTruthy();
      expect(ref.labelDE).toBeTruthy();
      expect(ref.labelEN).toBeTruthy();
      expect(GROUP_ORDER).toContain(ref.group);
      expect(ref.male).toBeDefined();
      expect(ref.male.low).toBeLessThanOrEqual(ref.male.high);
      // female can be null (e.g. PSA)
      if (ref.female !== null) {
        expect(ref.female.low).toBeLessThanOrEqual(ref.female.high);
      }
    }
  });

  it('all 8 groups have labels in DE and EN', () => {
    for (const group of GROUP_ORDER) {
      expect(GROUP_LABELS[group].de).toBeTruthy();
      expect(GROUP_LABELS[group].en).toBeTruthy();
    }
  });

  it('PSA and free_psa have null female ranges', () => {
    expect(REFERENCE_RANGES.psa.female).toBeNull();
    expect(REFERENCE_RANGES.free_psa.female).toBeNull();
  });
});

// ── getReferenceRange ───────────────────────────────────────────────────────

describe('getReferenceRange', () => {
  it('returns null for unknown marker', () => {
    expect(getReferenceRange('nonexistent')).toBeNull();
  });

  it('returns male base range by default', () => {
    const range = getReferenceRange('hemoglobin');
    expect(range).toEqual({ low: 13.5, high: 17.5 });
  });

  it('returns female base range', () => {
    const range = getReferenceRange('hemoglobin', 'female');
    expect(range).toEqual({ low: 12.0, high: 16.0 });
  });

  it('treats "other" gender as male', () => {
    const rangeMale = getReferenceRange('creatinine', 'male');
    const rangeOther = getReferenceRange('creatinine', 'other');
    expect(rangeOther).toEqual(rangeMale);
  });

  it('returns null for PSA when gender is female', () => {
    expect(getReferenceRange('psa', 'female')).toBeNull();
  });

  it('returns PSA range for male', () => {
    const range = getReferenceRange('psa', 'male');
    expect(range).toBeDefined();
    expect(range!.low).toBe(0);
  });

  // ── Age-based ranges ────────────────────────────────────────────────────

  describe('age-based overrides', () => {
    it('testosterone_total: young male (25) gets 300-1000', () => {
      const range = getReferenceRange('testosterone_total', 'male', 25);
      expect(range).toEqual({ low: 300, high: 1000 });
    });

    it('testosterone_total: middle-aged male (50) gets 250-900', () => {
      const range = getReferenceRange('testosterone_total', 'male', 50);
      expect(range).toEqual({ low: 250, high: 900 });
    });

    it('testosterone_total: older male (65) gets 200-800', () => {
      const range = getReferenceRange('testosterone_total', 'male', 65);
      expect(range).toEqual({ low: 200, high: 800 });
    });

    it('PSA: male 45 gets 0-2.5', () => {
      const range = getReferenceRange('psa', 'male', 45);
      expect(range).toEqual({ low: 0, high: 2.5 });
    });

    it('PSA: male 55 gets 0-3.5', () => {
      const range = getReferenceRange('psa', 'male', 55);
      expect(range).toEqual({ low: 0, high: 3.5 });
    });

    it('PSA: male 65 gets 0-4.5', () => {
      const range = getReferenceRange('psa', 'male', 65);
      expect(range).toEqual({ low: 0, high: 4.5 });
    });

    it('PSA: male 75 gets 0-6.5', () => {
      const range = getReferenceRange('psa', 'male', 75);
      expect(range).toEqual({ low: 0, high: 6.5 });
    });

    it('estradiol: premenopausal female (35) gets 30-400', () => {
      const range = getReferenceRange('estradiol', 'female', 35);
      expect(range).toEqual({ low: 30, high: 400 });
    });

    it('estradiol: postmenopausal female (60) gets 0-30', () => {
      const range = getReferenceRange('estradiol', 'female', 60);
      expect(range).toEqual({ low: 0, high: 30 });
    });

    it('FSH: postmenopausal female (55) gets high range', () => {
      const range = getReferenceRange('fsh', 'female', 55);
      expect(range).toEqual({ low: 23.0, high: 116.3 });
    });

    it('ferritin: postmenopausal female (55) gets 30-300', () => {
      const range = getReferenceRange('ferritin', 'female', 55);
      expect(range).toEqual({ low: 30, high: 300 });
    });

    it('ferritin: premenopausal female (30) gets 10-150', () => {
      const range = getReferenceRange('ferritin', 'female', 30);
      expect(range).toEqual({ low: 10, high: 150 });
    });

    it('falls back to base range if no age-bracket matches', () => {
      // testosterone_total male age 15 — no bracket starts before 18
      const range = getReferenceRange('testosterone_total', 'male', 15);
      // Falls back to base male range
      expect(range).toEqual({ low: 300, high: 1000 });
    });

    it('returns base range when age is not provided (even with age-brackets)', () => {
      const range = getReferenceRange('psa', 'male');
      expect(range).toEqual({ low: 0, high: 4 });
    });
  });
});

// ── getMarkerStatus ─────────────────────────────────────────────────────────

describe('getMarkerStatus', () => {
  it('returns null for unknown marker', () => {
    expect(getMarkerStatus(100, 'nonexistent')).toBeNull();
  });

  it('returns null for PSA female', () => {
    expect(getMarkerStatus(1.0, 'psa', 'female')).toBeNull();
  });

  it('returns "normal" for value within range', () => {
    // hemoglobin male: 13.5 - 17.5
    expect(getMarkerStatus(15.0, 'hemoglobin', 'male')).toBe('normal');
  });

  it('returns "normal" at exact low boundary', () => {
    expect(getMarkerStatus(13.5, 'hemoglobin', 'male')).toBe('normal');
  });

  it('returns "normal" at exact high boundary', () => {
    expect(getMarkerStatus(17.5, 'hemoglobin', 'male')).toBe('normal');
  });

  it('returns "warning" for value slightly below low', () => {
    // hemoglobin male low=13.5, 80%=10.8
    // 12.0 is below 13.5 but above 10.8 → warning
    expect(getMarkerStatus(12.0, 'hemoglobin', 'male')).toBe('warning');
  });

  it('returns "warning" for value slightly above high', () => {
    // hemoglobin male high=17.5, 120%=21.0
    // 19.0 is above 17.5 but below 21.0 → warning
    expect(getMarkerStatus(19.0, 'hemoglobin', 'male')).toBe('warning');
  });

  it('returns "danger" for value far below low (<80% of low)', () => {
    // hemoglobin male low=13.5, 80%=10.8
    // 9.0 is below 10.8 → danger
    expect(getMarkerStatus(9.0, 'hemoglobin', 'male')).toBe('danger');
  });

  it('returns "danger" for value far above high (>120% of high)', () => {
    // hemoglobin male high=17.5, 120%=21.0
    // 22.0 is above 21.0 → danger
    expect(getMarkerStatus(22.0, 'hemoglobin', 'male')).toBe('danger');
  });

  it('uses age-specific range for status', () => {
    // PSA male age 45: 0-2.5
    // Value 3.0 → warning (above 2.5, below 2.5*1.2=3.0)
    expect(getMarkerStatus(3.0, 'psa', 'male', 45)).toBe('warning');
    // Value 1.0 → normal
    expect(getMarkerStatus(1.0, 'psa', 'male', 45)).toBe('normal');
  });

  it('returns correct status for female-specific ranges', () => {
    // creatinine female: 0.5-1.1
    expect(getMarkerStatus(0.8, 'creatinine', 'female')).toBe('normal');
    expect(getMarkerStatus(1.2, 'creatinine', 'female')).toBe('warning');
  });
});

// ── getMarkersByGroup ───────────────────────────────────────────────────────

describe('getMarkersByGroup', () => {
  it('returns a Map with all 8 groups', () => {
    const grouped = getMarkersByGroup();
    expect(grouped.size).toBe(8);
    for (const group of GROUP_ORDER) {
      expect(grouped.has(group)).toBe(true);
    }
  });

  it('hormones group has 9 markers', () => {
    const grouped = getMarkersByGroup();
    const hormones = grouped.get('hormones')!;
    expect(hormones.length).toBe(9);
    expect(hormones).toContain('testosterone_total');
    expect(hormones).toContain('cortisol');
    expect(hormones).toContain('free_androgen_index');
  });

  it('blood_count group has 5 markers', () => {
    const grouped = getMarkersByGroup();
    expect(grouped.get('blood_count')!.length).toBe(5);
  });

  it('lipids group has 4 markers', () => {
    const grouped = getMarkersByGroup();
    expect(grouped.get('lipids')!.length).toBe(4);
  });

  it('liver group has 5 markers', () => {
    const grouped = getMarkersByGroup();
    expect(grouped.get('liver')!.length).toBe(5);
  });

  it('all markers are accounted for in groups', () => {
    const grouped = getMarkersByGroup();
    let totalCount = 0;
    for (const [, keys] of grouped) {
      totalCount += keys.length;
    }
    expect(totalCount).toBe(39);
  });

  it('no duplicate markers across groups', () => {
    const grouped = getMarkersByGroup();
    const allKeys: string[] = [];
    for (const [, keys] of grouped) {
      allKeys.push(...keys);
    }
    const uniqueKeys = new Set(allKeys);
    expect(uniqueKeys.size).toBe(allKeys.length);
  });
});
