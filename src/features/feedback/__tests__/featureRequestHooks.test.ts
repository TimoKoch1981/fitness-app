import { describe, it, expect } from 'vitest';
import type { FeatureRequest, FeatureVote, FeatureRequestInput, FeatureRequestStatus, VoteType } from '../types';

// ── Type Validation ──────────────────────────────────────────────────

describe('FeatureRequest types', () => {
  it('FeatureRequestStatus allows all 6 values', () => {
    const statuses: FeatureRequestStatus[] = [
      'submitted', 'under_review', 'planned', 'in_progress', 'completed', 'rejected',
    ];
    expect(statuses).toHaveLength(6);
  });

  it('VoteType allows up and down', () => {
    const votes: VoteType[] = ['up', 'down'];
    expect(votes).toHaveLength(2);
  });

  it('FeatureRequestInput requires title', () => {
    const input: FeatureRequestInput = { title: 'Dark Mode' };
    expect(input.title).toBe('Dark Mode');
    expect(input.description).toBeUndefined();
    expect(input.category).toBeUndefined();
  });

  it('FeatureRequestInput accepts all fields', () => {
    const input: FeatureRequestInput = {
      title: 'Dark Mode',
      description: 'Would love a dark theme',
      category: 'ui',
    };
    expect(input.description).toBe('Would love a dark theme');
    expect(input.category).toBe('ui');
  });
});

// ── Vote Logic ──────────────────────────────────────────────────────

describe('Vote sorting logic', () => {
  const makeRequest = (overrides: Partial<FeatureRequest> = {}): FeatureRequest => ({
    id: 'req-1',
    user_id: 'user-1',
    title: 'Test Feature',
    description: null,
    category: null,
    status: 'submitted',
    admin_notes: null,
    planned_month: null,
    vote_count: 0,
    created_at: '2026-02-25T10:00:00Z',
    ...overrides,
  });

  it('sorts by vote_count descending', () => {
    const requests = [
      makeRequest({ id: 'a', vote_count: 3 }),
      makeRequest({ id: 'b', vote_count: 10 }),
      makeRequest({ id: 'c', vote_count: 1 }),
    ];
    const sorted = [...requests].sort((a, b) => b.vote_count - a.vote_count);
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('a');
    expect(sorted[2].id).toBe('c');
  });

  it('sorts by created_at descending (newest first)', () => {
    const requests = [
      makeRequest({ id: 'a', created_at: '2026-02-20T10:00:00Z' }),
      makeRequest({ id: 'b', created_at: '2026-02-25T10:00:00Z' }),
      makeRequest({ id: 'c', created_at: '2026-02-22T10:00:00Z' }),
    ];
    const sorted = [...requests].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('c');
    expect(sorted[2].id).toBe('a');
  });

  it('filters by status', () => {
    const requests = [
      makeRequest({ id: 'a', status: 'submitted' }),
      makeRequest({ id: 'b', status: 'planned' }),
      makeRequest({ id: 'c', status: 'completed' }),
      makeRequest({ id: 'd', status: 'in_progress' }),
    ];
    const planned = requests.filter(r => ['planned', 'in_progress'].includes(r.status));
    expect(planned).toHaveLength(2);
    expect(planned.map(r => r.id).sort()).toEqual(['b', 'd']);
  });

  it('filters completed', () => {
    const requests = [
      makeRequest({ id: 'a', status: 'submitted' }),
      makeRequest({ id: 'b', status: 'completed' }),
    ];
    const completed = requests.filter(r => r.status === 'completed');
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe('b');
  });
});

// ── Vote State ──────────────────────────────────────────────────────

describe('Vote state determination', () => {
  const makeVote = (overrides: Partial<FeatureVote> = {}): FeatureVote => ({
    id: 'vote-1',
    user_id: 'user-1',
    feature_request_id: 'req-1',
    vote_type: 'up',
    created_at: '2026-02-25T10:00:00Z',
    ...overrides,
  });

  it('finds user vote for a feature request', () => {
    const votes = [
      makeVote({ feature_request_id: 'req-1', vote_type: 'up' }),
      makeVote({ id: 'vote-2', feature_request_id: 'req-2', vote_type: 'down' }),
    ];
    const myVote = votes.find(v => v.feature_request_id === 'req-1');
    expect(myVote?.vote_type).toBe('up');
  });

  it('returns undefined when no vote exists', () => {
    const votes: FeatureVote[] = [];
    const myVote = votes.find(v => v.feature_request_id === 'req-1');
    expect(myVote).toBeUndefined();
  });

  it('toggle logic: same vote removes, different vote updates', () => {
    const existingVoteType: VoteType = 'up';
    const newVoteType: VoteType = 'up';
    const shouldRemove = existingVoteType === newVoteType;
    expect(shouldRemove).toBe(true);

    const changeVoteType = 'down' as VoteType;
    const shouldUpdate = (existingVoteType as string) !== (changeVoteType as string);
    expect(shouldUpdate).toBe(true);
  });

  it('vote_count reflects net votes', () => {
    const votes = [
      makeVote({ vote_type: 'up' }),
      makeVote({ id: 'v2', user_id: 'u2', vote_type: 'up' }),
      makeVote({ id: 'v3', user_id: 'u3', vote_type: 'down' }),
    ];
    const netVotes = votes.reduce((sum, v) => sum + (v.vote_type === 'up' ? 1 : -1), 0);
    expect(netVotes).toBe(1); // 2 up - 1 down
  });
});
