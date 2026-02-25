import { describe, it, expect } from 'vitest';
import {
  stripHtml, escapeHtml, containsXSS, containsSQLInjection,
  sanitizeText, isValidInput,
} from '../validation';

// ── stripHtml ──────────────────────────────────────────────────

describe('stripHtml', () => {
  it('removes simple HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
  });

  it('removes script tags', () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('removes nested tags', () => {
    expect(stripHtml('<div><p>text</p></div>')).toBe('text');
  });

  it('removes encoded HTML entities', () => {
    expect(stripHtml('test&#60;script&#62;')).toBe('testscript');
    expect(stripHtml('safe &#x3C;script&#x3E; text')).toBe('safe script text');
  });

  it('preserves plain text', () => {
    expect(stripHtml('Hello World')).toBe('Hello World');
  });

  it('preserves German umlauts', () => {
    expect(stripHtml('Übung für Rücken')).toBe('Übung für Rücken');
  });
});

// ── escapeHtml ──────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// ── containsXSS ──────────────────────────────────────────────────

describe('containsXSS', () => {
  it('detects script tags', () => {
    expect(containsXSS('<script>alert(1)</script>')).toBe(true);
  });

  it('detects event handlers', () => {
    expect(containsXSS('<img onerror="alert(1)">')).toBe(true);
  });

  it('detects onclick', () => {
    expect(containsXSS('<div onclick="steal()">')).toBe(true);
  });

  it('detects javascript: URI', () => {
    expect(containsXSS('javascript:alert(1)')).toBe(true);
  });

  it('detects svg onload', () => {
    expect(containsXSS('<svg onload="alert(1)">')).toBe(true);
  });

  it('returns false for safe text', () => {
    expect(containsXSS('Hello, this is normal text')).toBe(false);
  });

  it('returns false for German text with special chars', () => {
    expect(containsXSS('Bankdrücken: 3x8 @ 80kg')).toBe(false);
  });

  it('returns false for URLs', () => {
    expect(containsXSS('https://example.com/page?q=test')).toBe(false);
  });
});

// ── containsSQLInjection ──────────────────────────────────────────

describe('containsSQLInjection', () => {
  it('detects DROP TABLE', () => {
    expect(containsSQLInjection("'; DROP TABLE users;--")).toBe(true);
  });

  it('detects UNION SELECT', () => {
    expect(containsSQLInjection("' UNION SELECT * FROM users")).toBe(true);
  });

  it('detects DELETE FROM', () => {
    expect(containsSQLInjection("DELETE FROM meals")).toBe(true);
  });

  it('detects INSERT INTO', () => {
    expect(containsSQLInjection("INSERT INTO admin")).toBe(true);
  });

  it('detects comment injection (DROP TABLE)', () => {
    expect(containsSQLInjection("value'; DROP TABLE users--")).toBe(true);
  });

  it('detects SQL line comment at end', () => {
    expect(containsSQLInjection("admin'--")).toBe(true);
  });

  it('returns false for normal text', () => {
    expect(containsSQLInjection('I had a great workout today')).toBe(false);
  });

  it('returns false for product names', () => {
    expect(containsSQLInjection('Whey Protein Select 2kg')).toBe(false);
  });

  it('returns false for German text', () => {
    expect(containsSQLInjection('Trainingsplan für Montag')).toBe(false);
  });
});

// ── sanitizeText ──────────────────────────────────────────────────

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('strips HTML tags', () => {
    expect(sanitizeText('<b>bold</b> text')).toBe('bold text');
  });

  it('enforces max length', () => {
    const long = 'a'.repeat(6000);
    expect(sanitizeText(long, 100)).toHaveLength(100);
  });

  it('removes javascript: URIs', () => {
    const result = sanitizeText('click javascript:alert(1)');
    expect(result).not.toContain('javascript:');
  });

  it('preserves valid input', () => {
    expect(sanitizeText('Normal feedback text 123')).toBe('Normal feedback text 123');
  });
});

// ── isValidInput ──────────────────────────────────────────────────

describe('isValidInput', () => {
  it('accepts normal text', () => {
    expect(isValidInput('This is good feedback')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidInput('')).toBe(false);
  });

  it('rejects string exceeding max length', () => {
    expect(isValidInput('a'.repeat(6000), 5000)).toBe(false);
  });

  it('rejects XSS patterns', () => {
    expect(isValidInput('<script>alert(1)</script>')).toBe(false);
  });

  it('rejects SQL injection', () => {
    expect(isValidInput("'; DROP TABLE users;--")).toBe(false);
  });

  it('accepts German text with umlauts', () => {
    expect(isValidInput('Größe: 180cm, Gewicht: 85kg')).toBe(true);
  });

  it('accepts numbers and special chars', () => {
    expect(isValidInput('3x8 @ 100kg, RPE 8')).toBe(true);
  });

  it('accepts multiline text', () => {
    expect(isValidInput('Line 1\nLine 2\nLine 3')).toBe(true);
  });
});
