/**
 * validate-avatar — Server-Magic-Bytes-Check fuer Avatar-Upload (PH6).
 *
 * Problem:
 *   Supabase Storage prueft nur Content-Type-Header, das Frontend kann den
 *   spoofen. Ein als image/webp deklarierter PHP-Webshell oder polyglot-File
 *   wuerde durchgelassen. Mitigationen:
 *     1. CSP blockt zwar Script-Execution, aber heruntergeladen-und-lokal-
 *        ausgefuehrt waere die Datei trotzdem ein Vehikel
 *     2. Storage-public-URL ist via CDN cacheable -> Tausch ware schwierig
 *
 * Loesung (Defense-in-Depth):
 *   Client laedt via diese Edge Function. Function:
 *     1. JWT verifizieren (auth.uid -> Pfad-Praefix)
 *     2. Body als base64 decode -> binary bytes
 *     3. Magic-Bytes-Check fuer WebP / JPEG / PNG
 *     4. Size-Limit hard 256 KB (Client komprimiert eigentlich auf 200 KB)
 *     5. Upload via service_role -> bypass Storage-Bucket-RLS, da Caller-JWT
 *        bereits geprueft wurde
 *     6. Returns { public_url, path }
 *
 * Old Storage RLS-Insert-Policy bleibt aktiv als Fallback (Defense-in-Depth-2),
 * aber Frontend ruft jetzt diese Function statt direkt storage.upload.
 *
 * Required env vars:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BUCKET = 'avatars';
const FILENAME = 'avatar.webp';
const MAX_BYTES = 256 * 1024;  // 256 KB hard limit

// ── Magic-Bytes-Detection ────────────────────────────────────────────────
//
// Quelle: ISO/IEC 15444, RFC 2083, RFC 6386
//   JPEG: FF D8 FF
//   PNG : 89 50 4E 47 0D 0A 1A 0A
//   WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50  (RIFF....WEBP)
//   GIF87a/89a sind in Bucket-Config nicht erlaubt -> ablehnen
//
// Sicherheitslogik:
//   - Polyglot-Files (Datei laesst sich als A interpretieren UND B) gibt es,
//     aber wir akzeptieren nur die Magic-Bytes am Anfang. Wenn jemand was
//     interessantes danach versteckt, ist es trotzdem als image/webp
//     deklariert und der Browser wird's als Bild rendern (nicht als Script)
//     dank Content-Type:image/webp + X-Content-Type-Options:nosniff.

type Format = 'webp' | 'jpeg' | 'png';

function detectFormat(bytes: Uint8Array): Format | null {
  if (bytes.length < 12) return null;
  // WebP: "RIFF...."  "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'webp';
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
    bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A
  ) return 'png';
  return null;
}

function contentTypeFor(fmt: Format): string {
  switch (fmt) {
    case 'webp': return 'image/webp';
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
  }
}

// ── Base64-Decode (binary-safe) ──────────────────────────────────────────
function base64ToBytes(b64: string): Uint8Array {
  const stripped = b64.replace(/^data:[^;]+;base64,/, '');
  const bin = atob(stripped);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ── Handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://kong:8000';
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 1. JWT verifizieren
  const token = authHeader.replace('Bearer ', '');
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SERVICE_KEY },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const user = await userRes.json() as { id: string };

  // 2. Body parsen
  let payload: { file_b64?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!payload.file_b64 || typeof payload.file_b64 !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing file_b64' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Base64 -> bytes
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(payload.file_b64);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid base64' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4. Size-Check
  if (bytes.length === 0) {
    return new Response(JSON.stringify({ error: 'Empty file' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (bytes.length > MAX_BYTES) {
    return new Response(JSON.stringify({
      error: `File too large (${bytes.length} bytes, max ${MAX_BYTES})`,
    }), {
      status: 413,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 5. Magic-Bytes-Check
  const format = detectFormat(bytes);
  if (!format) {
    return new Response(JSON.stringify({
      error: 'Unsupported file format. Allowed: WebP, JPEG, PNG',
      first_bytes_hex: Array.from(bytes.slice(0, 12)).map(b => b.toString(16).padStart(2,'0')).join(' '),
    }), {
      status: 415,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 6. Upload via service_role to avatars/{user_id}/avatar.webp
  //    (Wir behalten den Dateinamen .webp auch fuer JPEG/PNG-Uploads — Content-Type-Header
  //     ist authoritativ und der Browser rendert korrekt.)
  const path = `${user.id}/${FILENAME}`;
  const storageUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
  const uploadRes = await fetch(storageUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': contentTypeFor(format),
      'x-upsert': 'true',
      'cache-control': 'max-age=0',
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    const errBody = await uploadRes.text();
    console.error('[validate-avatar] Storage upload failed:', uploadRes.status, errBody.slice(0, 300));
    return new Response(JSON.stringify({
      error: `Storage upload failed: ${uploadRes.status}`,
      detail: errBody.slice(0, 300),
    }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 7. Public-URL bauen
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

  console.log('[validate-avatar] OK', user.id, format, bytes.length, 'bytes');

  return new Response(JSON.stringify({
    ok: true,
    path,
    public_url: publicUrl,
    format,
    size_bytes: bytes.length,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
