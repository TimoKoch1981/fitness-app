import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useDeleteAccount } from '../hooks/useDeleteAccount';

interface DeleteAccountDialogProps {
  onClose: () => void;
}

/**
 * Bestaetigungs-Dialog fuer die Account-Loeschung (DSGVO Art. 17).
 *
 * Sicherheitsmaßnahmen:
 * 1. User muss "LOESCHEN" eintippen (Tippfehler-Schutz)
 * 2. Unumkehrbar — klare Warnung
 * 3. Zeigt was alles geloescht wird
 */
export function DeleteAccountDialog({ onClose }: DeleteAccountDialogProps) {
  const { t, language } = useTranslation();
  const deleteAccount = useDeleteAccount();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');

  const confirmWord = language === 'de' ? 'LOESCHEN' : 'DELETE';
  const isConfirmed = confirmation === confirmWord;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setError('');

    try {
      await deleteAccount.mutateAsync();
      // After deletion, AuthProvider will detect signOut and redirect to /login
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.deleteAccount.title}</h2>
            <p className="text-xs text-gray-500">{t.deleteAccount.subtitle}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800 font-medium mb-2">{t.deleteAccount.warning}</p>
          <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
            <li>{t.deleteAccount.deleteProfile}</li>
            <li>{t.deleteAccount.deleteMeals}</li>
            <li>{t.deleteAccount.deleteTraining}</li>
            <li>{t.deleteAccount.deleteMedical}</li>
            <li>{t.deleteAccount.deleteSubstances}</li>
            <li>{t.deleteAccount.deleteAll}</li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.deleteAccount.confirmLabel.replace('{word}', confirmWord)}
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={confirmWord}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
            autoComplete="off"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || deleteAccount.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleteAccount.isPending ? t.common.loading : t.deleteAccount.deleteButton}
          </button>
        </div>
      </div>
    </div>
  );
}
