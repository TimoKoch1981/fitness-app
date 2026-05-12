/**
 * Tests for the action telemetry module (P0-1).
 *
 * Focus: ensure logActionEvent is genuinely fire-and-forget — a DB error
 * MUST NOT throw or otherwise disturb the caller. This is the single most
 * important invariant for production safety.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted is required because vi.mock is hoisted above imports.
const { mockInsert, mockGetUser } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: mockInsert })),
    auth: { getUser: mockGetUser },
  },
}));

import { logActionEvent, startActionTimer } from '../actionLog';

const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(() => {
  mockInsert.mockReset();
  mockGetUser.mockReset();
  consoleWarnSpy.mockClear();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
  mockInsert.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('logActionEvent', () => {
  it('inserts a row with the right shape (happy path)', async () => {
    await logActionEvent({
      actionType: 'log_meal',
      phase: 'execute',
      status: 'success',
      latencyMs: 123,
      agentType: 'nutrition',
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const row = mockInsert.mock.calls[0][0];
    expect(row).toMatchObject({
      user_id: 'u-1',
      action_type: 'log_meal',
      phase: 'execute',
      status: 'success',
      latency_ms: 123,
      agent_type: 'nutrition',
    });
    expect(row.parsing_path).toBeNull();
    expect(row.error_code).toBeNull();
  });

  it('maps optional fields correctly', async () => {
    await logActionEvent({
      actionType: 'log_meal',
      phase: 'parse',
      status: 'success',
      parsingPath: 'fc',
      agentType: 'nutrition',
    });

    const row = mockInsert.mock.calls[0][0];
    expect(row.parsing_path).toBe('fc');
    expect(row.error_code).toBeNull();
  });

  it('truncates error_detail to 500 chars', async () => {
    const longDetail = 'x'.repeat(2000);
    await logActionEvent({
      actionType: 'log_meal',
      phase: 'execute',
      status: 'failed',
      errorCode: 'mutation_error',
      errorDetail: longDetail,
    });

    const row = mockInsert.mock.calls[0][0];
    expect(row.error_detail.length).toBeLessThanOrEqual(500);
    expect(row.error_detail.endsWith('…')).toBe(true);
  });

  it('leaves short error_detail unchanged', async () => {
    await logActionEvent({
      actionType: 'log_meal',
      phase: 'execute',
      status: 'failed',
      errorCode: 'mutation_error',
      errorDetail: 'short error',
    });

    const row = mockInsert.mock.calls[0][0];
    expect(row.error_detail).toBe('short error');
  });

  it('handles unauthenticated user (null user_id)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await logActionEvent({
      actionType: 'log_meal',
      phase: 'execute',
      status: 'success',
    });

    const row = mockInsert.mock.calls[0][0];
    expect(row.user_id).toBeNull();
  });

  // ── The critical invariant: telemetry never throws ──

  it('does NOT throw when the insert errors', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB blew up' } });

    await expect(
      logActionEvent({
        actionType: 'log_meal',
        phase: 'execute',
        status: 'success',
      }),
    ).resolves.toBeUndefined();

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('[actionLog]');
  });

  it('does NOT throw when supabase itself rejects', async () => {
    mockInsert.mockRejectedValue(new Error('Network gone'));

    await expect(
      logActionEvent({
        actionType: 'log_meal',
        phase: 'execute',
        status: 'success',
      }),
    ).resolves.toBeUndefined();

    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('does NOT throw when getUser rejects', async () => {
    mockGetUser.mockRejectedValue(new Error('Auth broken'));

    await expect(
      logActionEvent({
        actionType: 'log_meal',
        phase: 'execute',
        status: 'success',
      }),
    ).resolves.toBeUndefined();

    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});

describe('startActionTimer', () => {
  it('measures elapsed latency and emits a single event on finish', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T12:00:00Z'));

    const finish = startActionTimer({
      actionType: 'log_workout',
      phase: 'execute',
      agentType: 'training',
    });

    vi.setSystemTime(new Date('2026-05-12T12:00:00.250Z'));
    finish({ status: 'success' });

    // logActionEvent is async fire-and-forget; flush microtasks
    await vi.advanceTimersByTimeAsync(0);
    vi.useRealTimers();
    await Promise.resolve();

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const row = mockInsert.mock.calls[0][0];
    expect(row.action_type).toBe('log_workout');
    expect(row.phase).toBe('execute');
    expect(row.agent_type).toBe('training');
    expect(row.latency_ms).toBe(250);
    expect(row.status).toBe('success');
  });

  it('forwards error fields on a failed finish', async () => {
    const finish = startActionTimer({
      actionType: 'save_training_plan',
      phase: 'execute',
    });

    finish({
      status: 'failed',
      errorCode: 'mutation_error',
      errorDetail: 'plan name missing',
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const row = mockInsert.mock.calls[0][0];
    expect(row.status).toBe('failed');
    expect(row.error_code).toBe('mutation_error');
    expect(row.error_detail).toBe('plan name missing');
    expect(row.latency_ms).toBeGreaterThanOrEqual(0);
  });
});
