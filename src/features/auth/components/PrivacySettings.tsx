import { useState } from 'react';
import { Shield, Brain, Globe, Heart, AlertTriangle, Check, X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';

/**
 * Datenschutz-Einstellungen (DSGVO Art. 7 Abs. 3 — Widerrufsrecht)
 *
 * Zeigt den Status der 3 granularen Einwilligungen und erlaubt
 * den Widerruf einzelner Kategorien.
 *
 * Bei Widerruf einer essentiellen Einwilligung (Gesundheitsdaten oder KI):
 * → Consent-Felder werden auf NULL gesetzt
 * → localStorage-Cache wird geloescht
 * → DisclaimerModal wird beim naechsten Seitenaufruf erneut gezeigt
 */
export function PrivacySettings() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  if (!profile) return null;

  const consents = [
    {
      id: 'health_data',
      icon: <Heart className="h-5 w-5" />,
      label: t.privacySettings.healthDataLabel,
      description: t.privacySettings.healthDataDesc,
      warning: t.privacySettings.healthDataWarning,
      granted: !!profile.consent_health_data_at,
      date: profile.consent_health_data_at,
    },
    {
      id: 'ai_processing',
      icon: <Brain className="h-5 w-5" />,
      label: t.privacySettings.aiProcessingLabel,
      description: t.privacySettings.aiProcessingDesc,
      warning: t.privacySettings.aiProcessingWarning,
      granted: !!profile.consent_ai_processing_at,
      date: profile.consent_ai_processing_at,
    },
    {
      id: 'third_country',
      icon: <Globe className="h-5 w-5" />,
      label: t.privacySettings.thirdCountryLabel,
      description: t.privacySettings.thirdCountryDesc,
      warning: t.privacySettings.thirdCountryWarning,
      granted: !!profile.consent_third_country_at,
      date: profile.consent_third_country_at,
    },
  ];

  const handleRevoke = async (consentId: string) => {
    setRevoking(consentId);
    setShowConfirm(null);

    const update: Record<string, string | null> = {};
    if (consentId === 'health_data') update.consent_health_data_at = null as unknown as string;
    if (consentId === 'ai_processing') update.consent_ai_processing_at = null as unknown as string;
    if (consentId === 'third_country') update.consent_third_country_at = null as unknown as string;

    try {
      await updateProfile.mutateAsync(update as any);

      // Clear localStorage consent cache to force re-check
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fitbuddy-consent-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-800">
          {t.privacySettings.title}
        </h3>
      </div>
      <p className="text-xs text-gray-500">
        {t.privacySettings.subtitle}
      </p>

      {/* Consent Cards */}
      <div className="space-y-2">
        {consents.map((consent) => (
          <div
            key={consent.id}
            className={`rounded-xl border p-3 ${
              consent.granted
                ? 'border-teal-200 bg-teal-50/50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${consent.granted ? 'text-teal-600' : 'text-gray-400'}`}>
                {consent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {consent.label}
                  </span>
                  {consent.granted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full">
                      <Check className="h-3 w-3" />
                      {t.privacySettings.granted}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                      <X className="h-3 w-3" />
                      {t.privacySettings.revoked}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {consent.description}
                </p>
                {consent.granted && consent.date && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t.privacySettings.grantedOn}: {new Date(consent.date).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>

              {/* Revoke Button */}
              {consent.granted && (
                <div>
                  {showConfirm === consent.id ? (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleRevoke(consent.id)}
                        disabled={revoking === consent.id}
                        className="text-[10px] px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {revoking === consent.id ? '...' : t.privacySettings.confirmRevoke}
                      </button>
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="text-[10px] px-2 py-1 text-gray-500 hover:text-gray-700"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(consent.id)}
                      className="text-[10px] px-2 py-1 text-red-500 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      {t.privacySettings.revoke}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Warning when confirming revoke */}
            {showConfirm === consent.id && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  {consent.warning}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Note */}
      <p className="text-[10px] text-gray-400 leading-relaxed">
        {t.privacySettings.infoNote}
      </p>
    </div>
  );
}
