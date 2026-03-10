/**
 * TrainingPage — Standalone page for workout tracking.
 * Contains WorkoutsTabContent with its own sub-tabs (Today, Plan, History).
 * Power mode widgets shown above content when training mode is Power/Power+.
 * Progress photos timeline and comparison available when posing photos are enabled.
 */

import { useState, useRef } from 'react';
import { Plus, Camera, TrendingUp, ArrowLeftRight, Bot, Heart, Upload } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useTrainingMode } from '../shared/hooks/useTrainingMode';
import { useProfile, useUpdateProfile } from '../features/auth/hooks/useProfile';
// RestTimerWidget removed from main page — full multi-timer is inside ActiveWorkoutPage

import { WorkoutsTabContent } from '../features/workouts/components/WorkoutsTabContent';
import { WorkoutStartDialog } from '../features/workouts/components/WorkoutStartDialog';
import { CompetitionCountdown } from '../features/workouts/components/power/CompetitionCountdown';
import { PhaseProgressBar } from '../features/workouts/components/power/PhaseProgressBar';
import { NaturalLimitCalc } from '../features/workouts/components/power/NaturalLimitCalc';
import { RefeedPlanner } from '../features/workouts/components/power/RefeedPlanner';
import { CycleWidget } from '../features/workouts/components/powerplus/CycleWidget';
import { PCTCountdown } from '../features/workouts/components/powerplus/PCTCountdown';
import { HematocritAlert } from '../features/workouts/components/powerplus/HematocritAlert';
import { BloodWorkDashboard } from '../features/workouts/components/powerplus/BloodWorkDashboard';
import { PosingPhotos } from '../features/workouts/components/powerplus/PosingPhotos';
import { ProgressPhotosTimeline, useProgressPhotos } from '../features/body/components/ProgressPhotosTimeline';
import { ProgressComparison } from '../features/body/components/ProgressComparison';
import type { ProgressPhoto } from '../features/body/components/ProgressPhotosTimeline';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

type PhotoTab = 'poses' | 'progress' | 'compare';

