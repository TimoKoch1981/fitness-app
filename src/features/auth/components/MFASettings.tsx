import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { useMFA } from '../hooks/useMFA';
import { MFASetupDialog } from './MFASetupDialog';
import { useTranslation } from '../../../i18n';

/**
 * MFA Settings card for ProfilePage.
 * Shows current MFA status and allows enable/disable.
 */
export function MFASettings() {
  const { t } = useTranslation();
  const { getMFAFactors, unenrollMFA, loading } = useMFA();
  const [factors, setFactors] = useState<Array<{ id: string; friendly_name?: string; status: string }>>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const mfa = (t as unknown as Record<string, Record<string, string>>).mfa ?? {};
  const isEnabled = factors.some((f) => f.status === 'verified');

  const loadFactors = useCallback(async () => {
    const { factors } = await getMFAFactors();
    setFactors(factors);
    setInitialLoading(false);
  }, [getMFAFactors]);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  const handleDisable = async () => {
    const verifiedFactor = factors.find((f) => f.status === 'verified');
    if (!verifiedFactor) return;
    const { error } = await unenrollMFA(verifiedFactor.id);
    if (!error) {
      setConfirmDisable(false);
      loadFactors();
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-500" />
          {mfa.title || 'Zwei-Faktor-Authentifizierung (2FA)'}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          {mfa.description || 'Schuetze dein Konto mit einem zusaetzlichen Sicherheitscode bei der Anmeldung.'}
        </p>

        {initialLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.common?.loading || 'Laden...'}
          </div>
        ) : isEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-emerald-700 font-medium">{mfa.enabled || '2FA ist aktiviert'}</span>
            </div>
            {confirmDisable ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="text-sm text-red-700">{mfa.confirmDisable || 'Bist du sicher? Dein Konto wird weniger geschuetzt sein.'}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDisable}
                    disabled={loading}
                    className="flex-1 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {mfa.disable || '2FA deaktivieren'}
                  </button>
                  <button
                    onClick={() => setConfirmDisable(false)}
                    className="flex-1 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {t.common?.cancel || 'Abbrechen'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisable(true)}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
              >
                <ShieldOff className="h-4 w-4" />
                {mfa.disable || '2FA deaktivieren'}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowSetup(true)}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg text-sm hover:from-teal-600 hover:to-emerald-700 transition-all"
          >
            {mfa.enable || '2FA aktivieren'}
          </button>
        )}
      </div>

      <MFASetupDialog
        open={showSetup}
        onClose={() => setShowSetup(false)}
        onSuccess={() => {
          setShowSetup(false);
          loadFactors();
        }}
      />
    </>
  );
}
