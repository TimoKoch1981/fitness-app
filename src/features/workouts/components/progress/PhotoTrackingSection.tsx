/**
 * PhotoTrackingSection — Collapsible photo tracking section for the Progress Dashboard.
 *
 * Contains all progress photo functionality:
 * - Accordion header with photo count + upload button
 * - Sub-tabs: Fortschritt (timeline) | Vergleich (compare) | Posing (Power/Power+ only)
 * - Photo upload with WebP compression
 * - AI body scan analysis (via ProgressPhotosTimeline)
 *
 * Moved from TrainingPage top → ProgressDashboard "Koerper" section.
 */
import { useState, useRef } from 'react';
import { Camera, ChevronDown, ChevronUp, TrendingUp, ArrowLeftRight, Upload } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useTrainingMode } from '../../../../shared/hooks/useTrainingMode';
import { ProgressPhotosTimeline, useProgressPhotos } from '../../../body/components/ProgressPhotosTimeline';
import { ProgressComparison } from '../../../body/components/ProgressComparison';
import { PosingPhotos } from '../../components/powerplus/PosingPhotos';
import type { ProgressPhoto } from '../../../body/components/ProgressPhotosTimeline';
import { supabase } from '../../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

type PhotoTab = 'progress' | 'compare' | 'poses';

/** Compress image to WebP Blob (canvas-based, max 800px) */
function compressToWebP(file: File, maxSize = 800, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
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
}

export function PhotoTrackingSection() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const queryClient = useQueryClient();
  const { showPosingPhotos } = useTrainingMode();

  const [expanded, setExpanded] = useState(false);
  const [photoTab, setPhotoTab] = useState<PhotoTab>('progress');
  const [compareInitial, setCompareInitial] = useState<{ before?: ProgressPhoto; after?: ProgressPhoto }>({});
  const { data: progressPhotos = [] } = useProgressPhotos();

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleSelectForCompare = (photo: ProgressPhoto) => {
    setCompareInitial(prev => {
      if (!prev.before) return { before: photo };
      return { before: prev.before, after: photo };
    });
    setPhotoTab('compare');
    if (!expanded) setExpanded(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      if (!expanded) setExpanded(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('[PhotoTrackingSection] Photo upload failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(isDE ? `Upload fehlgeschlagen: ${msg}` : `Upload failed: ${msg}`);
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Camera className="h-4 w-4 text-violet-600" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {isDE ? 'Fototracking' : 'Photo Tracking'}
          </h4>
          <p className="text-xs text-gray-400">
            {progressPhotos.length > 0
              ? `${progressPhotos.length} ${isDE ? 'Fotos' : 'photos'}`
              : isDE ? 'Noch keine Fotos' : 'No photos yet'}
          </p>
        </div>
        {/* Upload shortcut (stop propagation so it doesn't toggle) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          disabled={uploading}
          className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <Upload className={`h-3.5 w-3.5 ${uploading ? 'animate-pulse' : ''}`} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleUpload}
          className="hidden"
        />
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Upload Feedback */}
          {uploadError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">
              {isDE ? 'Foto erfolgreich hochgeladen!' : 'Photo uploaded successfully!'}
            </div>
          )}

          {/* Sub-Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setPhotoTab('progress')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                photoTab === 'progress'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {isDE ? 'Fortschritt' : 'Progress'}
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
              {isDE ? 'Vergleich' : 'Compare'}
            </button>
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
                Posing
              </button>
            )}
          </div>

          {/* Tab Content */}
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
          {photoTab === 'poses' && showPosingPhotos && <PosingPhotos />}
        </div>
      )}
    </div>
  );
}
