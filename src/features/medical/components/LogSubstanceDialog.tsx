import { useState } from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSubstances, useLogSubstance } from '../hooks/useSubstances';
import { INJECTION_SITES } from '../../../lib/constants';
import type { InjectionSite } from '../../../types/health';

interface LogSubstanceDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LogSubstanceDialog({ open, onClose }: LogSubstanceDialogProps) {
  const { t } = useTranslation();
  const { data: substances } = useSubstances(true);
  const logSubstance = useLogSubstance();

  const [selectedId, setSelectedId] = useState('');
  const [dosageTaken, setDosageTaken] = useState('');
  const [site, setSite] = useState<InjectionSite | ''>('');
  const [taken, setTaken] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const selectedSubstance = substances?.find((s) => s.id === selectedId);
  const showInjectionSite =
    selectedSubstance?.type === 'injection' || selectedSubstance?.type === 'subcutaneous';

  const siteLabels: Record<string, string> = {
    glute_left: t.medical.site_glute_left,
    glute_right: t.medical.site_glute_right,
    delt_left: t.medical.site_delt_left,
    delt_right: t.medical.site_delt_right,
    quad_left: t.medical.site_quad_left,
    quad_right: t.medical.site_quad_right,
    ventro_glute_left: t.medical.site_ventro_glute_left,
    ventro_glute_right: t.medical.site_ventro_glute_right,
    abdomen: t.medical.site_abdomen,
    other: t.medical.site_other,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setError('');

    try {
      await logSubstance.mutateAsync({
        substance_id: selectedId,
        dosage_taken: dosageTaken || undefined,
        site: site ? (site as InjectionSite) : undefined,
        taken,
        notes: notes || undefined,
      });

      // Reset and close
      setSelectedId('');
      setDosageTaken('');
      setSite('');
      setTaken(true);
      setNotes('');
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10">
          <h2 className="text-lg font-semibold text-gray-900">{t.medical.logSubstance}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Substance Selector */}
          {substances && substances.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.medical.substances}
              </label>
              <div className="space-y-2">
                {substances.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(sub.id);
                      // Pre-fill dosage from substance definition
                      if (sub.dosage) setDosageTaken(sub.dosage);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      selectedId === sub.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                    <p className="text-xs text-gray-400">
                      {sub.dosage} {sub.unit} · {sub.frequency}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">{t.common.noData}</p>
              <p className="text-xs text-gray-400 mt-1">{t.medical.addSubstance}</p>
            </div>
          )}

          {selectedId && (
            <>
              {/* Taken / Skipped Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTaken(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    taken
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {t.medical.taken}
                </button>
                <button
                  type="button"
                  onClick={() => setTaken(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !taken
                      ? 'bg-gray-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  {t.medical.skipped}
                </button>
              </div>

              {/* Dosage Taken */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.medical.dosage}
                </label>
                <input
                  type="text"
                  value={dosageTaken}
                  onChange={(e) => setDosageTaken(e.target.value)}
                  placeholder={selectedSubstance?.dosage ?? '250 mg'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                />
              </div>

              {/* Injection Site (only for injection types) */}
              {showInjectionSite && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {t.medical.injectionSite}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {INJECTION_SITES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSite(s)}
                        className={`py-1.5 px-2 rounded-lg text-xs transition-colors ${
                          site === s
                            ? 'bg-teal-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {siteLabels[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.common.notes}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={logSubstance.isPending}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                {logSubstance.isPending ? t.common.loading : t.common.save}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
