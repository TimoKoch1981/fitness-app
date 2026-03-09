/**
 * AddBloodWorkDialog — Manual entry + photo/PDF upload for blood work values.
 *
 * Groups 38 biomarkers into 8 collapsible categories.
 * Reference ranges are gender- and age-dependent (from user profile).
 * Supports: Camera photos, image files, PDF lab reports.
 */

import { useState, useRef } from 'react';
import { X, Camera, ChevronDown, ChevronRight, Loader2, FileText } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddBloodWork } from '../hooks/useBloodWork';
import { analyzeLabReport, analyzeLabReportPDF } from '../utils/bloodWorkVision';
import { today } from '../../../lib/utils';
import {
  REFERENCE_RANGES,
  GROUP_ORDER,
  GROUP_LABELS,
  getReferenceRange,
  getMarkerStatus,
  getMarkersByGroup,
  type Gender,
  type MarkerGroup,
} from '../utils/bloodWorkReferenceRanges';
import { useProfile } from '../../auth/hooks/useProfile';

interface Props {
  open: boolean;
  onClose: () => void;
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
  const { data: profile } = useProfile();

  // Derive gender and age from profile
  const gender: Gender = (profile?.gender as Gender) ?? 'male';
  const age = profile?.birth_date ? new Date().getFullYear() - parseInt(profile.birth_date.slice(0, 4), 10) : undefined;

  const [date, setDate] = useState(today());
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<MarkerGroup>>(new Set(['hormones', 'blood_count']));
  const [analyzing, setAnalyzing] = useState(false);
  const [photoHint, setPhotoHint] = useState('');

  if (!open) return null;

  const toggleGroup = (id: MarkerGroup) => {
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

  const markersByGroup = getMarkersByGroup();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setPhotoHint('');
    setError('');

    try {
      let result: Partial<Record<string, unknown>>;

      if (file.type === 'application/pdf') {
        // PDF path: text extraction + AI parsing
        result = await analyzeLabReportPDF(file, language);
      } else {
        // Image path: compress + Vision API
        const base64 = await fileToBase64(file);
        result = await analyzeLabReport(base64, file.type, language);
      }

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
      if (result.date && typeof result.date === 'string') setDate(result.date as string);
      setValues(newValues);

      setPhotoHint(
        isDE
          ? `${filled} Werte erkannt. Bitte pruefen und ggf. korrigieren.`
          : `${filled} values detected. Please review and correct if needed.`
      );

      // Expand all groups that have values
      const groupsWithValues = new Set<MarkerGroup>();
      for (const [group, keys] of markersByGroup.entries()) {
        if (keys.some(k => newValues[k] !== undefined && newValues[k] !== '')) {
          groupsWithValues.add(group);
        }
      }
      setExpandedGroups(groupsWithValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
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
      for (const key of Object.keys(REFERENCE_RANGES)) {
        const val = values[key];
        if (val && val !== '') {
          const num = parseFloat(val);
          if (!isNaN(num) && num >= 0) {
            input[key] = num;
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
            {/* File upload button (photo + PDF) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="flex items-center gap-1 px-2 py-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 text-xs font-medium"
              title={isDE ? 'Laborbefund hochladen (Foto/PDF)' : 'Upload lab report (photo/PDF)'}
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  <FileText className="h-4 w-4 -ml-1" />
                </>
              )}
              <span className="hidden sm:inline">{analyzing ? (isDE ? 'Analysiere...' : 'Analyzing...') : 'PDF'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.pdf"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Photo/PDF analysis hint */}
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
          {GROUP_ORDER.map((groupId) => {
            const markerKeys = markersByGroup.get(groupId) ?? [];
            // Filter out markers not applicable for this gender
            const visibleKeys = markerKeys.filter(k => {
              const ref = REFERENCE_RANGES[k];
              if (!ref) return false;
              if (gender !== 'male' && gender !== 'other' && ref.female === null) return false;
              return true;
            });
            if (visibleKeys.length === 0) return null;

            const isExpanded = expandedGroups.has(groupId);
            const groupFilledCount = visibleKeys.filter(k => values[k] && values[k] !== '').length;
            const groupLabel = GROUP_LABELS[groupId];

            return (
              <div key={groupId} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(groupId)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    }
                    <span className="text-xs font-semibold text-gray-700">
                      {isDE ? groupLabel.de : groupLabel.en}
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
                    {visibleKeys.map((markerKey) => {
                      const ref = REFERENCE_RANGES[markerKey];
                      if (!ref) return null;

                      const val = values[markerKey] ?? '';
                      const numVal = parseFloat(val);
                      const hasValue = val !== '' && !isNaN(numVal);
                      const status = hasValue ? getMarkerStatus(numVal, markerKey, gender, age) : null;
                      const range = getReferenceRange(markerKey, gender, age);

                      return (
                        <div key={markerKey} className="flex items-center gap-2">
                          <label className="text-[11px] text-gray-600 w-28 flex-shrink-0 truncate" title={isDE ? ref.labelDE : ref.labelEN}>
                            {isDE ? ref.labelDE : ref.labelEN}
                          </label>
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              step={ref.step ?? '1'}
                              min="0"
                              value={val}
                              onChange={(e) => setValue(markerKey, e.target.value)}
                              placeholder="—"
                              className={`w-full px-2 py-1 text-xs border rounded text-right pr-12 focus:ring-1 focus:ring-indigo-400 focus:border-transparent ${
                                status ? STATUS_BG[status] : 'border-gray-200'
                              }`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">
                              {ref.unit}
                            </span>
                          </div>
                          {/* Reference range hint */}
                          {range && (
                            <span className="text-[8px] text-gray-300 w-16 flex-shrink-0 text-right" title={`Ref: ${range.low}-${range.high}`}>
                              {range.low}-{range.high}
                            </span>
                          )}
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
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}
