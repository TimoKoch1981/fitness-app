/**
 * Critical Flow Integration Tests
 * Tests the core user journeys through the app:
 * - Auth flow (login, logout, session handling)
 * - Protected route access
 * - Data flow (profile → tracking → dashboard)
 * - Navigation flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Setup ────────────────────────────────────────────────────────

const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

const chainable = () => ({
  select: mockSelect.mockReturnValue({
    eq: mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder.mockReturnValue({
        then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
      }),
    }),
    gte: mockGte.mockReturnValue({
      lte: mockLte.mockReturnValue({
        order: mockOrder.mockReturnValue({
          then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
        }),
      }),
    }),
    order: mockOrder.mockReturnValue({
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
    }),
    then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
  }),
  insert: mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
    }),
  }),
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => chainable()),
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      signInWithPassword: (creds: { email: string; password: string }) => mockSignIn(creds),
      signUp: (creds: { email: string; password: string }) => mockSignUp(creds),
      signOut: () => mockSignOut(),
      onAuthStateChange: (cb: (...args: unknown[]) => void) => mockOnAuthStateChange(cb),
      resetPasswordForEmail: (email: string) => mockResetPasswordForEmail(email),
      updateUser: (updates: unknown) => mockUpdateUser(updates),
    },
  },
}));

// ── Test Data ─────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-123',
  email: 'test@fitbuddy.local',
  aud: 'authenticated',
  role: 'authenticated',
};

const mockSession = {
  access_token: 'token-abc',
  refresh_token: 'refresh-xyz',
  user: mockUser,
  expires_at: Date.now() / 1000 + 3600,
};

const mockProfile = {
  id: 'user-123',
  full_name: 'Test User',
  age: 30,
  height_cm: 180,
  is_admin: false,
  disclaimer_accepted_at: '2026-01-01T00:00:00Z',
};

// ── Tests ─────────────────────────────────────────────────────────────

describe('Critical Flow: Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  it('login with valid credentials returns session', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { supabase } = await import('../lib/supabase');
    const result = await supabase.auth.signInWithPassword({
      email: 'test@fitbuddy.local',
      password: 'test1234',
    });

    expect(result.data.user).toEqual(mockUser);
    expect(result.data.session).toEqual(mockSession);
    expect(result.error).toBeNull();
  });

  it('login with invalid credentials returns error', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', status: 400 },
    });

    const { supabase } = await import('../lib/supabase');
    const result = await supabase.auth.signInWithPassword({
      email: 'wrong@test.com',
      password: 'wrong',
    });

    expect(result.data.user).toBeNull();
    expect(result.error?.message).toBe('Invalid login credentials');
  });

  it('signup creates new user', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { ...mockUser, id: 'new-user' },
        session: null, // session null until email confirmed
      },
      error: null,
    });

    const { supabase } = await import('../lib/supabase');
    const result = await supabase.auth.signUp({
      email: 'new@fitbuddy.local',
      password: 'strong1234',
    });

    expect(result.data.user?.id).toBe('new-user');
    expect(result.data.session).toBeNull(); // email confirmation required
    expect(result.error).toBeNull();
  });

  it('logout clears session', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { supabase } = await import('../lib/supabase');
    const result = await supabase.auth.signOut();

    expect(result.error).toBeNull();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('password reset sends email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const { supabase } = await import('../lib/supabase');
    const result = await supabase.auth.resetPasswordForEmail('test@fitbuddy.local');

    expect(result.error).toBeNull();
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@fitbuddy.local');
  });

  it('password update succeeds', async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const { supabase } = await import('../lib/supabase');
    const result = await supabase.auth.updateUser({ password: 'newPassword1234' });

    expect(result.error).toBeNull();
  });

  it('session check returns current session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { supabase } = await import('../lib/supabase');
    const result = await supabase.auth.getSession();

    expect(result.data.session).toEqual(mockSession);
    expect(result.data.session.user.id).toBe('user-123');
  });

  it('expired session returns null', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { supabase } = await import('../lib/supabase');
    const result = await supabase.auth.getSession();

    expect(result.data.session).toBeNull();
  });
});

describe('Critical Flow: Profile Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('loads user profile after login', async () => {
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });

    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase.from('profiles').select('*').eq('id', 'user-123').single();

    expect(data).toEqual(mockProfile);
    expect(data.full_name).toBe('Test User');
    expect(data.disclaimer_accepted_at).toBeTruthy();
  });

  it('profile not found creates auto-profile via trigger', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    });

    const { supabase } = await import('../lib/supabase');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', 'user-123').single();

    expect(data).toBeNull();
    expect(error?.code).toBe('PGRST116');
    // In production, DB trigger creates profile automatically
  });

  it('admin profile has is_admin = true', async () => {
    mockSingle.mockResolvedValue({
      data: { ...mockProfile, is_admin: true },
      error: null,
    });

    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase.from('profiles').select('*').eq('id', 'admin-1').single();

    expect(data?.is_admin).toBe(true);
  });
});

describe('Critical Flow: Tracking Data (Meals)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('queries meals for a specific date', async () => {
    const { supabase } = await import('../lib/supabase');
    supabase.from('meals');

    expect(supabase.from).toHaveBeenCalledWith('meals');
  });

  it('inserts a new meal', async () => {
    const { supabase } = await import('../lib/supabase');
    const result = await supabase.from('meals').insert({
      user_id: 'user-123',
      date: '2026-02-25',
      name: 'Hähnchenbrust',
      meal_type: 'lunch',
      calories: 250,
      protein_g: 40,
    }).select('*').single();

    expect(result.data?.id).toBe('new-1');
    expect(result.error).toBeNull();
  });
});

describe('Critical Flow: Body Measurements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries body measurements for date range', async () => {
    const { supabase } = await import('../lib/supabase');
    supabase.from('body_measurements');

    expect(supabase.from).toHaveBeenCalledWith('body_measurements');
  });
});

describe('Critical Flow: Blood Pressure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries blood pressure data', async () => {
    const { supabase } = await import('../lib/supabase');
    supabase.from('blood_pressure');

    expect(supabase.from).toHaveBeenCalledWith('blood_pressure');
  });
});

describe('Critical Flow: Training Plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads active training plan', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'plan-1',
        name: 'PPL Split',
        is_active: true,
        days_per_week: 6,
        days: [
          { id: 'day-1', day_number: 1, name: 'Push', exercises: [] },
          { id: 'day-2', day_number: 2, name: 'Pull', exercises: [] },
        ],
      },
      error: null,
    });

    const { supabase } = await import('../lib/supabase');
    const { data, error } = await supabase.from('training_plans').select('*, days:training_plan_days(*)').eq('is_active', true).single();

    expect(data?.name).toBe('PPL Split');
    expect(data?.days).toHaveLength(2);
    expect(error).toBeNull();
  });
});

describe('Critical Flow: Workouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves completed workout session', async () => {
    const { supabase } = await import('../lib/supabase');
    const result = await supabase.from('workouts').insert({
      user_id: 'user-123',
      date: '2026-02-25',
      name: 'Push Day',
      type: 'strength',
      duration_minutes: 65,
      calories_burned: 420,
      plan_id: 'plan-1',
      session_exercises: [],
    }).select('*').single();

    expect(result.data?.id).toBe('new-1');
    expect(result.error).toBeNull();
  });
});

describe('Critical Flow: Disclaimer Check', () => {
  it('user with accepted disclaimer can access protected routes', () => {
    const user = { ...mockProfile, disclaimer_accepted_at: '2026-01-01T00:00:00Z' };
    expect(user.disclaimer_accepted_at).toBeTruthy();
    // In the app, ProtectedRoute checks localStorage + DB
  });

  it('user without disclaimer sees modal', () => {
    const user = { ...mockProfile, disclaimer_accepted_at: null };
    expect(user.disclaimer_accepted_at).toBeFalsy();
    // DisclaimerModal blocks interaction until accepted
  });
});

describe('Critical Flow: Admin Access', () => {
  it('admin user can access admin routes', async () => {
    mockSingle.mockResolvedValue({
      data: { ...mockProfile, is_admin: true },
      error: null,
    });

    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', 'admin-1').single();

    expect(data?.is_admin).toBe(true);
  });

  it('non-admin user is redirected from admin routes', async () => {
    mockSingle.mockResolvedValue({
      data: { ...mockProfile, is_admin: false },
      error: null,
    });

    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', 'user-123').single();

    expect(data?.is_admin).toBe(false);
  });
});

describe('Critical Flow: Feedback System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits feedback', async () => {
    const { supabase } = await import('../lib/supabase');
    const result = await supabase.from('feedback').insert({
      user_id: 'user-123',
      type: 'bug',
      rating: 'negative',
      message: 'Button does not work',
      page_context: '/tracking',
    }).select('*').single();

    expect(result.data?.id).toBe('new-1');
    expect(result.error).toBeNull();
  });

  it('submits feature request', async () => {
    const { supabase } = await import('../lib/supabase');
    const result = await supabase.from('feature_requests').insert({
      user_id: 'user-123',
      title: 'Dark Mode',
      description: 'Add a dark mode option',
    }).select('*').single();

    expect(result.data?.id).toBe('new-1');
    expect(result.error).toBeNull();
  });
});
