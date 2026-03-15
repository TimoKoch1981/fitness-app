-- Cloud Push Notifications — FCM, WhatsApp, Telegram
-- 2026-03-16

-- ═══════════════════════════════════════════════════════════════════════
-- 1. PUSH SUBSCRIPTIONS (Web Push / FCM tokens)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('web_push', 'fcm', 'whatsapp', 'telegram')),
  -- Web Push: full PushSubscription JSON (endpoint + keys)
  endpoint TEXT,
  p256dh TEXT,
  auth_key TEXT,
  -- FCM: device token
  fcm_token TEXT,
  -- WhatsApp: phone number (E.164 format)
  whatsapp_phone TEXT,
  -- Telegram: chat_id from bot
  telegram_chat_id TEXT,
  -- Meta
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
);

-- Partial unique indexes per channel (PostgreSQL doesn't support COALESCE in UNIQUE constraints)
CREATE UNIQUE INDEX idx_push_sub_unique_endpoint ON push_subscriptions(user_id, channel, endpoint) WHERE endpoint IS NOT NULL;
CREATE UNIQUE INDEX idx_push_sub_unique_whatsapp ON push_subscriptions(user_id, channel, whatsapp_phone) WHERE whatsapp_phone IS NOT NULL;
CREATE UNIQUE INDEX idx_push_sub_unique_telegram ON push_subscriptions(user_id, channel, telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE UNIQUE INDEX idx_push_sub_unique_fcm ON push_subscriptions(user_id, channel, fcm_token) WHERE fcm_token IS NOT NULL;

CREATE INDEX idx_push_sub_user ON push_subscriptions(user_id, is_active);
CREATE INDEX idx_push_sub_channel ON push_subscriptions(channel, is_active);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON push_subscriptions TO authenticated;
GRANT ALL ON push_subscriptions TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. NOTIFICATION LOG (delivery tracking)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('web_push', 'fcm', 'whatsapp', 'telegram', 'local')),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_notification_log_user ON notification_log(user_id, created_at DESC);
CREATE INDEX idx_notification_log_status ON notification_log(status) WHERE status = 'pending';

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all"
  ON notification_log FOR ALL
  USING (auth.uid() = user_id OR current_setting('role') = 'service_role');

GRANT ALL ON notification_log TO authenticated;
GRANT ALL ON notification_log TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. PUSH PREFERENCES (server-side, extends existing local prefs)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_channels JSONB DEFAULT '{"web_push": true, "whatsapp": false, "telegram": false}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_quiet_start TEXT DEFAULT '22:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_quiet_end TEXT DEFAULT '07:00';

-- Notification: pgrst reload
NOTIFY pgrst, 'reload schema';
