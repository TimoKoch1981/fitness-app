/**
 * AddBloodWorkDialog — Manual entry + photo upload for blood work values.
 *
 * Groups 22 biomarkers into 6 collapsible categories.
 * Optional: Upload lab report photo for AI-assisted auto-fill.
 * Reference ranges shown inline (green/amber/red).
 */

import { useState, useRef } from 'react';
import { X, Camera, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddBloodWork } from '../hooks/useBloodWork';
import { analyzeLabReport } from '../utils/bloodWorkVision';
import { today } from '../../../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface MarkerDef {
  key: string;
  label: string;
  unit: string;
  low: number;
  high: number;
  step?: string;
}

interface MarkerGroup {
  id: string;
  label: string;
  labelEN: string;
  markers: MarkerDef[];
}

const MARKER_GROUPS: MarkerGroup[] = [
  {
    id: 'hormones',
    label: 'Hormone',
    labelEN: 'Hormones',
    markers: [
      { key: 'testosterone_total', label: 'Testosteron (gesamt)', unit: 'ng/dL', low: 300, high: 1000 },
      { key: 'testosterone_free', label: 'Testosteron (frei)', unit: 'pg/mL', low: 5, high: 25 },
      { key: 'estradiol', label: 'Estradiol (E2)', unit: 'pg/mL', low: 10, high: 40 },
      { key: 'lh', label: 'LH', unit: 'mIU/mL', low: 1.5, high: 9.3 },
      { key: 'fsh', label: 'FSH', unit: 'mIU/mL', low: 1.4, high: 18.1 },
      { key: 'shbg', label: 'SHBG', unit: 'nmol/L', low: 14, high: 48 },
      { key: 'prolactin', label: 'Prolaktin', unit: 'ng/mL', low: 2, high: 18 },
    ],
  },
  {
    id: 'blood',
    label: 'Blutbild',
    labelEN: 'Blood Count',
    markers: [
      { key: 'hematocrit', label: 'Haematokrit', unit: '%', low: 38, high: 52 },
      { key: 'hemoglobin', label: 'Haemoglobin', unit: 'g/dL', low: 13.5, high: 17.5, step: '0.1' },
    ],
  },
  {
    id: 'lipids',
    label: 'Lipide',
    labelEN: 'Lipids',
    markers: [
      { key: 'hdl', label: 'HDL', unit: 'mg/dL', low: 40, high: 200 },
      { key: 'ldl', label: 'LDL', unit: 'mg/dL', low: 0, high: 130 },
      { key: 'triglycerides', label: 'Triglyceride', unit: 'mg/dL', low: 0, high: 150 },
      { key: 'total_cholesterol', label: 'Gesamtcholesterin', unit: 'mg/dL', low: 0, high: 200 },
    ],
  },
  {
    id: 'liver',
    label: 'Leber',
    labelEN: 'Liver',
    markers: [
      { key: 'ast', label: 'AST (GOT)', unit: 'U/L', low: 0, high: 50 },
      { key: 'alt', label: 'ALT (GPT)', unit: 'U/L', low: 0, high: 50 },
      { key: 'ggt', label: 'GGT', unit: 'U/L', low: 0, high: 60 },
    ],
  },
  {
    id: 'kidney',
    label: 'Niere',
    labelEN: 'Kidney',
    markers: [
      { key: 'creatinine', label: 'Kreatinin', unit: 'mg/dL', low: 0.7, high: 1.3, step: '0.01' },
      { key: 'egfr', label: 'eGFR', unit: 'mL/min', low: 60, high: 200 },
    ],
  },
  {
    id: 'other',
    label: 'Sonstige',
    labelEN: 'Other',
    markers: [
      { key: 'tsh', label: 'TSH', unit: 'mIU/L', low: 0.4, high: 4.0, step: '0.01' },
      { key: 'psa', label: 'PSA', unit: 'ng/mL', low: 0, high: 4, step: '0.01' },
      { key: 'hba1c', label: 'HbA1c', unit: '%', low: 4, high: 5.7, step: '0.1' },
      { key: 'vitamin_d', label: 'Vitamin D', unit: 'ng/mL', low: 30, high: 100 },
      { key: 'ferritin', label: 'Ferritin', unit: 'ng/mL', low: 30, high: 300 },
    ],
  },
];

function getStatus(value: number, low: number, high: number): 'normal' | 'warning' | 'danger' {
  if (value < low * 0.8 || value > high * 1.2) return 'danger';
  if (value < low || value > high) return 'warning';
  return 'normal';
}

const STATUS_BG = {
  normal: 'bg-green-50 border-green-200',
  warning: 'bg-amber-50 border-amber-200',
  danger: 'bg-red-50 border-red-200',
};

