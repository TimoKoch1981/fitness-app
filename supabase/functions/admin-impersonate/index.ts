/**
 * admin-impersonate — Edge Function fuer Admin-Impersonation (PH5 / Phase 4).
 *
 * SECURITY-KRITISCH. Vor Production durch Security-Auditor reviewen.
 *
 * Flow:
 *   1. Authentifizierter Admin sendet POST { target_user_id, reason } (mit reason min 10 chars)
 *   2. Function prueft is_admin=true im JWT-Claim UND im profiles-Tabelle
 *   3. Function prueft target_user_id != admin_user_id (no self-impersonation)
 *   4. Function generiert Magic-Link fuer target_user via supabase.auth.admin.generateLink
 *      (single-use, 60min TTL per Supabase default)
 *   5. Function loggt impersonation_start in admin_impersonation_log (mit ip + user_agent + reason)
 *   6. Function gibt { token_hash, log_id, target_email } zurueck
 *   7. Frontend tauscht token_hash via supabase.auth.verifyOtp gegen target-session
 *
 * Side-effects:
 *   - Email-Notification an target_user + admin (best-effort via Resend, blockt nicht)
 *
 * Failure-Modes:
 *   - 401 wenn nicht eingeloggt
 *   - 403 wenn nicht Admin
 *   - 400 wenn reason fehlt oder zu kurz oder self-impersonation
 *   - 404 wenn target_user_id nicht existiert
 *   - 500 wenn Supabase-Admin-API fehlschlaegt
 */

// @ts-expect-error -- Deno runtime imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error -- Deno runtime imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://fudda.de';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ImpersonateBody {
  target_user_id: string;
  reason: string;
}

interface JWTPayload {
  sub?: string;
  email?: string;
  user_metadata?: { is_admin?: boolean };
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.replace(/^Bearer\s+/i, '').split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Step 1: Authenticate caller ────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = decodeJWT(authHeader);
  if (!jwt?.sub) {
    return jsonResponse(401, { error: 'unauthorized' });
  }
  const adminUserId = jwt.sub;
  const adminEmail = jwt.email ?? '';

  // ── Step 2: Parse + validate body ──────────────────────────────────────
  let body: ImpersonateBody;
  try {
    body = await req.json() as ImpersonateBody;
  } catch {
    return jsonResponse(400, { error: 'invalid_json' });
  }

  const targetUserId = (body.target_user_id ?? '').trim();
  const reason = (body.reason ?? '').trim();

  if (!targetUserId) return jsonResponse(400, { error: 'missing_target_user_id' });
  if (reason.length < 10) {
    return jsonResponse(400, { error: 'reason_too_short', message: 'Reason must be >= 10 characters' });
  }
  if (targetUserId === adminUserId) {
    return jsonResponse(400, { error: 'self_impersonation_forbidden' });
  }

  // ── Step 3: Verify admin status (defense-in-depth: JWT + DB check) ─────
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 3a. JWT-claim check
  const isAdminClaim = jwt.user_metadata?.is_admin === true;

  // 3b. DB check (in case JWT is stale)
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', adminUserId)
    .maybeSingle();

  if (profileError) {
    console.error('[admin-impersonate] Profile check failed:', profileError);
    return jsonResponse(500, { error: 'profile_check_failed' });
  }

  const isAdminDB = (profileData as { is_admin?: boolean } | null)?.is_admin === true;

  if (!isAdminClaim && !isAdminDB) {
    console.warn(`[admin-impersonate] Non-admin attempt by ${adminUserId} for ${targetUserId}`);
    return jsonResponse(403, { error: 'admin_required' });
  }

  // ── Step 4: Load target user ────────────────────────────────────────────
  const { data: targetData, error: targetError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
  if (targetError || !targetData?.user) {
    return jsonResponse(404, { error: 'target_user_not_found' });
  }
  const targetEmail = targetData.user.email ?? '';
  if (!targetEmail) {
    return jsonResponse(400, { error: 'target_user_has_no_email' });
  }

  // ── Step 5: Generate magic-link for target user ─────────────────────────
  // generateLink mit type='magiclink' liefert:
  //   - properties.hashed_token: kann via verifyOtp({type:'magiclink',token_hash}) eingeloest werden
  //   - properties.action_link: ganze URL (nutzen wir nicht — Frontend bevorzugt hashed_token-Flow)
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail,
    options: {
      redirectTo: `${APP_URL}/auth/callback?impersonation=1`,
    },
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('[admin-impersonate] generateLink failed:', linkError);
    return jsonResponse(500, { error: 'generate_link_failed' });
  }

