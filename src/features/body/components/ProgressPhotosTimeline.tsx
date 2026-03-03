/**
 * ProgressPhotosTimeline — Chronological timeline of posing/progress photos.
 * Shows all photos from Supabase Storage with optional AI body scan analysis.
 * Supports thumbnail grid and detail/fullscreen views.
 * Works in all training modes (not restricted to Power+).
 */

import { useState } from 'react';
import {
  Camera,
  Maximize2,
  X,
  Sparkles,
  Loader2,
  Grid,
  List,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { analyzeBodyPhoto, type BodyScanResult } from '../../../lib/ai/bodyVision';
import { compressImage } from '../../../lib/ai/vision';

const POSES = ['front', 'back', 'side_left', 'side_right', 'front_lat', 'back_lat', 'most_muscular'] as const;
type Pose = (typeof POSES)[number];

const POSE_LABELS: Record<string, Record<Pose, string>> = {
  de: {
    front: 'Front',
    back: 'Ruecken',
    side_left: 'Seite Links',
    side_right: 'Seite Rechts',
    front_lat: 'Front Lat',
    back_lat: 'Ruecken Lat',
    most_muscular: 'Most Muscular',
  },
  en: {
    front: 'Front',
    back: 'Back',
    side_left: 'Left Side',
    side_right: 'Right Side',
    front_lat: 'Front Lat',
    back_lat: 'Back Lat',
    most_muscular: 'Most Muscular',
  },
};

export interface ProgressPhoto {
  name: string;
  url: string;
  date: string;
  pose: Pose;
}

export function useProgressPhotos() {
  return useQuery({
    queryKey: ['posing-photos'],
    queryFn: async (): Promise<ProgressPhoto[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: files, error } = await supabase.storage
        .from('posing-photos')
        .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } });

      if (error || !files) return [];

      return files
        .filter(f => f.name.endsWith('.webp') || f.name.endsWith('.jpg') || f.name.endsWith('.png'))
        .map(f => {
          const parts = f.name.replace(/\.[^.]+$/, '').split('_');
          const date = parts.slice(0, 3).join('-');
          const pose = parts.slice(3).join('_') as Pose;
          const { data: urlData } = supabase.storage
            .from('posing-photos')
            .getPublicUrl(`${user.id}/${f.name}`);
          return {
            name: f.name,
            url: urlData.publicUrl,
            date,
            pose: POSES.includes(pose) ? pose : 'front',
          };
        });
    },
  });
}

interface Props {
  onSelectForCompare?: (photo: ProgressPhoto) => void;
}