export function AddBloodWorkDialog({ open, onClose }: Props) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';
  const addBloodWork = useAddBloodWork();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(today());
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['hormones', 'blood']));
  const [analyzing, setAnalyzing] = useState(false);
  const [photoHint, setPhotoHint] = useState('');

  if (!open) return null;

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const filledCount = Object.values(values).filter(v => v !== '' && v != null).length;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setPhotoHint('');
    setError('');

    try {
      // Compress image to base64
      const base64 = await fileToBase64(file);
      const result = await analyzeLabReport(base64, file.type, language);

      // Auto-fill detected values
      const newValues: Record<string, string> = { ...values };
      let filled = 0;
      for (const [key, val] of Object.entries(result)) {
        if (key === 'notes' || key === 'date') continue;
        if (val != null && typeof val === 'number') {
          newValues[key] = String(val);
          filled++;
        }
      }
      if (result.date) setDate(result.date);
      setValues(newValues);

      setPhotoHint(
        isDE
          ? `${filled} Werte erkannt. Bitte pruefen und ggf. korrigieren.`
          : `${filled} values detected. Please review and correct if needed.`
      );

      // Expand all groups that have values
      const groupsWithValues = new Set<string>();
      for (const group of MARKER_GROUPS) {
        if (group.markers.some(m => newValues[m.key] !== undefined && newValues[m.key] !== '')) {
          groupsWithValues.add(group.id);
        }
      }
      setExpandedGroups(groupsWithValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo analysis failed');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (filledCount === 0) {
      setError(isDE ? 'Mindestens ein Wert muss eingetragen werden.' : 'At least one value must be entered.');
      return;
    }

    try {
      const input: Record<string, unknown> = { date, notes: notes || undefined };
      for (const group of MARKER_GROUPS) {
        for (const marker of group.markers) {
          const val = values[marker.key];
          if (val && val !== '') {
            const num = parseFloat(val);
            if (!isNaN(num) && num >= 0) {
              input[marker.key] = num;
            }
          }
        }
      }

      await addBloodWork.mutateAsync(input as Parameters<typeof addBloodWork.mutateAsync>[0]);

      // Reset form
      setValues({});
      setNotes('');
      setDate(today());
      setPhotoHint('');
      onClose();
    } catch {
      setError((t as unknown as Record<string, Record<string, string>>).common?.saveError ?? 'Save failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {(t as unknown as Record<string, Record<string, string>>).powerPlus?.addBloodWork ?? (isDE ? 'Blutbild eintragen' : 'Add blood work')}
          </h2>
          <div className="flex items-center gap-2">
            {/* Photo upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              title={isDE ? 'Laborbefund fotografieren' : 'Photograph lab report'}
            >
              {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Photo analysis hint */}
          {photoHint && (
            <div className="p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700 text-center">
              {photoHint}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {isDE ? 'Datum' : 'Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Marker groups */}
          {MARKER_GROUPS.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const groupFilledCount = group.markers.filter(m => values[m.key] && values[m.key] !== '').length;
            return (
              <div key={group.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    }
                    <span className="text-xs font-semibold text-gray-700">
                      {isDE ? group.label : group.labelEN}
                    </span>
                  </div>
                  {groupFilledCount > 0 && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                      {groupFilledCount}
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 py-2 space-y-2">
                    {group.markers.map((marker) => {
                      const val = values[marker.key] ?? '';
                      const numVal = parseFloat(val);
                      const hasValue = val !== '' && !isNaN(numVal);
                      const status = hasValue ? getStatus(numVal, marker.low, marker.high) : null;

                      return (
                        <div key={marker.key} className="flex items-center gap-2">
                          <label className="text-[11px] text-gray-600 w-28 flex-shrink-0 truncate" title={marker.label}>
                            {marker.label}
                          </label>
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              step={marker.step ?? '1'}
                              min="0"
                              value={val}
                              onChange={(e) => setValue(marker.key, e.target.value)}
                              placeholder="—"
                              className={`w-full px-2 py-1 text-xs border rounded text-right pr-12 focus:ring-1 focus:ring-indigo-400 focus:border-transparent ${
                                status ? STATUS_BG[status] : 'border-gray-200'
                              }`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">
                              {marker.unit}
                            </span>
                          </div>
                          {/* Reference range hint */}
                          <span className="text-[8px] text-gray-300 w-16 flex-shrink-0 text-right" title={`Ref: ${marker.low}-${marker.high}`}>
                            {marker.low}-{marker.high}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {(t as unknown as Record<string, Record<string, string>>).common?.notes ?? 'Notizen'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isDE ? 'z.B. Nuechtern-Blutentnahme' : 'e.g. fasting blood draw'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </form>

        {/* Fixed submit button */}
        <div className="px-4 py-3 border-t flex-shrink-0">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={addBloodWork.isPending || filledCount === 0}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all text-sm"
          >
            {addBloodWork.isPending
              ? ((t as unknown as Record<string, Record<string, string>>).common?.loading ?? 'Loading...')
              : `${isDE ? 'Speichern' : 'Save'} (${filledCount} ${isDE ? 'Werte' : 'values'})`
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/** Convert a File to base64 string (without data URI prefix) */
async function fileToBase64(file: File): Promise<string> {
  // Compress if needed
  const maxSize = 1200;
  const img = new Image();
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      // Strip the data:image/jpeg;base64, prefix
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}
