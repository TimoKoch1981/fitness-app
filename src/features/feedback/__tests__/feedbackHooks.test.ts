import { describe, it, expect } from 'vitest';
import { collectBugContext } from '../hooks/useFeedback';
import type { FeedbackCategory, FeedbackRating, FeedbackStatus, FeedbackInput } from '../types';

// ── collectBugContext ──────────────────────────────────────────────────

describe('collectBugContext', () => {
  it('returns page_url from window.location', () => {
    const ctx = collectBugContext();
    expect(ctx.page_url).toBeDefined();
    expect(typeof ctx.page_url).toBe('string');
  });

  it('returns user_agent from navigator', () => {
    const ctx = collectBugContext();
    expect(ctx.user_agent).toBeDefined();
    expect(ctx.user_agent!.length).toBeGreaterThan(0);
  });

  it('returns app_version string', () => {
    const ctx = collectBugContext();
    expect(ctx.app_version).toBe('9.0');
  });

  it('returns consistent structure on repeated calls', () => {
    const a = collectBugContext();
    const b = collectBugContext();
    expect(a.page_url).toBe(b.page_url);
    expect(a.user_agent).toBe(b.user_agent);
    expect(a.app_version).toBe(b.app_version);
  });
});

// ── Types Validation ──────────────────────────────────────────────────

describe('Feedback types', () => {
  it('FeedbackCategory allows bug, note, praise', () => {
    const categories: FeedbackCategory[] = ['bug', 'note', 'praise'];
    expect(categories).toHaveLength(3);
    categories.forEach(c => expect(typeof c).toBe('string'));
  });

  it('FeedbackRating allows up, down', () => {
    const ratings: FeedbackRating[] = ['up', 'down'];
    expect(ratings).toHaveLength(2);
  });

  it('FeedbackStatus allows all 4 values', () => {
    const statuses: FeedbackStatus[] = ['new', 'in_progress', 'resolved', 'wont_fix'];
    expect(statuses).toHaveLength(4);
  });

  it('FeedbackInput requires category, optional rest', () => {
    const input: FeedbackInput = { category: 'bug' };
    expect(input.category).toBe('bug');
    expect(input.rating).toBeUndefined();
    expect(input.message).toBeUndefined();
  });

  it('FeedbackInput accepts all optional fields', () => {
    const input: FeedbackInput = {
      category: 'note',
      rating: 'up',
      message: 'Great app!',
      page_url: '/cockpit',
      user_agent: 'TestAgent',
      screenshot_url: 'https://example.com/img.png',
    };
    expect(input.category).toBe('note');
    expect(input.rating).toBe('up');
    expect(input.message).toBe('Great app!');
    expect(input.page_url).toBe('/cockpit');
    expect(input.screenshot_url).toBe('https://example.com/img.png');
  });
});
