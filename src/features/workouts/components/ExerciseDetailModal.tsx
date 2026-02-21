/**
 * ExerciseDetailModal — Bottom-sheet overlay showing exercise details + video link.
 *
 * Displays: exercise name, muscle group badges, description, YouTube video button.
 * Language-aware: shows DE or EN content based on user preference.
 */

import { X, ExternalLink, Dumbbell } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { CatalogExercise } from '../../../types/health';

interface ExerciseDetailModalProps {
  exercise: CatalogExercise;
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const DIFFICULTY_LABELS: Record<string, Record<string, string>> = {
  de: { beginner: 'Anfänger', intermediate: 'Mittel', advanced: 'Fortgeschritten' },
  en: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
};

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const name = isDE ? exercise.name : (exercise.name_en ?? exercise.name);
  const description = isDE
    ? exercise.description
    : (exercise.description_en ?? exercise.description);
  const videoUrl = isDE
    ? exercise.video_url_de
    : (exercise.video_url_en ?? exercise.video_url_de);

  const diffLabel = DIFFICULTY_LABELS[isDE ? 'de' : 'en'][exercise.difficulty] ?? exercise.difficulty;
  const diffColor = DIFFICULTY_COLORS[exercise.difficulty] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-teal-500" />
            <h3 className="font-semibold text-gray-900 text-base">{name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Difficulty + Category Badge */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor}`}>
              {diffLabel}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
              {exercise.is_compound
                ? (isDE ? 'Compound' : 'Compound')
                : (isDE ? 'Isolation' : 'Isolation')}
            </span>
          </div>

          {/* Muscle Groups */}
          {exercise.muscle_groups.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">
                {isDE ? 'Muskelgruppen' : 'Muscle Groups'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.muscle_groups.map((mg) => (
                  <span
                    key={mg}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  >
                    {mg}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {isDE ? 'Beschreibung' : 'Description'}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Equipment */}
          {exercise.equipment_needed.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {isDE ? 'Benötigtes Equipment' : 'Equipment Needed'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.equipment_needed.map((eq) => (
                  <span
                    key={eq}
                    className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Video Link */}
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {isDE ? 'Video-Anleitung ansehen' : 'Watch Video Guide'}
            </a>
          )}
        </div>

        {/* Bottom safe area for mobile */}
        <div className="h-4" />
      </div>
    </div>
  );
}