export function ProgressPhotosTimeline({ onSelectForCompare }: Props) {
  const { t, language } = useTranslation();
  const { data: photos = [], isLoading } = useProgressPhotos();
  const labels = POSE_LABELS[language] ?? POSE_LABELS.en;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [fullscreenPhoto, setFullscreenPhoto] = useState<ProgressPhoto | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, BodyScanResult>>({});
  const [analyzingPhoto, setAnalyzingPhoto] = useState<string | null>(null);
  const [filterPose, setFilterPose] = useState<Pose | 'all'>('all');

  const filteredPhotos = filterPose === 'all'
    ? photos
    : photos.filter(p => p.pose === filterPose);

  // Group photos by date for list view
  const photosByDate = filteredPhotos.reduce<Record<string, ProgressPhoto[]>>((acc, photo) => {
    if (!acc[photo.date]) acc[photo.date] = [];
    acc[photo.date].push(photo);
    return acc;
  }, {});

  const handleAnalyze = async (photo: ProgressPhoto) => {
    if (analyzingPhoto) return;
    setAnalyzingPhoto(photo.name);

    try {
      // Fetch the image and convert to base64
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const file = new File([blob], photo.name, { type: blob.type || 'image/jpeg' });
      const { base64, mimeType } = await compressImage(file);

      const result = await analyzeBodyPhoto(base64, mimeType, language);
      setAnalysisResults(prev => ({ ...prev, [photo.name]: result }));
    } catch (error) {
      console.error('[ProgressTimeline] Analysis failed:', error);
    } finally {
      setAnalyzingPhoto(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        {t.common.loading}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Camera className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-400">
          {t.bodyScan?.noPhotos ?? (language === 'de' ? 'Noch keine Fortschrittsfotos' : 'No progress photos yet')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Pose Filter */}
            <div className="relative">
              <select
                value={filterPose}
                onChange={e => setFilterPose(e.target.value as Pose | 'all')}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{language === 'de' ? 'Alle Posen' : 'All Poses'}</option>
                {POSES.map(pose => (
                  <option key={pose} value={pose}>{labels[pose]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 mr-1">
              {filteredPhotos.length} {language === 'de' ? 'Fotos' : 'photos'}
            </span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-3 gap-2">
            {filteredPhotos.map(photo => (
              <div key={photo.name} className="relative group rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photo.url}
                  alt={`${labels[photo.pose]} ${photo.date}`}
                  className="w-full h-28 object-cover cursor-pointer"
                  onClick={() => setFullscreenPhoto(photo)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                  <p className="text-[9px] text-white truncate">{photo.date}</p>
                  <p className="text-[8px] text-white/70 truncate">{labels[photo.pose]}</p>
                </div>
                {/* AI Badge */}
                {analysisResults[photo.name] && (
                  <div className="absolute top-1 left-1">
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/80 rounded text-[8px] text-white font-medium">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI
                    </span>
                  </div>
                )}
                {/* Hover Actions */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setFullscreenPhoto(photo)}
                    className="p-1 bg-black/50 rounded text-white hover:bg-black/70"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View — Grouped by Date */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {Object.entries(photosByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, datePhotos]) => (
                <div key={date}>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">{date}</h4>
                  <div className="space-y-2">
                    {datePhotos.map(photo => {
                      const analysis = analysisResults[photo.name];
                      const isAnalyzing = analyzingPhoto === photo.name;
                      return (
                        <div key={photo.name} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="flex">
                            {/* Thumbnail */}
                            <img
                              src={photo.url}
                              alt={`${labels[photo.pose]} ${photo.date}`}
                              className="w-20 h-20 object-cover cursor-pointer flex-shrink-0"
                              onClick={() => setFullscreenPhoto(photo)}
                            />
                            {/* Info */}
                            <div className="flex-1 p-2 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700">{labels[photo.pose]}</span>
                                {analysis && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 rounded text-[9px] text-purple-700 font-medium">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    AI
                                  </span>
                                )}
                              </div>

                              {analysis ? (
                                <div className="mt-1 space-y-0.5">
                                  <p className="text-[10px] text-gray-500">
                                    {t.bodyScan?.bodyFat ?? 'KFA'}: <span className="font-medium text-gray-700">{analysis.estimated_body_fat_pct}%</span>
                                    {' | '}
                                    {t.bodyScan?.muscleDev ?? 'Muskel'}: <span className="font-medium text-gray-700">{analysis.muscle_development}/10</span>
                                    {' | '}
                                    {t.bodyScan?.symmetry ?? 'Sym.'}: <span className="font-medium text-gray-700">{analysis.symmetry}/10</span>
                                  </p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAnalyze(photo)}
                                  disabled={isAnalyzing}
                                  className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-purple-600 bg-purple-50 rounded hover:bg-purple-100 transition-colors disabled:opacity-50"
                                >
                                  {isAnalyzing ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      {t.bodyScan?.analyzing ?? (language === 'de' ? 'Analysiere...' : 'Analyzing...')}
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3 w-3" />
                                      {t.bodyScan?.analyze ?? (language === 'de' ? 'AI Analyse' : 'AI Analysis')}
                                    </>
                                  )}
                                </button>
                              )}

                              {onSelectForCompare && (
                                <button
                                  onClick={() => onSelectForCompare(photo)}
                                  className="mt-1 text-[10px] text-teal-600 hover:text-teal-700 font-medium"
                                >
                                  {t.bodyScan?.compare ?? (language === 'de' ? 'Vergleichen' : 'Compare')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal with AI Analysis */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setFullscreenPhoto(null)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50">
            <div>
              <p className="text-sm text-white font-medium">{labels[fullscreenPhoto.pose]}</p>
              <p className="text-xs text-white/60">{fullscreenPhoto.date}</p>
            </div>
            <div className="flex items-center gap-2">
              {!analysisResults[fullscreenPhoto.name] && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnalyze(fullscreenPhoto);
                  }}
                  disabled={!!analyzingPhoto}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {analyzingPhoto === fullscreenPhoto.name ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t.bodyScan?.analyzing ?? (language === 'de' ? 'Analysiere...' : 'Analyzing...')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      {t.bodyScan?.analyze ?? (language === 'de' ? 'AI Analyse' : 'AI Analysis')}
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setFullscreenPhoto(null)}
                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={fullscreenPhoto.url}
              alt={`${labels[fullscreenPhoto.pose]} ${fullscreenPhoto.date}`}
              className="max-w-full max-h-full object-contain"
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* AI Analysis Results Panel */}
          {analysisResults[fullscreenPhoto.name] && (
            <div
              className="bg-white/10 backdrop-blur-sm mx-4 mb-4 rounded-xl p-4"
              onClick={e => e.stopPropagation()}
            >
              <BodyScanResultPanel
                result={analysisResults[fullscreenPhoto.name]}
                language={language}
                t={t}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

interface BodyScanResultPanelProps {
  result: BodyScanResult;
  language: string;
  t: Record<string, unknown>;
}

function BodyScanResultPanel({ result, language, t }: BodyScanResultPanelProps) {
  const tBody = (t as { bodyScan?: Record<string, string> }).bodyScan;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <h4 className="text-sm font-semibold text-white">
          {tBody?.result ?? (language === 'de' ? 'AI Body Scan Ergebnis' : 'AI Body Scan Result')}
        </h4>
        <span className="text-[10px] text-white/50">
          {language === 'de' ? 'Konfidenz' : 'Confidence'}: {Math.round(result.confidence * 100)}%
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{result.estimated_body_fat_pct}%</p>
          <p className="text-[10px] text-white/60">{tBody?.bodyFat ?? 'KFA'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{result.muscle_development}<span className="text-sm text-white/50">/10</span></p>
          <p className="text-[10px] text-white/60">{tBody?.muscleDev ?? (language === 'de' ? 'Muskelentwicklung' : 'Muscle Dev.')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{result.symmetry}<span className="text-sm text-white/50">/10</span></p>
          <p className="text-[10px] text-white/60">{tBody?.symmetry ?? (language === 'de' ? 'Symmetrie' : 'Symmetry')}</p>
        </div>
      </div>

      {/* Visible Muscles */}
      {result.visible_muscle_groups.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.visible_muscle_groups.map(group => (
            <span key={group} className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white/80">
              {group}
            </span>
          ))}
        </div>
      )}

      {/* Assessment */}
      <p className="text-xs text-white/70 leading-relaxed">
        {language === 'de' ? result.assessment_de : result.assessment_en}
      </p>
    </div>
  );
}

export { type BodyScanResult, POSES, type Pose, POSE_LABELS };
