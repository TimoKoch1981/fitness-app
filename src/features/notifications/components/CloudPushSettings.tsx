/**
 * CloudPushSettings — UI for managing Web Push, WhatsApp, and Telegram notifications.
 * Integrates into the Profile → Notification settings section.
 */

import { useState } from 'react';
import {
  Bell, BellRing, Smartphone, MessageCircle, Send, Trash2, Loader2,
  CheckCircle, XCircle, ExternalLink, Copy, AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import {
  usePushSubscriptions,
  useToggleWebPush,
  useRegisterWhatsApp,
  useLinkTelegram,
  useRemovePushSubscription,
  useSendTestPush,
  isWebPushSupported,
} from '../hooks/usePushSubscriptions';

const TELEGRAM_BOT_NAME = 'FitBuddyNotify_Bot';

export function CloudPushSettings() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: subscriptions, isLoading } = usePushSubscriptions();
  const toggleWebPush = useToggleWebPush();
  const registerWhatsApp = useRegisterWhatsApp();
  const linkTelegram = useLinkTelegram();
  const removeSub = useRemovePushSubscription();
  const sendTest = useSendTestPush();

  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const webPushSubs = (subscriptions ?? []).filter(s => s.channel === 'web_push' && s.is_active);
  const whatsappSubs = (subscriptions ?? []).filter(s => s.channel === 'whatsapp' && s.is_active);
  const telegramSubs = (subscriptions ?? []).filter(s => s.channel === 'telegram' && s.is_active);
  const hasWebPush = webPushSubs.length > 0;
  const hasWhatsApp = whatsappSubs.length > 0;
  const hasTelegram = telegramSubs.length > 0;

  const handleToggleWebPush = () => {
    toggleWebPush.mutate(!hasWebPush);
  };

  const handleWhatsApp = () => {
    if (!whatsappPhone.trim()) return;
    registerWhatsApp.mutate(whatsappPhone.trim(), {
      onSuccess: () => {
        setWhatsappPhone('');
        setShowWhatsAppInput(false);
      },
    });
  };

  const handleTelegram = () => {
    linkTelegram.mutate(undefined, {
      onSuccess: (token) => {
        setTelegramToken(token);
      },
    });
  };

  const handleTest = (channel?: 'web_push' | 'whatsapp' | 'telegram') => {
    setTestResult(null);
    sendTest.mutate(channel, {
      onSuccess: (result) => {
        setTestResult({
          success: result.sent > 0,
          message: result.sent > 0
            ? (isDE ? `${result.sent} Benachrichtigung(en) gesendet` : `${result.sent} notification(s) sent`)
            : (isDE ? 'Keine aktiven Kanäle' : 'No active channels'),
        });
      },
      onError: (err) => {
        setTestResult({
          success: false,
          message: String(err),
        });
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-teal-600" />
        <h3 className="font-semibold text-gray-900">
          {isDE ? 'Cloud-Push Kanäle' : 'Cloud Push Channels'}
        </h3>
      </div>

      <p className="text-xs text-gray-500">
        {isDE
          ? 'Erhalte Benachrichtigungen auch wenn die App geschlossen ist.'
          : 'Receive notifications even when the app is closed.'}
      </p>

      {/* ── Web Push ──────────────────────────────────────────── */}
      <div className="border border-gray-100 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-800">
              {isDE ? 'Browser Push' : 'Browser Push'}
            </span>
            {!isWebPushSupported() && (
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                {isDE ? 'Nicht verfügbar' : 'Not available'}
              </span>
            )}
          </div>
          <button
            onClick={handleToggleWebPush}
            disabled={!isWebPushSupported() || toggleWebPush.isPending}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors disabled:opacity-40',
              hasWebPush ? 'bg-teal-500' : 'bg-gray-300',
            )}
          >
            <span className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              hasWebPush ? 'translate-x-5' : 'translate-x-0',
            )} />
          </button>
        </div>
        {hasWebPush && webPushSubs[0]?.device_name && (
          <p className="text-[10px] text-gray-400 pl-6">
            {webPushSubs[0].device_name}
          </p>
        )}
      </div>

      {/* ── WhatsApp ──────────────────────────────────────────── */}
      <div className="border border-gray-100 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-800">WhatsApp</span>
            {hasWhatsApp && (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            )}
          </div>
          {hasWhatsApp ? (
            <button
              onClick={() => removeSub.mutate(whatsappSubs[0].id)}
              disabled={removeSub.isPending}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setShowWhatsAppInput(!showWhatsAppInput)}
              className="px-2.5 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
            >
              {isDE ? 'Verbinden' : 'Connect'}
            </button>
          )}
        </div>

        {hasWhatsApp && (
          <p className="text-[10px] text-gray-400 pl-6">
            {whatsappSubs[0].whatsapp_phone}
          </p>
        )}

        {showWhatsAppInput && !hasWhatsApp && (
          <div className="flex gap-2 mt-1">
            <input
              type="tel"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="+49 170 1234567"
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleWhatsApp}
              disabled={!whatsappPhone.trim() || registerWhatsApp.isPending}
              className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {registerWhatsApp.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'OK'}
            </button>
          </div>
        )}

        {!hasWhatsApp && !showWhatsAppInput && (
          <p className="text-[10px] text-gray-400 pl-6">
            {isDE
              ? 'Erhalte Erinnerungen per WhatsApp'
              : 'Receive reminders via WhatsApp'}
          </p>
        )}
      </div>

      {/* ── Telegram ──────────────────────────────────────────── */}
      <div className="border border-gray-100 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-800">Telegram</span>
            {hasTelegram && (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            )}
          </div>
          {hasTelegram ? (
            <button
              onClick={() => removeSub.mutate(telegramSubs[0].id)}
              disabled={removeSub.isPending}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleTelegram}
              disabled={linkTelegram.isPending}
              className="px-2.5 py-1 bg-blue-50 text-blue-500 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
            >
              {linkTelegram.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : (isDE ? 'Verbinden' : 'Connect')
              }
            </button>
          )}
        </div>

        {hasTelegram && (
          <p className="text-[10px] text-gray-400 pl-6">
            {telegramSubs[0].device_name ?? 'Telegram'}
          </p>
        )}

        {/* Telegram link flow */}
        {telegramToken && !hasTelegram && (
          <div className="bg-blue-50 rounded-lg p-2.5 space-y-2 mt-1">
            <p className="text-xs text-blue-700">
              {isDE
                ? 'Klicke den Link und starte den Bot:'
                : 'Click the link and start the bot:'}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={`https://t.me/${TELEGRAM_BOT_NAME}?start=${telegramToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                @{TELEGRAM_BOT_NAME}
              </a>
              <button
                onClick={() => copyToClipboard(`https://t.me/${TELEGRAM_BOT_NAME}?start=${telegramToken}`)}
                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                title="Copy link"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-blue-500">
              {isDE
                ? 'Nach dem Start des Bots wird die Verbindung automatisch hergestellt.'
                : 'After starting the bot, the connection will be established automatically.'}
            </p>
          </div>
        )}

        {!hasTelegram && !telegramToken && (
          <p className="text-[10px] text-gray-400 pl-6">
            {isDE
              ? 'Erhalte Erinnerungen per Telegram Bot'
              : 'Receive reminders via Telegram Bot'}
          </p>
        )}
      </div>

      {/* ── Test Push ──────────────────────────────────────────── */}
      {(hasWebPush || hasWhatsApp || hasTelegram) && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <button
            onClick={() => handleTest()}
            disabled={sendTest.isPending}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            {sendTest.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Smartphone className="h-3.5 w-3.5" />
            )}
            {isDE ? 'Test-Benachrichtigung senden' : 'Send test notification'}
          </button>

          {testResult && (
            <div className={cn(
              'flex items-center gap-1.5 p-2 rounded-lg text-xs',
              testResult.success
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600',
            )}>
              {testResult.success
                ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                : <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
              }
              {testResult.message}
            </div>
          )}
        </div>
      )}

      {/* Info note about WhatsApp/Telegram setup */}
      {(!hasWhatsApp || !hasTelegram) && (
        <div className="flex items-start gap-1.5 text-[10px] text-gray-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span>
            {isDE
              ? 'WhatsApp und Telegram benötigen eine einmalige Server-Konfiguration durch den Administrator.'
              : 'WhatsApp and Telegram require one-time server configuration by the administrator.'}
          </span>
        </div>
      )}
    </div>
  );
}
