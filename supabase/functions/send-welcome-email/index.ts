/**
 * Supabase Edge Function: send-welcome-email
 *
 * Sends a welcome/activation confirmation email to users after they
 * confirm their email address. Called from the frontend on first login.
 *
 * Flow:
 * 1. Validates user JWT from Authorization header
 * 2. Checks if welcome email was already sent (idempotent)
 * 3. Sends email via Resend HTTP API
 * 4. Updates profiles.welcome_email_sent_at
 *
 * Required env vars:
 * - RESEND_API_KEY — Resend API key for sending emails
 * - SUPABASE_SERVICE_ROLE_KEY — for DB updates
 * - SUPABASE_URL — Supabase API URL
 * - WELCOME_EMAIL_FROM — sender address (default: noreply@fudda.de)
 * - SITE_URL — app URL for "Jetzt loslegen" button
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Inline welcome email HTML template */
function buildWelcomeHtml(siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen bei FitBuddy!</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#0d9488,#10b981);padding:32px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">FitBuddy</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Dein KI-Fitness-Companion</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:22px;">Dein Konto ist aktiviert!</h2>
        <p style="color:#4a4a4a;line-height:1.6;font-size:16px;">
          Willkommen bei FitBuddy! Deine Email-Adresse wurde erfolgreich bestaetigt und dein Konto ist jetzt aktiv.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0;">
          <h3 style="color:#0d9488;margin:0 0 12px;font-size:16px;">So startest du am besten:</h3>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;">
            <tr><td style="padding:6px 0;color:#4a4a4a;font-size:14px;line-height:1.5;"><strong style="color:#0d9488;">1.</strong> Fuege deine Koerperdaten im Profil hinzu</td></tr>
            <tr><td style="padding:6px 0;color:#4a4a4a;font-size:14px;line-height:1.5;"><strong style="color:#0d9488;">2.</strong> Erstelle deinen ersten Trainingsplan mit dem KI-Trainer</td></tr>
            <tr><td style="padding:6px 0;color:#4a4a4a;font-size:14px;line-height:1.5;"><strong style="color:#0d9488;">3.</strong> Tracke deine Ernaehrung und lass dir Tipps vom Buddy geben</td></tr>
            <tr><td style="padding:6px 0;color:#4a4a4a;font-size:14px;line-height:1.5;"><strong style="color:#0d9488;">4.</strong> Behalte deine Gesundheitswerte im Blick</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">Jetzt loslegen</a>
        </div>
        <p style="color:#888;font-size:13px;line-height:1.5;margin-top:24px;">
          Bei Fragen oder Feedback nutze einfach den Feedback-Button in der App.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">FitBuddy — Dein persoenlicher Fitness- und Gesundheitsbegleiter</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

  // ── Validate auth ───────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Get required env vars ───────────────────────────────────────────
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'http://kong:8000';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const fromEmail = Deno.env.get('WELCOME_EMAIL_FROM') ?? 'FitBuddy <noreply@fudda.de>';
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://fudda.de';

  try {
    // ── Verify JWT and get user ─────────────────────────────────────
    const token = authHeader.replace('Bearer ', '');
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey,
      },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = await userRes.json() as { id: string; email: string; email_confirmed_at: string | null };

    if (!user.email) {
      return new Response(JSON.stringify({ error: 'User has no email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Check if welcome email already sent (idempotent) ────────────
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=welcome_email_sent_at`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (profileRes.ok) {
      const profiles = await profileRes.json() as Array<{ welcome_email_sent_at: string | null }>;
      if (profiles[0]?.welcome_email_sent_at) {
        return new Response(JSON.stringify({ message: 'Welcome email already sent', skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Send welcome email via Resend HTTP API ──────────────────────
    const htmlContent = buildWelcomeHtml(siteUrl);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [user.email],
        subject: 'FitBuddy — Dein Konto ist aktiviert!',
        html: htmlContent,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('[send-welcome-email] Resend error:', resendRes.status, errBody);
      return new Response(JSON.stringify({ error: `Resend API error: ${resendRes.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendData = await resendRes.json() as { id: string };
    console.log('[send-welcome-email] Sent to', user.email, '— Resend ID:', resendData.id);

    // ── Mark welcome email as sent ──────────────────────────────────
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ welcome_email_sent_at: new Date().toISOString() }),
      }
    );

    if (!updateRes.ok) {
      console.error('[send-welcome-email] Failed to update profile:', updateRes.status);
    }

    return new Response(JSON.stringify({
      message: 'Welcome email sent',
      resend_id: resendData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[send-welcome-email] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
