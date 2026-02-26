/**
 * ExerciseVideoModal — Bottom-sheet with embedded YouTube player.
 * Shows exercise info + inline video. Session state is preserved.
 */

import { X, Dumbbell } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { CatalogExercise } from '../../../types/health';

interface ExerciseVideoModalProps {
  exercise: CatalogExercise;
  onClose: () => void;
}

/** Convert a YouTube URL to an embeddable URL */
function toEmbedUrl(url: string): string | null {
  try {
    // youtube.com/watch?v=ID or youtu.be/ID
    const u = new URL(url);
    let videoId = '';
    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1);
    } else {
      videoId = u.searchParams.get('v') ?? '';
    }
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  } catch {
    return null;
  }
}

export function ExerciseVideoModal({ exercise, onClose }: ExerciseVideoModalProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const name = isDE ? exercise.name : (exercise.name_en ?? exercise.name);
  const description = isDE
    ? exercise.description
    : (exercise.description_en ?? exercise.description);
  const videoUrl = isDE
    ? exercise.video_url_de
    : (exercise.video_url_en ?? exercise.video_url_de);

  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-teal-500" />
            <h3 className="font-semibold text-gray-900 text-base truncate">{name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Embedded Video */}
          {embedUrl ? (
            <div className="relative w-full pt-[56.25%] bg-black rounded-xl overflow-hidden">
              <iframe
                src={embedUrl}
                title={name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : videoUrl ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              {isDE ? 'Video extern öffnen' : 'Open Video Externally'}
            </a>
          ) : null}

          {/* Muscle Groups */}
          {exercise.muscle_groups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {exercise.muscle_groups.map(mg => (
                <span key={mg} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {mg}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
