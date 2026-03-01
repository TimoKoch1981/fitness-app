import { useState, useEffect } from 'react';
import { X, ShieldCheck, Copy, CheckCircle } from 'lucide-react';
import { useMFA, type MFAEnrollment } from '../hooks/useMFA';
import { useTranslation } from '../../../i18n';

interface MFASetupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'qr' | 'verify' | 'success';

export function MFASetupDialog({ open, onClose, onSuccess }: MFASetupDialogProps) {
  const { t } = useTranslation();
  const { enrollMFA, verifyEnrollment, loading } = useMFA();
  const [step, setStep] = useState<Step>('qr');
  const [enrollment, setEnrollment] = useState<MFAEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const mfa = (t as Record<string, Record<string, string>>).mfa ?? {};

  useEffect(() => {
    if (open) {
      setStep('qr');
      setEnrollment(null);
      setCode('');
      setError('');
      setCopied(false);
      // Start enrollment
      enrollMFA().then(({ enrollment, error }) => {
        if (error) {
          setError(error);
        } else if (enrollment) {
          setEnrollment(enrollment);
        }
      });
    }
  }, [open, enrollMFA]);

  const handleVerify = async () => {
    if (!enrollment || code.length !== 6) return;
    setError('');
    const { error } = await verifyEnrollment(enrollment.id, code);
    if (error) {
      setError(error);
    } else {
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  const handleCopySecret = () => {
    if (enrollment?.totp.secret) {
      navigator.clipboard.writeText(enrollment.totp.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>

        {step === 'qr' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">{mfa.setupTitle || '2FA einrichten'}</h3>
            </div>

            <p className="text-sm text-gray-600">{mfa.scanQR || 'Scanne den QR-Code mit deiner Authenticator-App (z.B. Google Authenticator, Authy).'}</p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            {enrollment ? (
              <>
                <div className="flex justify-center bg-gray-50 rounded-xl p-4">
                  <img
                    src={enrollment.totp.qr_code}
                    alt="MFA QR Code"
                    className="w-48 h-48"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{mfa.manualEntry || 'Manueller Schluessel:'}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gray-700 break-all flex-1">{enrollment.totp.secret}</code>
                    <button onClick={handleCopySecret} className="text-gray-400 hover:text-teal-600 shrink-0">
                      {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setStep('verify')}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all"
                >
                  {mfa.next || 'Weiter'}
                </button>
              </>
            ) : (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">{mfa.verifyTitle || 'Code eingeben'}</h3>
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
              onClick={() => setStep('qr')}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              {mfa.back || 'Zurueck'}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{mfa.setupSuccess || '2FA aktiviert!'}</h3>
            <p className="text-sm text-gray-600">{mfa.setupSuccessDesc || 'Dein Konto ist jetzt durch Zwei-Faktor-Authentifizierung geschuetzt.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