export function TrainingPage() {
  const { t, language } = useTranslation();
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  // U2: Force switch to Plan tab when "Plan erstellen" is clicked
  const [forceTab, setForceTab] = useState<'plan' | null>(null);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const showCycleToggle = profile?.gender === 'female' || profile?.gender === 'other';
  const {
    showCompetitionFeatures,
    showPhaseProgress,
    showNaturalLimits,
    showRefeedPlanner,
    showCycleTracker,
    showPCTCountdown,
    showHematocritAlert,
    showBloodWorkDashboard,
    showPosingPhotos,
    showProgressPhotos,
  } = useTrainingMode();

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoTab, setPhotoTab] = useState<PhotoTab>(showPosingPhotos ? 'poses' : 'progress');
  const [compareInitial, setCompareInitial] = useState<{ before?: ProgressPhoto; after?: ProgressPhoto }>({});
  const { data: progressPhotos = [] } = useProgressPhotos();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const showPowerWidgets = showCompetitionFeatures || showPhaseProgress || showNaturalLimits || showRefeedPlanner;
  const showPowerPlusWidgets = showCycleTracker || showPCTCountdown || showHematocritAlert || showBloodWorkDashboard;

  const handleSelectForCompare = (photo: ProgressPhoto) => {
    setCompareInitial(prev => {
      if (!prev.before) return { before: photo };
      return { before: prev.before, after: photo };
    });
    setPhotoTab('compare');
  };

  /** Compress image to WebP Blob (canvas-based, max 800px) */
  const compressToWebP = (file: File, maxSize = 800, quality = 0.8): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
          'image/webp',
          quality,
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });

  /** Simple progress photo upload (for all modes) */
  const handleProgressPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input immediately so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const blob = await compressToWebP(file);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `${date}_front.webp`;
      const path = `${user.id}/${filename}`;
      const { error } = await supabase.storage
        .from('posing-photos')
        .upload(path, blob, { upsert: true, contentType: 'image/webp' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['posing-photos'] });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('[TrainingPage] Photo upload failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(language === 'de' ? `Upload fehlgeschlagen: ${msg}` : `Upload failed: ${msg}`);
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell
      title={t.tracking.training}
      actions={
        <button
          onClick={() => setShowStartDialog(true)}
          className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      {/* Power Mode Widgets */}
      {showPowerWidgets && (
        <div className="space-y-3 mb-4">
          {showCompetitionFeatures && <CompetitionCountdown />}
          {showPhaseProgress && <PhaseProgressBar />}
          {showNaturalLimits && <NaturalLimitCalc />}
          {showRefeedPlanner && <RefeedPlanner />}
        </div>
      )}

      {/* Power+ Mode Widgets */}
      {showPowerPlusWidgets && (
        <div className="space-y-3 mb-4">
          {showHematocritAlert && <HematocritAlert />}
          {showCycleTracker && <CycleWidget />}
          {showPCTCountdown && <PCTCountdown />}
          {showBloodWorkDashboard && <BloodWorkDashboard />}
        </div>
      )}

      {/* Progress Photos Section — Available for ALL training modes */}
      {(showProgressPhotos || showPosingPhotos) && (
        <div className="mb-4 space-y-3">
          {/* Photo Sub-Tabs + Upload Button */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 bg-gray-100 rounded-lg p-0.5">
              {showPosingPhotos && (
                <button
                  onClick={() => setPhotoTab('poses')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                    photoTab === 'poses'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  {t.powerPlus?.posingPhotos ?? 'Posing'}
                </button>
              )}
              <button
                onClick={() => setPhotoTab('progress')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                  photoTab === 'progress'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {t.progress?.timeline ?? (language === 'de' ? 'Fortschritt' : 'Progress')}
              </button>
              <button
                onClick={() => setPhotoTab('compare')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                  photoTab === 'compare'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                {t.progress?.compare ?? (language === 'de' ? 'Vergleich' : 'Compare')}
              </button>
            </div>
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Upload className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleProgressPhotoUpload}
              className="hidden"
            />
          </div>

          {/* Upload Feedback */}
          {uploadError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">
              {language === 'de' ? 'Foto erfolgreich hochgeladen!' : 'Photo uploaded successfully!'}
            </div>
          )}

          {/* Tab Content */}
          {photoTab === 'poses' && showPosingPhotos && <PosingPhotos />}
          {photoTab === 'progress' && (
            <ProgressPhotosTimeline onSelectForCompare={handleSelectForCompare} />
          )}
          {photoTab === 'compare' && (
            <ProgressComparison
              photos={progressPhotos}
              initialBefore={compareInitial.before}
              initialAfter={compareInitial.after}
              onClose={() => {
                setCompareInitial({});
                setPhotoTab('progress');
              }}
            />
          )}
        </div>
      )}

      {/* ── KI-Trainer & Zyklus-Training Toggles ─────────────────────── */}
      <div className="space-y-2 mb-4">
        {/* KI-Trainer Toggle — prominent on Training page */}
        <div className="bg-white rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {language === 'de' ? 'KI-Trainer' : 'AI Trainer'}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {language === 'de'
                    ? 'Automatische Reviews, Deload & Progression'
                    : 'Automatic reviews, deload & progression'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
              <input
                type="checkbox"
                checked={!!profile?.ai_trainer_enabled}
                onChange={async (e) => {
                  try {
                    await updateProfile.mutateAsync({ ai_trainer_enabled: e.target.checked });
                  } catch { /* handled by mutation */ }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
            </label>
          </div>
        </div>

        {/* Zyklus-Training Toggle — nur bei weiblich/divers */}
        {showCycleToggle && (
          <div className="bg-white rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="h-4 w-4 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">
                    {language === 'de' ? 'Zyklusabhängiges Training' : 'Cycle-Based Training'}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {language === 'de'
                      ? 'Intensität & Volumen an Zyklusphase anpassen'
                      : 'Adjust intensity & volume to cycle phase'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={!!profile?.cycle_tracking_enabled}
                  onChange={async (e) => {
                    try {
                      await updateProfile.mutateAsync({ cycle_tracking_enabled: e.target.checked });
                    } catch { /* handled by mutation */ }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
              </label>
            </div>
          </div>
        )}
      </div>

      <WorkoutsTabContent
        showAddDialog={showWorkoutDialog}
        onOpenAddDialog={() => setShowWorkoutDialog(true)}
        onCloseAddDialog={() => setShowWorkoutDialog(false)}
        forceTab={forceTab}
        onForceTabApplied={() => setForceTab(null)}
      />

      {/* Workout Start Dialog — Freies Training, Quick-Log, Plan erstellen (U2) */}
      <WorkoutStartDialog
        open={showStartDialog}
        onClose={() => setShowStartDialog(false)}
        onQuickLog={() => setShowWorkoutDialog(true)}
        onCreatePlan={() => setForceTab('plan')}
      />
    </PageShell>
  );
}