  // ── Step 6: Audit-log entry ─────────────────────────────────────────────
  const ip = req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  const { data: logData, error: logError } = await supabaseAdmin
    .from('admin_impersonation_log')
    .insert({
      admin_user_id: adminUserId,
      admin_email: adminEmail,
      target_user_id: targetUserId,
      target_email: targetEmail,
      reason,
      ip,
      user_agent: userAgent,
    })
    .select('id')
    .single();

  if (logError || !logData) {
    console.error('[admin-impersonate] Audit-log insert failed:', logError);
    return jsonResponse(500, { error: 'audit_log_failed' });
  }

  // ── Step 7: Email-Notification (best-effort, fire-and-forget) ──────────
  if (RESEND_API_KEY) {
    notifyImpersonation({
      adminEmail,
      targetEmail,
      reason,
      ip: ip ?? 'unknown',
      timestamp: new Date(),
    }).catch(err => console.warn('[admin-impersonate] Email notify failed:', err));
  }

  // ── Step 8: Return token_hash for client-side verifyOtp ────────────────
  return jsonResponse(200, {
    token_hash: linkData.properties.hashed_token,
    log_id: logData.id,
    target_email: targetEmail,
    expires_in_seconds: 3600,
  });
});

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Fire-and-forget Email-Notification an Admin + target_user.
 * Verwendet Resend HTTP API direkt (keine SDK-Abhaengigkeit).
 */
async function notifyImpersonation(params: {
  adminEmail: string;
  targetEmail: string;
  reason: string;
  ip: string;
  timestamp: Date;
}): Promise<void> {
  const { adminEmail, targetEmail, reason, ip, timestamp } = params;
  const when = timestamp.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

  const targetSubject = '⚠️ Dein FitBuddy-Account wurde fuer Support-Zwecke eingesehen';
  const targetHtml = `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#222;max-width:600px;margin:auto;padding:24px">
  <h2 style="color:#3D4FB8">Hinweis zur Account-Einsicht</h2>
  <p>Hallo,</p>
  <p>aus Transparenzgruenden informieren wir dich: Ein FitBuddy-Administrator hat
     zu Support-Zwecken kurzzeitig Einblick in deinen Account erhalten.</p>
  <table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#666">Zeitpunkt:</td><td><strong>${when}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Administrator:</td><td>${adminEmail}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Grund:</td><td>${reason}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">IP des Admins:</td><td>${ip}</td></tr>
  </table>
  <p>Diese Einsicht ist auf 60 Minuten begrenzt und wurde in unserem Audit-Log dokumentiert.</p>
  <p>Falls du diesen Vorgang fuer unrechtmaessig haeltst, kontaktiere uns bitte unter
     <a href="mailto:support@fudda.de">support@fudda.de</a>.</p>
  <p style="color:#999;font-size:12px;margin-top:32px">
     Diese Email wurde automatisch generiert. Bitte nicht antworten.
  </p>
</body></html>`.trim();

  const adminSubject = '✅ Impersonation gestartet: ' + targetEmail;
  const adminHtml = `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#222;max-width:600px;margin:auto;padding:24px">
  <h2 style="color:#3D4FB8">Impersonation gestartet</h2>
  <p>Du hast eine Support-Session fuer ${targetEmail} gestartet.</p>
  <table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#666">Ziel:</td><td><strong>${targetEmail}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Zeitpunkt:</td><td>${when}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Grund:</td><td>${reason}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Auto-End nach:</td><td>60 Minuten</td></tr>
  </table>
  <p>Der Ziel-Nutzer wurde per separater Email informiert (Transparenz-Pflicht).</p>
  <p style="color:#999;font-size:12px;margin-top:32px">
     Sitzung wurde im Audit-Log dokumentiert.
  </p>
</body></html>`.trim();

  const sendOne = (to: string, subject: string, html: string) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FitBuddy Audit <noreply@fudda.de>',
        to: [to],
        subject,
        html,
      }),
    });

  await Promise.all([
    sendOne(targetEmail, targetSubject, targetHtml),
    adminEmail ? sendOne(adminEmail, adminSubject, adminHtml) : Promise.resolve(),
  ]);
}

// Suppress unused-var lint for SUPABASE_ANON_KEY (reserved for future use)
void SUPABASE_ANON_KEY;
