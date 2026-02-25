import { describe, it, expect } from 'vitest';

// ── de-DE Date Formatting ──────────────────────────────────────────

describe('de-DE date formatting', () => {
  it('formats date as DD.MM.YYYY', () => {
    const date = new Date('2026-02-25T10:30:00Z');
    const formatted = date.toLocaleDateString('de-DE');
    expect(formatted).toMatch(/25\.0?2\.2026/);
  });

  it('formats time as HH:MM', () => {
    const date = new Date('2026-02-25T14:30:00');
    const formatted = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    expect(formatted).toMatch(/14:30/);
  });

  it('formats datetime as DD.MM.YYYY, HH:MM', () => {
    const date = new Date('2026-02-25T14:30:00');
    const formatted = date.toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    expect(formatted).toContain('25.02.2026');
    expect(formatted).toContain('14:30');
  });

  it('formats month names in German', () => {
    const date = new Date('2026-02-25');
    const month = date.toLocaleDateString('de-DE', { month: 'long' });
    expect(month).toBe('Februar');
  });

  it('formats weekday in German', () => {
    const date = new Date('2026-02-25'); // Wednesday
    const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' });
    expect(weekday).toBe('Mittwoch');
  });
});

// ── ISO Date Parsing ──────────────────────────────────────────────

describe('ISO date parsing', () => {
  it('parses ISO date string correctly', () => {
    const date = new Date('2026-02-25T10:30:00Z');
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(1); // 0-indexed
    expect(date.getUTCDate()).toBe(25);
  });

  it('roundtrips toISOString correctly', () => {
    const original = '2026-02-25T10:30:00.000Z';
    const date = new Date(original);
    expect(date.toISOString()).toBe(original);
  });

  it('handles midnight correctly', () => {
    const date = new Date('2026-02-25T00:00:00Z');
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
  });

  it('handles end of day correctly', () => {
    const date = new Date('2026-02-25T23:59:59Z');
    expect(date.getUTCHours()).toBe(23);
    expect(date.getUTCMinutes()).toBe(59);
  });
});

// ── Relative Date Helpers ──────────────────────────────────────────

describe('Relative date calculations', () => {
  it('calculates days between dates', () => {
    const a = new Date('2026-02-20');
    const b = new Date('2026-02-25');
    const diffMs = b.getTime() - a.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(5);
  });

  it('identifies same-day dates', () => {
    const a = new Date('2026-02-25T08:00:00');
    const b = new Date('2026-02-25T20:00:00');
    const sameDay = a.toDateString() === b.toDateString();
    expect(sameDay).toBe(true);
  });

  it('identifies yesterday', () => {
    const today = new Date('2026-02-25T12:00:00');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(yesterday.getDate()).toBe(24);
  });

  it('handles month boundary', () => {
    const date = new Date('2026-03-01');
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 1);
    expect(previous.getMonth()).toBe(1); // February
    expect(previous.getDate()).toBe(28);
  });

  it('handles year boundary', () => {
    const date = new Date('2026-01-01');
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 1);
    expect(previous.getFullYear()).toBe(2025);
    expect(previous.getMonth()).toBe(11); // December
  });
});
