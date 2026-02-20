import { Bell, BellOff } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import type { NotificationType } from '../types';

const TYPE_ICONS: Record<NotificationType, string> = {
  substance: '\uD83D\uDC8A',
  blood_pressure: '\u2764\uFE0F',
  body_measurement: '\u2696\uFE0F',
  custom: '\uD83D\uDCCC',
  daily_summary: '\uD83D\uDCCA',
};

/**
 * Notification settings card for the Profile page.
 * Handles permission, master toggle, per-type toggles, summary time, quiet hours.
 */
export function NotificationSettings() {
  const { t } = useTranslation();
  const { permission, supported, request } = useNotificationPermission();
  const {
    prefs,
    toggleEnabled,
    toggleType,
    toggleQuietHours,
    setDailySummaryTime,
    setQuietHoursRange,
  } = useNotificationPreferences();

  if (!supported) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm opacity-60">
        <div className="flex items-center gap-2">
          <BellOff className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">{t.notifications.notSupported}</span>
        </div>
      </div>
    );
  }

  const handleToggleEnabled = async () => {
    // Always toggle the preference first (responsive UI)
    toggleEnabled();

    // If enabling and permission not yet granted, request it
    if (!prefs.enabled && permission !== 'granted') {
      // Fire-and-forget: permission dialog is async and browser-dependent
      request();
    }
  };

  const notificationTypes: { type: NotificationType; labelKey: keyof typeof t.notifications }[] = [
    { type: 'substance', labelKey: 'substance' },
    { type: 'blood_pressure', labelKey: 'bloodPressure' },
    { type: 'body_measurement', labelKey: 'bodyMeasurement' },
    { type: 'custom', labelKey: 'custom' },
    { type: 'daily_summary', labelKey: 'dailySummary' },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {/* Header with Master Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">{t.notifications.title}</h3>
        </div>
        <button
          onClick={handleToggleEnabled}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            prefs.enabled ? 'bg-teal-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              prefs.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Permission denied hint */}
      {permission === 'denied' && (
        <p className="text-xs text-red-500 mb-3">{t.notifications.permissionDenied}</p>
      )}

      {/* Settings (visible when enabled, regardless of permission state) */}
      {prefs.enabled && (
        <div className="space-y-3">
          {/* Per-type toggles */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t.notifications.types}
            </p>
            <div className="space-y-2">
              {notificationTypes.map(({ type, labelKey }) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {TYPE_ICONS[type]} {t.notifications[labelKey]}
                  </span>
                  <button
                    onClick={() => toggleType(type)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      prefs.types[type] ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        prefs.types[type] ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Daily Summary Time */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{t.notifications.dailySummaryTime}</span>
            <input
              type="time"
              value={prefs.dailySummaryTime}
              onChange={(e) => setDailySummaryTime(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Quiet Hours */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">{t.notifications.quietHours}</span>
              <button
                onClick={toggleQuietHours}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  prefs.quietHours.enabled ? 'bg-teal-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    prefs.quietHours.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {prefs.quietHours.enabled && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{t.notifications.quietHoursFrom}</span>
                <input
                  type="time"
                  value={prefs.quietHours.start}
                  onChange={(e) => setQuietHoursRange(e.target.value, prefs.quietHours.end)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
                <span>{t.notifications.quietHoursTo}</span>
                <input
                  type="time"
                  value={prefs.quietHours.end}
                  onChange={(e) => setQuietHoursRange(prefs.quietHours.start, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disabled state hint */}
      {!prefs.enabled && permission !== 'denied' && (
        <p className="text-xs text-gray-400">{t.notifications.disabled}</p>
      )}
    </div>
  );
}
