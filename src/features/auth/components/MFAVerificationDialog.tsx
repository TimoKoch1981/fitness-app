import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useMFA } from '../hooks/useMFA';
import { useTranslation } from '../../../i18n';

interface MFAVerificationDialogProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * MFA verification dialog shown after login when TOTP is enrolled.
 * User enters the 6-digit code from their authenticator app.
 */
export function MFAVerificationDialog({ factorId, onSuccess, onCancel }: MFAVerificationDialogProps) {
  const { t } = useTranslation();
  const { verifyChallenge, loading } = useMFA();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const mfa = (t as unknown as Record<string, Record<string, string>>).mfa ?? {};

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setError('');
    const { error } = await verifyChallenge(factorId, code);
    if (error) {
      setError(error);
      setCode('');
    } else {
      onSuccess();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">{mfa.challengeTitle || 'Zwei-Faktor-Authentifizierung'}</h3>
        </div>

        <p className="text-sm text-gray-600">{mfa.enterCode || 'Gib den 6-stelligen Code aus deiner Authenticator-App ein.'}</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
        )}

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={handleKeyDown}
          placeholder="000000"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          autoFocus
        />

        <button
          onClick={handleVerify}
          disabled={code.length !== 6 || loading}
          className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
        >
          {loading ? (t.common?.loading || 'Laden...') : (mfa.verify || 'Verifizieren')}
        </button>

        <button
          onClick={onCancel}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          {t.common?.cancel || 'Abbrechen'}
        </button>
      </div>
    </div>
  );
}
