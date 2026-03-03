/**
 * ProgressComparison — Before/After photo comparison.
 * Shows two photos side-by-side with optional AI analysis delta.
 * Includes an opacity slider for smooth crossfade overlay.
 */

import { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ChevronDown,
  Sparkles,
  Loader2,
  X,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { analyzeBodyPhoto, type BodyScanResult } from '../../../lib/ai/bodyVision';
import { compressImage } from '../../../lib/ai/vision';
import type { ProgressPhoto } from './ProgressPhotosTimeline';
import { POSE_LABELS, POSES, type Pose } from './ProgressPhotosTimeline';
import { OptimizedImage } from '../../../shared/components/OptimizedImage';

interface Props {
  photos: ProgressPhoto[];
  initialBefore?: ProgressPhoto;
  initialAfter?: ProgressPhoto;
  onClose: () => void;
}

export function ProgressComparison({ photos, initialBefore, initialAfter, onClose }: Props) {
  const { t, language } = useTranslation();
  const labels = POSE_LABELS[language] ?? POSE_LABELS.en;
  const tBody = (t as { bodyScan?: Record<string, string> }).bodyScan;

  // Sort photos by date (oldest first for "before", newest for "after")
  const sortedPhotos = useMemo(
    () => [...photos].sort((a, b) => a.date.localeCompare(b.date)),
    [photos],
  );

  const [beforePhoto, setBeforePhoto] = useState<ProgressPhoto | undefined>(
    initialBefore ?? sortedPhotos[0],
  );
  const [afterPhoto, setAfterPhoto] = useState<ProgressPhoto | undefined>(
    initialAfter ?? (sortedPhotos.length > 1 ? sortedPhotos[sortedPhotos.length - 1] : undefined),
  );
  const [opacity, setOpacity] = useState(0.5);
  const [showOverlay, setShowOverlay] = useState(false);

  // AI Analysis state
  const [beforeAnalysis, setBeforeAnalysis] = useState<BodyScanResult | null>(null);
  const [afterAnalysis, setAfterAnalysis] = useState<BodyScanResult | null>(null);
  const [analyzingBefore, setAnalyzingBefore] = useState(false);
  const [analyzingAfter, setAnalyzingAfter] = useState(false);

  // Filter by pose
  const [filterPose, setFilterPose] = useState<Pose | 'all'>('all');
  const filteredPhotos = filterPose === 'all'
    ? sortedPhotos
    : sortedPhotos.filter(p => p.pose === filterPose);

  const handleAnalyzeBoth = async () => {
    if (!beforePhoto || !afterPhoto) return;

    const analyzeOne = async (
      photo: ProgressPhoto,
      setResult: (r: BodyScanResult) => void,
      setLoading: (v: boolean) => void,
    ) => {
      setLoading(true);
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const file = new File([blob], photo.name, { type: blob.type || 'image/jpeg' });
        const { base64, mimeType } = await compressImage(file);
        const result = await analyzeBodyPhoto(base64, mimeType, language);
        setResult(result);
      } catch (error) {
        console.error('[ProgressComparison] Analysis failed:', error);
      } finally {
        setLoading(false);
      }
    };

    await Promise.all([
      analyzeOne(beforePhoto, setBeforeAnalysis, setAnalyzingBefore),
      analyzeOne(afterPhoto, setAfterAnalysis, setAnalyzingAfter),
    ]);
  };

  // Reset analysis when photos change
  const handleBeforeChange = (name: string) => {
    const photo = sortedPhotos.find(p => p.name === name);
    setBeforePhoto(photo);
    setBeforeAnalysis(null);
  };

  const handleAfterChange = (name: string) => {
    const photo = sortedPhotos.find(p => p.name === name);
    setAfterPhoto(photo);
    setAfterAnalysis(null);
  };

  const getDelta = (before: number | undefined, after: number | undefined) => {
    if (before === undefined || after === undefined) return null;
    return after - before;
  };

  const DeltaIndicator = ({ delta, invert = false }: { delta: number | null; invert?: boolean }) => {
    if (delta === null) return null;
    const isPositive = delta > 0;
    const isGood = invert ? !isPositive : isPositive;
    if (Math.abs(delta) < 0.5) return <Minus className="h-3 w-3 text-gray-400" />;
    return isGood
      ? <TrendingUp className="h-3 w-3 text-green-500" />
      : <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  if (photos.length < 2) {
    return (
      <div className="rounded-xl border bg-white border-gray-200 p-4">
        <div className="h-32 flex flex-col items-center justify-center gap-2">
          <ArrowLeftRight className="h-6 w-6 text-gray-300" />
          <p className="text-xs text-gray-400">
            {language === 'de'
              ? 'Mindestens 2 Fotos noetig fuer einen Vergleich'
              : 'At least 2 photos needed for comparison'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-semibold text-gray-900">
            {tBody?.compare ?? (language === 'de' ? 'Vorher/Nachher Vergleich' : 'Before/After Comparison')}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Pose Filter */}
      <div className="relative inline-block">
        <select
          value={filterPose}
          onChange={e => setFilterPose(e.target.value as Pose | 'all')}
          className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">{language === 'de' ? 'Alle Posen' : 'All Poses'}</option>
          {POSES.map(pose => (
            <option key={pose} value={pose}>{labels[pose]}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
      </div>

      {/* Photo Selectors */}
      <div className="grid grid-cols-2 gap-3">
        {/* Before */}
        <div>
          <label className="block text-[10px] font-medium text-gray-500 mb-1">
            {tBody?.before ?? (language === 'de' ? 'Vorher' : 'Before')}
          </label>
          <select
            value={beforePhoto?.name ?? ''}
            onChange={e => handleBeforeChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {filteredPhotos.map(p => (
              <option key={p.name} value={p.name}>
                {p.date} — {labels[p.pose]}
              </option>
            ))}
          </select>
        </div>
        {/* After */}
        <div>
          <label className="block text-[10px] font-medium text-gray-500 mb-1">
            {tBody?.after ?? (language === 'de' ? 'Nachher' : 'After')}
          </label>
          <select
            value={afterPhoto?.name ?? ''}
            onChange={e => handleAfterChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {filteredPhotos.map(p => (
              <option key={p.name} value={p.name}>
                {p.date} — {labels[p.pose]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Photos */}
      {beforePhoto && afterPhoto && (
        <>
          <div className="relative">
            {!showOverlay ? (
              // Side-by-Side
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg overflow-hidden bg-gray-100">
                  <OptimizedImage
                    src={beforePhoto.url}
                    alt={`${labels[beforePhoto.pose]} ${beforePhoto.date}`}
                    className="w-full h-48 object-cover"
                    priority
                  />
                  <div className="px-2 py-1 bg-gray-50 text-center">
                    <p className="text-[10px] text-gray-500">{beforePhoto.date}</p>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden bg-gray-100">
                  <OptimizedImage
                    src={afterPhoto.url}
                    alt={`${labels[afterPhoto.pose]} ${afterPhoto.date}`}
                    className="w-full h-48 object-cover"
                    priority
                  />
                  <div className="px-2 py-1 bg-gray-50 text-center">
                    <p className="text-[10px] text-gray-500">{afterPhoto.date}</p>
                  </div>
                </div>
              </div>
            ) : (
              // Overlay / Crossfade
              <div className="relative rounded-lg overflow-hidden bg-gray-100 h-64">
                <img
                  src={beforePhoto.url}
                  alt="Before"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <img
                  src={afterPhoto.url}
                  alt="After"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity }}
                />
                {/* Labels */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white">
                  {tBody?.before ?? 'Vorher'}: {beforePhoto.date}
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white">
                  {tBody?.after ?? 'Nachher'}: {afterPhoto.date}
                </div>
              </div>
            )}
          </div>

          {/* View Toggle + Slider */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                showOverlay
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeftRight className="h-3 w-3" />
              {language === 'de' ? 'Ueberblenden' : 'Crossfade'}
            </button>

            {showOverlay && (
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] text-gray-400">{tBody?.before ?? 'Vorher'}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={opacity}
                  onChange={e => setOpacity(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <span className="text-[10px] text-gray-400">{tBody?.after ?? 'Nachher'}</span>
              </div>
            )}
          </div>

          {/* Analyze Both Button */}
          {!(beforeAnalysis && afterAnalysis) && (
            <button
              onClick={handleAnalyzeBoth}
              disabled={analyzingBefore || analyzingAfter}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              {(analyzingBefore || analyzingAfter) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tBody?.analyzing ?? (language === 'de' ? 'Analysiere...' : 'Analyzing...')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {tBody?.analyze ?? (language === 'de' ? 'Beide analysieren' : 'Analyze Both')}
                </>
              )}
            </button>
          )}

          {/* Delta Display */}
          {beforeAnalysis && afterAnalysis && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <h4 className="text-xs font-semibold text-gray-700">
                  {tBody?.delta ?? (language === 'de' ? 'Veraenderung' : 'Changes')}
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {/* Body Fat Delta */}
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <DeltaIndicator delta={getDelta(beforeAnalysis.estimated_body_fat_pct, afterAnalysis.estimated_body_fat_pct)} invert />
                    <span className="text-sm font-bold text-gray-800">
                      {(() => {
                        const d = getDelta(beforeAnalysis.estimated_body_fat_pct, afterAnalysis.estimated_body_fat_pct);
                        if (d === null) return '-';
                        return `${d > 0 ? '+' : ''}${d}%`;
                      })()}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">{tBody?.bodyFat ?? 'KFA'}</p>
                </div>

                {/* Muscle Dev Delta */}
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <DeltaIndicator delta={getDelta(beforeAnalysis.muscle_development, afterAnalysis.muscle_development)} />
                    <span className="text-sm font-bold text-gray-800">
                      {(() => {
                        const d = getDelta(beforeAnalysis.muscle_development, afterAnalysis.muscle_development);
                        if (d === null) return '-';
                        return `${d > 0 ? '+' : ''}${d}`;
                      })()}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">{tBody?.muscleDev ?? 'Muskel'}</p>
                </div>

                {/* Symmetry Delta */}
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <DeltaIndicator delta={getDelta(beforeAnalysis.symmetry, afterAnalysis.symmetry)} />
                    <span className="text-sm font-bold text-gray-800">
                      {(() => {
                        const d = getDelta(beforeAnalysis.symmetry, afterAnalysis.symmetry);
                        if (d === null) return '-';
                        return `${d > 0 ? '+' : ''}${d}`;
                      })()}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">{tBody?.symmetry ?? 'Sym.'}</p>
                </div>
              </div>

              {/* Date range */}
              <p className="text-[10px] text-center text-gray-400 mt-1">
                {beforePhoto.date} → {afterPhoto.date}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
