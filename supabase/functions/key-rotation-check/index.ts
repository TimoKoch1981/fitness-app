/**
 * Supabase Edge Function: key-rotation-check
 *
 * Checks the age of configured API keys to enforce quarterly rotation.
 * Each key has a companion env var with ISO date of last rotation.
 *
 * Policy:
 * - < 90 days  => ok
 * - 90..119 days => warning (due for rotation)
 * - >= 120 days => critical (overdue)
 *
 * Security:
 * - Auth: Validates Supabase JWT via Authorization header
 * - Admin-only: Requires is_admin user metadata or known admin user ID
 *
 * @see docs/API_KEY_ROTATION.md for rotation procedures
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

// ── Key Definitions ─────────────────────────────────────────────────

interface KeyConfig {
  name: string;
  envKey: string;
  envRotatedAt: string;
}

const KEY_CONFIGS: KeyConfig[] = [
  {
    name: 'OpenAI API Key',
    envKey: 'OPENAI_API_KEY',
    envRotatedAt: 'OPENAI_KEY_ROTATED_AT',
  },
  {
    name: 'Resend API Key',
    envKey: 'RESEND_API_KEY',
    envRotatedAt: 'RESEND_KEY_ROTATED_AT',
  },
];

const WARNING_THRESHOLD_DAYS = 90;
const CRITICAL_THRESHOLD_DAYS = 120;

// ── Known admin user IDs (fallback if user_metadata.is_admin is not set) ─
const ADMIN_USER_IDS = [
  '991acc4d-44d9-4021-b4cf-d788e44c3bb1', // local test user
  '913f0883-a511-44d9-8111-78dfd4eb5222', // production test user
];

interface KeyStatus {
  name: string;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  daysOld: number | null;
  rotatedAt: string | null;
}

function getKeyStatus(config: KeyConfig): KeyStatus {
  const keyValue = Deno.env.get(config.envKey);
  const rotatedAtRaw = Deno.env.get(config.envRotatedAt);

  // Key not configured at all
  if (!keyValue) {
    return {
      name: config.name,
      status: 'unknown',
      daysOld: null,
      rotatedAt: null,
    };
  }

  // No rotation date set — treat as unknown/critical
  if (!rotatedAtRaw) {
    return {
      name: config.name,
      status: 'critical',
      daysOld: null,
      rotatedAt: null,
    };
  }

  const rotatedAt = new Date(rotatedAtRaw);
  if (isNaN(rotatedAt.getTime())) {
    return {
      name: config.name,
      status: 'critical',
      daysOld: null,
      rotatedAt: rotatedAtRaw,
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - rotatedAt.getTime();
  const daysOld = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let status: 'ok' | 'warning' | 'critical';
  if (daysOld >= CRITICAL_THRESHOLD_DAYS) {
    status = 'critical';
  } else if (daysOld >= WARNING_THRESHOLD_DAYS) {
    status = 'warning';
  } else {
    status = 'ok';
  }

  return {
    name: config.name,
    status,
    daysOld,
    rotatedAt: rotatedAtRaw,
  };
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

  // ── Check all keys ────────────────────────────────────────────────
  try {
    const keys = KEY_CONFIGS.map(getKeyStatus);

    console.log(
      `[key-rotation-check] Checked ${keys.length} keys | user=${userId} | ` +
      keys.map(k => `${k.name}=${k.status}`).join(', ')
    );

    return new Response(JSON.stringify({ keys }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error(`[key-rotation-check] Error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
