import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; errorCode?: string }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; autoConfirmed: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Send welcome email on first login (after email confirmation).
 * Non-blocking, fire-and-forget — login is never delayed by email sending.
 * Idempotent: checks localStorage fast-cache + DB welcome_email_sent_at before sending.
 */
const WELCOME_EMAIL_SENT_KEY = 'fitbuddy_welcome_email_sent';

async function triggerWelcomeEmail(userId: string, accessToken: string): Promise<void> {
  try {
    // Fast-check: localStorage cache (avoids DB query + Edge Function call on every page load)
    if (localStorage.getItem(WELCOME_EMAIL_SENT_KEY) === userId) return;

    // Check if welcome email was already sent (DB source of truth)
    const { data: profile } = await supabase
      .from('profiles')
      .select('welcome_email_sent_at')
      .eq('id', userId)
      .single();

    if (profile?.welcome_email_sent_at) {
      // Already sent — cache in localStorage to avoid future DB queries
      localStorage.setItem(WELCOME_EMAIL_SENT_KEY, userId);
      return;
    }

    // Call Edge Function to send welcome email
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const res = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.skipped) {
        console.log('[Auth] Welcome email sent successfully');
      }
      // Cache success in localStorage
      localStorage.setItem(WELCOME_EMAIL_SENT_KEY, userId);
    } else if (res.status === 401) {
      // JWT not accepted by Kong — expected on token refresh, don't log warning
      // Will retry on next fresh login
    } else {
      console.warn('[Auth] Welcome email failed:', res.status);
    }
  } catch {
    // Non-critical: don't block login if welcome email fails
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load admin status from profile
  const loadAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      setIsAdmin(data?.is_admin ?? false);
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let initialLoad = true;

    // Get initial session — await admin status before setting loading=false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadAdminStatus(session.user.id);
      }
      setLoading(false);
      initialLoad = false;
    }).catch((err) => {
      console.error('[Auth] Failed to get session:', err);
      setLoading(false);
      initialLoad = false;
    });

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        } else if (!initialLoad) {
          // Skip INITIAL_SESSION — handled by getSession above
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            loadAdminStatus(session.user.id);

            // Trigger welcome email on SIGNED_IN (first login after confirmation)
            if (event === 'SIGNED_IN' && session.access_token) {
              triggerWelcomeEmail(session.user.id, session.access_token);
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return {
      error: error ? new Error(error.message) : null,
      errorCode: error?.code,
    };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return {
      error: error ? new Error(error.message) : null,
      autoConfirmed: !!data?.session,
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? new Error(error.message) : null };
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error: error ? new Error(error.message) : null };
  };

  const value = useMemo(
    () => ({ user, session, loading, isAdmin, signIn, signUp, signOut, resetPassword, updatePassword, resendConfirmation }),
    [user, session, loading, isAdmin],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
