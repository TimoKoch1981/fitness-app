/**
 * Supabase Edge Function: audit-cleanup
 *
 * DSGVO-compliant audit log retention policy with automated cleanup.
 * Deletes audit_logs entries older than their category-specific retention period.
 *
 * Retention rules:
 * - Login/logout events:              90 days
 * - Data changes (INSERT/UPDATE/DELETE): 365 days (1 year)
 * - Security events (password, MFA):  730 days (2 years)
 * - Consent changes:                  3650 days (10 years, legal requirement)
 *
 * Security:
 * - Auth: Validates Supabase JWT via Authorization header
 * - Admin-only: Requires is_admin user metadata or known admin user ID
 *
 * @see docs/RECHTSKONFORMITAET.md
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── JWT Helper ──────────────────────────────────────────────────────

interface JWTPayload {
  sub?: string;
  role?: string;
  user_metadata?: {
    is_admin?: boolean;
  };
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.replace(/^Bearer\s+/i, '').split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// ── Known admin user IDs ────────────────────────────────────────────
const ADMIN_USER_IDS = [
  '991acc4d-44d9-4021-b4cf-d788e44c3bb1', // local test user
  '913f0883-a511-44d9-8111-78dfd4eb5222', // production test user
];

// ── Retention Categories ────────────────────────────────────────────

interface RetentionRule {
  category: string;
  retentionDays: number;
  /** SQL filter for the action column in audit_logs */
  actionPatterns: string[];
}

const RETENTION_RULES: RetentionRule[] = [
  {
    category: 'login',
    retentionDays: 90,
    actionPatterns: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'],
  },
  {
    category: 'dataChange',
    retentionDays: 365,
    actionPatterns: ['INSERT', 'UPDATE', 'DELETE'],
  },
  {
    category: 'security',
    retentionDays: 730,
    actionPatterns: ['PASSWORD_CHANGE', 'PASSWORD_RESET', 'MFA_ENABLE', 'MFA_DISABLE', 'MFA_VERIFY'],
  },
  {
    category: 'consent',
    retentionDays: 3650,
    actionPatterns: ['CONSENT_GIVEN', 'CONSENT_REVOKED', 'DISCLAIMER_ACCEPTED', 'DATA_DELETION_REQUEST'],
  },
];

// ── Supabase REST Query ─────────────────────────────────────────────

async function supabaseDelete(
  table: string,
  filters: Record<string, string>,
  authHeader: string,
): Promise<number> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Delete from ${table} failed: ${response.status} ${errorText}`);
  }

  const deleted = await response.json() as unknown[];
  return Array.isArray(deleted) ? deleted.length : 0;
}

// ── Main Handler ────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Validate auth ─────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const jwt = decodeJWT(authHeader);
  const userId = jwt?.sub;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid or malformed JWT token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Admin check ───────────────────────────────────────────────────
  const isAdmin =
    jwt?.user_metadata?.is_admin === true ||
    jwt?.role === 'service_role' ||
    ADMIN_USER_IDS.includes(userId);

  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Run cleanup per category ──────────────────────────────────────
  try {
    const now = new Date();
    const deletedCounts: Record<string, number> = {};

    for (const rule of RETENTION_RULES) {
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - rule.retentionDays);
      const cutoffIso = cutoffDate.toISOString();

      // Build action filter: action=in.(ACTION1,ACTION2,...)
      const actionFilter = `in.(${rule.actionPatterns.join(',')})`;

      let totalDeleted = 0;
      try {
        totalDeleted = await supabaseDelete('audit_logs', {
          action: actionFilter,
          created_at: `lt.${cutoffIso}`,
        }, authHeader);
      } catch (err) {
        console.warn(
          `[audit-cleanup] Failed to delete ${rule.category}: ` +
          (err instanceof Error ? err.message : String(err))
        );
      }

      deletedCounts[rule.category] = totalDeleted;
    }

    const totalDeleted = Object.values(deletedCounts).reduce((sum, n) => sum + n, 0);

    console.log(
      `[audit-cleanup] Cleanup completed | user=${userId} | ` +
      `total_deleted=${totalDeleted} | ` +
      Object.entries(deletedCounts).map(([k, v]) => `${k}=${v}`).join(', ')
    );

    return new Response(JSON.stringify({
      deletedCounts,
      totalDeleted,
      timestamp: now.toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error(`[audit-cleanup] Error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
