/**
 * Supabase Edge Function: send-push
 *
 * Multi-channel push notification dispatcher.
 * Channels: Web Push (VAPID), WhatsApp (Business API), Telegram (Bot API)
 *
 * Usage:
 *   POST /functions/v1/send-push
 *   Body: { user_id?, channel?, title, body, notification_type, data? }
 *   - If user_id is provided: sends to that user's active subscriptions
 *   - If channel is provided: filters to that channel only
 *   - Without user_id: sends to the authenticated user (from JWT)
 *
 * Environment Variables (set in Supabase Dashboard):
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 *   WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 *   TELEGRAM_BOT_TOKEN
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushRequest {
  user_id?: string;
  channel?: 'web_push' | 'whatsapp' | 'telegram';
  title: string;
  body: string;
  notification_type: string;
  data?: Record<string, unknown>;
  url?: string; // Click target URL
}

interface Subscription {
  id: string;
  user_id: string;
  channel: string;
  endpoint?: string;
  p256dh?: string;
  auth_key?: string;
  whatsapp_phone?: string;
  telegram_chat_id?: string;
}

// ── Web Push (VAPID) ────────────────────────────────────────────────

async function sendWebPush(
  sub: Subscription,
  payload: { title: string; body: string; url?: string; data?: Record<string, unknown> },
): Promise<{ success: boolean; error?: string }> {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:info@fudda.de';

  if (!vapidPublicKey || !vapidPrivateKey || !sub.endpoint || !sub.p256dh || !sub.auth_key) {
    return { success: false, error: 'Missing VAPID keys or subscription data' };
  }

  try {
    // Import web-push-compatible crypto for Deno
    // Using the Web Push protocol directly with Web Crypto API
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      url: payload.url ?? '/',
      data: payload.data,
    });

    // For Deno Edge Functions, we use a lightweight web-push implementation
    // This calls the push endpoint with proper VAPID headers
    const response = await webPushSend({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth_key },
      payload: pushPayload,
      vapidPublicKey,
      vapidPrivateKey,
      vapidSubject,
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    }

    // 410 Gone = subscription expired, should be cleaned up
    if (response.status === 410) {
      return { success: false, error: 'subscription_expired' };
    }

    return { success: false, error: `HTTP ${response.status}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Minimal VAPID Web Push implementation for Deno
async function webPushSend(opts: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  payload: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
}): Promise<Response> {
  // Generate VAPID JWT
  const url = new URL(opts.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: opts.vapidSubject,
  };

  // Import VAPID private key
  const rawPrivateKey = base64UrlDecode(opts.vapidPrivateKey);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    rawPrivateKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  // Create JWT
  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedClaims = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const signInput = new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`);

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    signInput,
  );

  const jwt = `${encodedHeader}.${encodedClaims}.${base64UrlEncode(new Uint8Array(signature))}`;

  // Encrypt payload using Web Push Encryption (aes128gcm)
  const encrypted = await encryptPayload(
    opts.payload,
    opts.keys.p256dh,
    opts.keys.auth,
  );

  // Send to push service
  return fetch(opts.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt}, k=${opts.vapidPublicKey}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body: encrypted,
  });
}

// ── Payload Encryption (RFC 8291) ────────────────────────────────────

async function encryptPayload(
  payload: string,
  p256dhBase64: string,
  authBase64: string,
): Promise<Uint8Array> {
  const userPublicKey = base64UrlDecode(p256dhBase64);
  const userAuth = base64UrlDecode(authBase64);
  const plaintext = new TextEncoder().encode(payload);

  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );

  // Import user's public key
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    userPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: clientPublicKey },
      localKeyPair.privateKey,
      256,
    ),
  );

  // Export local public key (raw, 65 bytes uncompressed)
  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey),
  );

  // Key derivation (HKDF)
  // IKM = ECDH shared secret
  // auth_secret = userAuth
  // PRK = HKDF-Extract(auth_secret, shared_secret)
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prkKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveBits']);

  // IKM for main HKDF
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: userAuth,
        info: concatBuffers(
          new TextEncoder().encode('WebPush: info\0'),
          userPublicKey,
          localPublicKeyRaw,
        ),
      },
      prkKey,
      256,
    ),
  );

  // Derive CEK and nonce
  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode('Content-Encoding: aes128gcm\0') },
    ikmKey,
    128,
  );

  const nonceBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode('Content-Encoding: nonce\0') },
      ikmKey,
      96,
    ),
  );

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, ['encrypt']);

  // Add padding delimiter (0x02 for final record)
  const paddedPlaintext = concatBuffers(plaintext, new Uint8Array([2]));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonceBits },
      aesKey,
      paddedPlaintext,
    ),
  );

  // aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const idlen = new Uint8Array([65]);

  return concatBuffers(salt, rs, idlen, localPublicKeyRaw, ciphertext);
}

// ── WhatsApp Business API ────────────────────────────────────────────

async function sendWhatsApp(
  sub: Subscription,
  payload: { title: string; body: string },
): Promise<{ success: boolean; error?: string }> {
  const token = Deno.env.get('WHATSAPP_API_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!token || !phoneNumberId || !sub.whatsapp_phone) {
    return { success: false, error: 'WhatsApp not configured or no phone number' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: sub.whatsapp_phone,
          type: 'text',
          text: {
            body: `*${payload.title}*\n${payload.body}`,
          },
        }),
      },
    );

    if (response.ok) {
      return { success: true };
    }

    const err = await response.text();
    return { success: false, error: `WhatsApp API ${response.status}: ${err}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── Telegram Bot API ─────────────────────────────────────────────────

async function sendTelegram(
  sub: Subscription,
  payload: { title: string; body: string; url?: string },
): Promise<{ success: boolean; error?: string }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

  if (!botToken || !sub.telegram_chat_id) {
    return { success: false, error: 'Telegram not configured or no chat_id' };
  }

  try {
    const text = `*${escapeMarkdownV2(payload.title)}*\n${escapeMarkdownV2(payload.body)}`;

    const body: Record<string, unknown> = {
      chat_id: sub.telegram_chat_id,
      text,
      parse_mode: 'MarkdownV2',
    };

    // Add inline keyboard with link button if URL provided
    if (payload.url) {
      body.reply_markup = {
        inline_keyboard: [[
          { text: '📱 Open FitBuddy', url: payload.url },
        ]],
      };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (response.ok) {
      return { success: true };
    }

    const err = await response.text();
    return { success: false, error: `Telegram API ${response.status}: ${err}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+=|{}.!\\-])/g, '\\$1');
}

// ── Utility ──────────────────────────────────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

// ── Main Handler ─────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Validate JWT (get calling user)
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey,
      },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { id: callingUserId } = await userRes.json();

    const body: PushRequest = await req.json();

    if (!body.title || !body.body || !body.notification_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, body, notification_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const targetUserId = body.user_id ?? callingUserId;

    // Fetch active subscriptions for target user
    let query = `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${targetUserId}&is_active=eq.true`;
    if (body.channel) {
      query += `&channel=eq.${body.channel}`;
    }

    const subsRes = await fetch(query, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
    });

    const subscriptions: Subscription[] = subsRes.ok ? await subsRes.json() : [];

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No active subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Dispatch to each channel
    const results: { channel: string; success: boolean; error?: string }[] = [];

    for (const sub of subscriptions) {
      let result: { success: boolean; error?: string };

      switch (sub.channel) {
        case 'web_push':
          result = await sendWebPush(sub, {
            title: body.title,
            body: body.body,
            url: body.url,
            data: body.data,
          });
          break;
        case 'whatsapp':
          result = await sendWhatsApp(sub, {
            title: body.title,
            body: body.body,
          });
          break;
        case 'telegram':
          result = await sendTelegram(sub, {
            title: body.title,
            body: body.body,
            url: body.url ?? 'https://fudda.de',
          });
          break;
        default:
          result = { success: false, error: `Unknown channel: ${sub.channel}` };
      }

      // Deactivate expired subscriptions
      if (result.error === 'subscription_expired') {
        await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ is_active: false }),
        });
      }

      // Log notification
      await fetch(`${supabaseUrl}/rest/v1/notification_log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          user_id: targetUserId,
          channel: sub.channel,
          notification_type: body.notification_type,
          title: body.title,
          body: body.body,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error ?? null,
          delivered_at: result.success ? new Date().toISOString() : null,
        }),
      });

      results.push({ channel: sub.channel, ...result });
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ sent, failed, results }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('send-push error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
