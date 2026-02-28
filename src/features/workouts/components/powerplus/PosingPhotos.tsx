/**
 * PosingPhotos — Photo comparison widget for bodybuilding posing.
 * Allows users to upload progress photos and compare side-by-side.
 * Uses Supabase Storage for photo persistence.
 * Visible in Power/Power+ mode when showPosingPhotos is true.
 */

import { useState, useRef } from 'react';
import { Camera, ChevronLeft, ChevronRight, Trash2, Upload, Maximize2, X } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useProfile } from '../../../auth/hooks/useProfile';
import { supabase } from '../../../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

interface PosingPhoto {
  name: string;
  url: string;
  date: string;
  pose: Pose;
}

function usePosingPhotos() {
  return useQuery({
    queryKey: ['posing-photos'],
    queryFn: async (): Promise<PosingPhoto[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: files, error } = await supabase.storage
        .from('posing-photos')
        .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } });

      if (error || !files) return [];

      return files
        .filter(f => f.name.endsWith('.webp') || f.name.endsWith('.jpg') || f.name.endsWith('.png'))
        .map(f => {
          // File name format: YYYY-MM-DD_pose.ext
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

function useUploadPosingPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, pose }: { file: File; pose: Pose }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Compress to WebP
      const compressed = await compressImage(file);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `${date}_${pose}.webp`;
      const path = `${user.id}/${filename}`;

      const { error } = await supabase.storage
        .from('posing-photos')
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posing-photos'] });
    },
  });
}

function useDeletePosingPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (filename: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.storage
        .from('posing-photos')
        .remove([`${user.id}/${filename}`]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posing-photos'] });
    },
  });
}

async function compressImage(file: File, maxSize = 800, quality = 0.8): Promise<Blob> {
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

export function PosingPhotos() {
  const { t, language } = useTranslation();
  const { data: profile } = useProfile();
  const { data: photos = [], isLoading } = usePosingPhotos();
  const upload = useUploadPosingPhoto();
  const deletePhoto = useDeletePosingPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPose, setSelectedPose] = useState<Pose>('front');
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);

  const labels = POSE_LABELS[language] ?? POSE_LABELS.en;

  // Group photos by date
  const posePhotos = photos.filter(p => p.pose === selectedPose);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload.mutateAsync({ file, pose: selectedPose });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePoseNav = (dir: -1 | 1) => {
    const idx = POSES.indexOf(selectedPose);
    const next = (idx + dir + POSES.length) % POSES.length;
    setSelectedPose(POSES[next]);
  };

  if (!profile) return null;

  return (
    <>
      <div className="rounded-xl border bg-white border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-teal-500" />
            <h3 className="text-sm font-semibold text-gray-900">
              {t.powerPlus.posingPhotos ?? 'Posing Photos'}
            </h3>
          </div>
          <span className="text-[10px] text-gray-400">
            {photos.length} {language === 'de' ? 'Fotos' : 'photos'}
          </span>
        </div>

        {/* Pose Navigator */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => handlePoseNav(-1)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {labels[selectedPose]}
          </span>
          <button
            onClick={() => handlePoseNav(1)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Photo Grid */}
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
            {t.common.loading}
          </div>
        ) : posePhotos.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Camera className="h-6 w-6 text-gray-300" />
            <p className="text-xs text-gray-400">
              {t.powerPlus.noPhotos ?? 'No photos for this pose'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {posePhotos.map(photo => (
              <div key={photo.name} className="relative group rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={`${labels[photo.pose]} ${photo.date}`}
                  className="w-full h-32 object-cover cursor-pointer"
                  onClick={() => setFullscreenUrl(photo.url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                  <span className="text-[10px] text-white">{photo.date}</span>
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setFullscreenUrl(photo.url)}
                    className="p-1 bg-black/50 rounded text-white hover:bg-black/70"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deletePhoto.mutate(photo.name)}
                    className="p-1 bg-red-500/80 rounded text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={upload.isPending}
          className="flex items-center justify-center gap-2 w-full mt-3 py-2 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {upload.isPending
            ? (t.common.loading)
            : (t.powerPlus.uploadPhoto ?? 'Upload Photo')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Fullscreen Modal */}
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setFullscreenUrl(null)}
        >
          <button
            onClick={() => setFullscreenUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={fullscreenUrl}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
