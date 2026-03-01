/**
 * AddSymptomDialog — Log daily symptoms with category tags and severity.
 *
 * Follows AddCycleLogDialog pattern: multi-select symptom tags,
 * severity slider, notes field, date pre-filled as today.
 * Uses amber/orange theme (distinct from rose/cycle, indigo/sleep).
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddSymptomLog, getSymptomEmoji, getSeverityEmoji } from '../hooks/useSymptomLogs';
import type { SymptomKey } from '../../../types/health';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Grouped symptom keys for UI layout
const SYMPTOM_GROUPS: { label_de: string; label_en: string; icon: string; keys: SymptomKey[] }[] = [
  {
    label_de: 'Schmerz',
    label_en: 'Pain',
    icon: '🤕',
    keys: ['headache', 'back_pain', 'neck_pain', 'joint_pain', 'muscle_soreness'],
  },
  {
    label_de: 'Verdauung',
    label_en: 'Digestive',
    icon: '🤢',
    keys: ['bloating', 'nausea', 'diarrhea', 'constipation', 'loss_of_appetite'],
  },
  {
    label_de: 'Atemwege',
    label_en: 'Respiratory',
    icon: '😷',
    keys: ['cough', 'sore_throat', 'congestion', 'shortness_of_breath'],
  },
  {
    label_de: 'Haut',
    label_en: 'Skin',
    icon: '🧴',
    keys: ['rash', 'acne', 'dry_skin', 'itching'],
  },
  {
    label_de: 'Neuro',
    label_en: 'Neuro',
    icon: '🧠',
    keys: ['brain_fog', 'dizziness', 'fatigue', 'insomnia'],
  },
  {
    label_de: 'Sonstige',
    label_en: 'Other',
    icon: '💓',
    keys: ['palpitations', 'fever'],
  },
];

export function AddSymptomDialog({ open, onClose }: Props) {
  const { t, language } = useTranslation();
  const addLog = useAddSymptomLog();
  const de = language === 'de';

  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomKey[]>([]);
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const toggleSymptom = (s: SymptomKey) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
  };

  // Access symptom translations
  const sym = (t as Record<string, unknown>).symptoms as Record<string, string> | undefined;

  const handleSave = async () => {
    if (selectedSymptoms.length === 0) {
      setError(de ? 'Bitte mindestens ein Symptom auswählen' : 'Please select at least one symptom');
      return;
    }

    try {
      await addLog.mutateAsync({
        symptoms: selectedSymptoms,
        severity,
        notes: notes.trim() || undefined,
      });
      setSelectedSymptoms([]);
      setSeverity(3);
      setNotes('');
      setError('');
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            🩺 {de ? 'Symptome erfassen' : 'Log Symptoms'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Symptom Groups */}
        <div className="space-y-3 mb-4">
          {SYMPTOM_GROUPS.map(group => (
            <div key={group.label_en}>
              <p className="text-xs text-gray-500 font-medium mb-1.5">
                {group.icon} {de ? group.label_de : group.label_en}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.keys.map(key => {
                  const active = selectedSymptoms.includes(key);
                  const label = sym?.[key] ?? key.replace(/_/g, ' ');
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSymptom(key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {getSymptomEmoji(key)} {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Severity */}
        {selectedSymptoms.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 font-medium mb-2">
              {de ? 'Schweregrad' : 'Severity'}
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`flex-1 py-2 rounded-lg text-center transition-colors ${
                    severity === level
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-sm">{getSeverityEmoji(level)}</span>
                  <p className="text-[9px] mt-0.5">{level}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium block mb-1">
            {t.common.notes} ({de ? 'optional' : 'optional'})
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
            placeholder={de ? 'z.B. seit gestern Abend, nach dem Training...' : 'e.g. since last night, after workout...'}
          />
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={addLog.isPending || selectedSymptoms.length === 0}
          className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {addLog.isPending
            ? (de ? 'Speichern...' : 'Saving...')
            : (de ? `${selectedSymptoms.length} Symptom${selectedSymptoms.length !== 1 ? 'e' : ''} speichern` : `Save ${selectedSymptoms.length} symptom${selectedSymptoms.length !== 1 ? 's' : ''}`)}
        </button>
      </div>
    </div>
  );
}
