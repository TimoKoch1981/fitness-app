import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildStorageKey,
  readEntries,
  writeEntries,
  calculateTotal,
  generateEntryId,
  goalToMl,
  type WaterEntry,
} from '../useWaterIntake';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

// ── buildStorageKey ─────────────────────────────────────────────────────

describe('buildStorageKey', () => {
  it('builds key with user ID and date', () => {
    const key = buildStorageKey('user123', '2026-03-03');
    expect(key).toBe('fitbuddy_water_entries_user123_2026-03-03');
  });

  it('uses "anon" when user ID is undefined', () => {
    const key = buildStorageKey(undefined, '2026-03-03');
    expect(key).toBe('fitbuddy_water_entries_anon_2026-03-03');
  });

  it('generates different keys for different dates', () => {
    const key1 = buildStorageKey('u1', '2026-03-01');
    const key2 = buildStorageKey('u1', '2026-03-02');
    expect(key1).not.toBe(key2);
  });
});

// ── readEntries ─────────────────────────────────────────────────────────

describe('readEntries', () => {
  it('returns empty array when no data stored', () => {
    expect(readEntries('nonexistent_key')).toEqual([]);
  });

  it('reads stored entries correctly', () => {
    const entries: WaterEntry[] = [
      { id: 'w1', amountMl: 250, timestamp: 1000 },
      { id: 'w2', amountMl: 500, timestamp: 2000 },
    ];
    localStorageMock.setItem('test_key', JSON.stringify(entries));
    const result = readEntries('test_key');
    expect(result).toEqual(entries);
    expect(result).toHaveLength(2);
  });

  it('migrates old number format (glass count) to entries', () => {
    localStorageMock.setItem('old_key', '3');
    const result = readEntries('old_key');
    expect(result).toHaveLength(3);
    result.forEach(entry => {
      expect(entry.amountMl).toBe(250);
      expect(entry.id).toMatch(/^migrated_/);
    });
  });

  it('returns empty array for zero glass count', () => {
    localStorageMock.setItem('zero_key', '0');
    const result = readEntries('zero_key');
    expect(result).toEqual([]);
  });

  it('handles corrupted JSON gracefully', () => {
    localStorageMock.setItem('bad_key', '{invalid json');
    expect(readEntries('bad_key')).toEqual([]);
  });

  it('handles non-array JSON gracefully', () => {
    localStorageMock.setItem('obj_key', '{"foo":"bar"}');
    expect(readEntries('obj_key')).toEqual([]);
  });
});

// ── writeEntries ────────────────────────────────────────────────────────

describe('writeEntries', () => {
  it('writes entries to localStorage', () => {
    const entries: WaterEntry[] = [
      { id: 'w1', amountMl: 250, timestamp: 1000 },
    ];
    writeEntries('write_key', entries);
    expect(localStorageMock.getItem('write_key')).toBe(JSON.stringify(entries));
  });

  it('writes empty array', () => {
    writeEntries('empty_key', []);
    expect(localStorageMock.getItem('empty_key')).toBe('[]');
  });
});

// ── calculateTotal ──────────────────────────────────────────────────────

describe('calculateTotal', () => {
  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('sums all entry amounts', () => {
    const entries: WaterEntry[] = [
      { id: 'w1', amountMl: 250, timestamp: 1000 },
      { id: 'w2', amountMl: 500, timestamp: 2000 },
      { id: 'w3', amountMl: 100, timestamp: 3000 },
    ];
    expect(calculateTotal(entries)).toBe(850);
  });

  it('handles single entry', () => {
    const entries: WaterEntry[] = [
      { id: 'w1', amountMl: 750, timestamp: 1000 },
    ];
    expect(calculateTotal(entries)).toBe(750);
  });
});

// ── generateEntryId ─────────────────────────────────────────────────────

describe('generateEntryId', () => {
  it('generates string starting with "w_"', () => {
    const id = generateEntryId();
    expect(id).toMatch(/^w_\d+_/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateEntryId()));
    expect(ids.size).toBe(100);
  });
});

// ── goalToMl ────────────────────────────────────────────────────────────

describe('goalToMl', () => {
  it('converts glass count to ml (250ml per glass)', () => {
    expect(goalToMl(8)).toBe(2000);
    expect(goalToMl(10)).toBe(2500);
    expect(goalToMl(12)).toBe(3000);
  });

  it('returns default 2500ml when undefined', () => {
    expect(goalToMl(undefined)).toBe(2500);
  });

  it('returns default 2500ml when 0', () => {
    expect(goalToMl(0)).toBe(2500);
  });

  it('returns default 2500ml for negative values', () => {
    expect(goalToMl(-5)).toBe(2500);
  });

  it('handles 1 glass correctly', () => {
    expect(goalToMl(1)).toBe(250);
  });
});

// ── Integration: write + read roundtrip ─────────────────────────────────

describe('write + read roundtrip', () => {
  it('preserves entries through write/read cycle', () => {
    const entries: WaterEntry[] = [
      { id: 'w1', amountMl: 250, timestamp: 1000 },
      { id: 'w2', amountMl: 500, timestamp: 2000 },
      { id: 'w3', amountMl: 330, timestamp: 3000 },
    ];
    const key = buildStorageKey('user1', '2026-03-03');
    writeEntries(key, entries);
    const read = readEntries(key);
    expect(read).toEqual(entries);
    expect(calculateTotal(read)).toBe(1080);
  });

  it('simulates add + undo flow', () => {
    const key = buildStorageKey('user1', '2026-03-03');

    // Add water
    const entries: WaterEntry[] = [];
    entries.push({ id: 'w1', amountMl: 250, timestamp: 1000 });
    entries.push({ id: 'w2', amountMl: 500, timestamp: 2000 });
    writeEntries(key, entries);
    expect(calculateTotal(readEntries(key))).toBe(750);

    // Undo last
    entries.pop();
    writeEntries(key, entries);
    expect(calculateTotal(readEntries(key))).toBe(250);

    // Undo last again
    entries.pop();
    writeEntries(key, entries);
    expect(calculateTotal(readEntries(key))).toBe(0);
    expect(readEntries(key)).toHaveLength(0);
  });
});
