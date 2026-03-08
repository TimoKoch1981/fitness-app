/**
 * Session-Refresh Utility — ensures Supabase JWT is fresh before mutations.
 *
 * Solves the class of "RLS rejection" errors where AI-triggered actions
 * execute with a stale or expired JWT token. Calls getSession() first
 * (auto-refreshes if JWT close to expiry), falls back to getUser() which
 * forces a server roundtrip.
 */

import { supabase } from './supabase';

/**
 * Ensure the Supabase auth session is fresh and return the current user_id.
 * Throws if no valid session can be established.
 */
export async function ensureFreshSession(): Promise<string> {
  // getSession() auto-refreshes if the JWT is within 60s of expiry
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (!sessionError && session?.user?.id) {
    return session.user.id;
  }

  // Fallback: getUser() forces a server-side verification + token refresh
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.id) {
    throw new Error('Session expired. Please log in again.');
  }

  return user.id;
}
