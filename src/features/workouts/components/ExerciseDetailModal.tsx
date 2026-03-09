/**
 * ExerciseDetailModal — Bottom-sheet overlay showing exercise details.
 *
 * v2 Features:
 * - Primary/secondary muscle badges (color-coded)
 * - Body region + movement pattern info
 * - Contraindications warning
 * - Video gender toggle (de_male/de_female/en_male/en_female)
 * - Unilateral flag
 * - Equipment, difficulty, compound/isolation
 */

import { useState } from 'react';
import { X, ExternalLink, Dumbbell, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { getMuscleName, getBodyRegionName, getMovementPatternName } from '../utils/muscleNames';
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
  const lang = isDE ? 'de' : 'en';

  // Video gender toggle
  const [videoGender, setVideoGender] = useState<'male' | 'female'>('male');

  const name = isDE ? exercise.name : (exercise.name_en ?? exercise.name);
  const description = isDE
    ? exercise.description
    : (exercise.description_en ?? exercise.description);

  // Video URL: prefer JSONB videos field, fallback to legacy
  const videoKey = `${lang}_${videoGender}` as keyof typeof exercise.videos;
  const videoUrl =
    exercise.videos?.[videoKey] ??
    (isDE ? exercise.video_url_de : (exercise.video_url_en ?? exercise.video_url_de));
  const hasGenderVariant =
    exercise.videos?.de_female || exercise.videos?.en_female;

  // Contraindications
  const contraText = isDE ? exercise.contraindications_de : exercise.contraindications_en;
  const hasContraindications = (exercise.contraindications?.length > 0) || contraText;

  const diffLabel = DIFFICULTY_LABELS[lang][exercise.difficulty] ?? exercise.difficulty;
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
          {/* Badge Row: Difficulty, Compound/Iso, Body Region, Pattern */}
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor}`}>
              {diffLabel}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
              {exercise.is_compound
                ? 'Compound'
                : 'Isolation'}
            </span>
            {exercise.body_region && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                {getBodyRegionName(exercise.body_region, lang)}
              </span>
            )}
            {exercise.movement_pattern && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                {getMovementPatternName(exercise.movement_pattern, lang)}
              </span>
            )}
            {exercise.is_unilateral && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center gap-0.5">
                <ArrowLeftRight className="h-3 w-3" />
                {isDE ? 'Unilateral' : 'Unilateral'}
              </span>
            )}
          </div>

          {/* Primary + Secondary Muscles */}
          {(exercise.primary_muscles?.length > 0 || exercise.muscle_groups?.length > 0) && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">
                {isDE ? 'Muskelgruppen' : 'Muscle Groups'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.primary_muscles?.length > 0 ? (
                  <>
                    {exercise.primary_muscles.map((m) => (
                      <span
                        key={`p-${m}`}
                        className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium"
                      >
                        {getMuscleName(m, lang)}
                      </span>
                    ))}
                    {exercise.secondary_muscles?.map((m) => (
                      <span
                        key={`s-${m}`}
                        className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                      >
                        {getMuscleName(m, lang)}
                      </span>
                    ))}
                  </>
                ) : (
                  // Fallback to old muscle_groups
                  exercise.muscle_groups.map((mg) => (
                    <span
                      key={mg}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {mg}
                    </span>
                  ))
                )}
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

          {/* Contraindications Warning */}
          {hasContraindications && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-0.5">
                    {isDE ? 'Hinweise & Kontraindikationen' : 'Warnings & Contraindications'}
                  </p>
                  {contraText && (
                    <p className="text-xs text-amber-600">{contraText}</p>
                  )}
                  {exercise.contraindications?.length > 0 && !contraText && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exercise.contraindications.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Equipment */}
          {exercise.equipment_needed?.length > 0 && (
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

          {/* Video Link with Gender Toggle */}
          {videoUrl && (
            <div className="space-y-2">
              {/* Gender toggle (only show if female variant exists) */}
              {hasGenderVariant && (
                <div className="flex items-center gap-2 justify-center">
                  <button
                    onClick={() => setVideoGender('male')}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      videoGender === 'male'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isDE ? 'Männlich' : 'Male'}
                  </button>
                  <button
                    onClick={() => setVideoGender('female')}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      videoGender === 'female'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isDE ? 'Weiblich' : 'Female'}
                  </button>
                </div>
              )}
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {isDE ? 'Video-Anleitung ansehen' : 'Watch Video Guide'}
              </a>
            </div>
          )}
        </div>

        {/* Bottom safe area for mobile */}
        <div className="h-4" />
      </div>
    </div>
  );
}
