/**
 * Supabase Edge Function: telegram-webhook
 *
 * Receives Telegram Bot updates via webhook.
 * When a user sends /start <link_token>, links their Telegram chat_id
 * to their FitBuddy account.
 *
 * Setup:
 *   1. Create bot via @BotFather → get TELEGRAM_BOT_TOKEN
 *   2. Set webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *      Body: { "url": "https://fudda.de/functions/v1/telegram-webhook" }
 *
 * Environment Variables:
 *   TELEGRAM_BOT_TOKEN
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TelegramUpdate {
  message?: {
    chat: { id: number; first_name?: string };
    text?: string;
    from?: { id: number; first_name?: string; username?: string };
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!botToken) {
    return new Response('Bot not configured', { status: 500 });
  }

  try {
    const update: TelegramUpdate = await req.json();
    const message = update.message;

    if (!message?.text || !message.chat) {
      return new Response('ok', { status: 200 });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // Handle /start <link_token> command
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const linkToken = parts[1]; // /start <token>

      if (!linkToken) {
        // User just sent /start without token — send welcome
        await sendTelegramMessage(botToken, chatId,
          '👋 Willkommen bei FitBuddy!\n\n' +
          'Um Benachrichtigungen zu erhalten, verbinde deinen Account:\n' +
          '1. Öffne FitBuddy → Profil → Benachrichtigungen\n' +
          '2. Klicke auf "Telegram verbinden"\n' +
          '3. Folge dem Link zurück hierher\n\n' +
          'Welcome to FitBuddy! To receive notifications, connect your account in the app settings.',
        );
        return new Response('ok', { status: 200 });
      }

      // Look up link_token in push_subscriptions (stored temporarily as telegram_chat_id)
      // The link flow: Frontend creates a subscription with telegram_chat_id = link_token
      // When Telegram sends the /start, we replace link_token with actual chat_id
      const lookupRes = await fetch(
        `${supabaseUrl}/rest/v1/push_subscriptions?channel=eq.telegram&telegram_chat_id=eq.${linkToken}&is_active=eq.false`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        },
      );

      const matches = lookupRes.ok ? await lookupRes.json() : [];

      if (matches.length > 0) {
        // Activate subscription with real chat_id
        await fetch(
          `${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${matches[0].id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              telegram_chat_id: chatId,
              is_active: true,
              device_name: message.from?.first_name ?? 'Telegram',
              updated_at: new Date().toISOString(),
            }),
          },
        );

        await sendTelegramMessage(botToken, chatId,
          '✅ Erfolgreich verbunden!\n\n' +
          'Du erhältst jetzt FitBuddy-Benachrichtigungen hier.\n' +
          'Connected! You will now receive FitBuddy notifications here.',
        );
      } else {
        await sendTelegramMessage(botToken, chatId,
          '❌ Token nicht gefunden oder abgelaufen.\n' +
          'Bitte erstelle einen neuen Link in der FitBuddy App.\n\n' +
          'Token not found or expired. Please create a new link in the FitBuddy app.',
        );
      }

      return new Response('ok', { status: 200 });
    }

    // Handle /status command
    if (text === '/status') {
      const subRes = await fetch(
        `${supabaseUrl}/rest/v1/push_subscriptions?channel=eq.telegram&telegram_chat_id=eq.${chatId}&is_active=eq.true`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        },
      );

      const subs = subRes.ok ? await subRes.json() : [];

      if (subs.length > 0) {
        await sendTelegramMessage(botToken, chatId,
          '✅ Dein Telegram ist mit FitBuddy verbunden.\n' +
          'Your Telegram is connected to FitBuddy.',
        );
      } else {
        await sendTelegramMessage(botToken, chatId,
          '❌ Nicht verbunden. Gehe zu FitBuddy → Profil → Benachrichtigungen.\n' +
          'Not connected. Go to FitBuddy → Profile → Notifications.',
        );
      }

      return new Response('ok', { status: 200 });
    }

    // Handle /stop command
    if (text === '/stop') {
      await fetch(
        `${supabaseUrl}/rest/v1/push_subscriptions?channel=eq.telegram&telegram_chat_id=eq.${chatId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
        },
      );

      await sendTelegramMessage(botToken, chatId,
        '🔕 Benachrichtigungen deaktiviert.\n' +
        'Notifications disabled. Send /start to re-enable.',
      );

      return new Response('ok', { status: 200 });
    }

    // Unknown command
    await sendTelegramMessage(botToken, chatId,
      '🤖 FitBuddy Bot\n\n' +
      'Befehle / Commands:\n' +
      '/status — Verbindungsstatus / Connection status\n' +
      '/stop — Benachrichtigungen aus / Disable notifications',
    );

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('telegram-webhook error:', err);
    return new Response('ok', { status: 200 }); // Always 200 for Telegram
  }
});

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
