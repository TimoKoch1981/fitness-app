/**
 * ReviewDialog — Mesozyklus-Review Bottom-Sheet Dialog
 *
 * Zeigt Analyse-Zusammenfassung und Empfehlung nach abgeschlossenem Mesozyklus.
 * 3 Aktions-Buttons: Annehmen / Anpassen (via Buddy) / Ablehnen
 *
 * Konzept: KONZEPT_KI_TRAINER.md Block D, Review-Dialog
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, TrendingDown, RefreshCw, AlertTriangle,
  CheckCircle, MessageCircle, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useApplyReviewChanges } from '../hooks/useApplyReviewChanges';
import { generateReviewSummary, type MesocycleReviewSummary, type ReviewRecommendation } from '../utils/mesocycleReview';
import { computeReviewChanges, type ReviewChanges } from '../utils/reviewChanges';
import type { TrainingPlan, Workout } from '../../../types/health';

interface ReviewDialogProps {
  plan: TrainingPlan;
  recentWorkouts: Workout[];
  onClose: () => void;
}

export function ReviewDialog({ plan, recentWorkouts, onClose }: ReviewDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const navigate = useNavigate();
  const applyChanges = useApplyReviewChanges();

  const [summary, setSummary] = useState<MesocycleReviewSummary | null>(null);
  const [changes, setChanges] = useState<ReviewChanges | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [applied, setApplied] = useState(false);

  // Generate review summary on mount
  useEffect(() => {
    if (!plan.review_config || !plan.days) return;

    const reviewSummary = generateReviewSummary(
      recentWorkouts,
      plan.days,
      plan.review_config,
    );
    setSummary(reviewSummary);

    const reviewChanges = computeReviewChanges(
      plan.days,
      reviewSummary.recommendation,
      reviewSummary.plateauExercises,
    );
    setChanges(reviewChanges);
  }, [plan, recentWorkouts]);

  if (!summary || !changes) return null;

  const handleAccept = async () => {
    if (!plan.review_config) return;
    await applyChanges.mutateAsync({
      planId: plan.id,
      changes,
      currentReviewConfig: plan.review_config,
    });
    setApplied(true);
    setTimeout(onClose, 1500);
  };

  const handleCustomize = () => {
    onClose();
    navigate('/buddy', {
      state: {
        autoMessage: isDE
          ? `Mein Mesozyklus-Review empfiehlt "${getRecommendationLabel(summary.recommendation, true)}". Ich möchte die Änderungen anpassen. Bitte hilf mir dabei.`
          : `My mesocycle review recommends "${getRecommendationLabel(summary.recommendation, false)}". I'd like to customize the changes. Please help me.`,
      },
    });
  };

  const handleDecline = () => {
    // Just reset the mesocycle without applying changes
    if (plan.review_config) {
      applyChanges.mutate({
        planId: plan.id,
        changes: { recommendation: 'continue', changes: [], summaryDE: '', summaryEN: '' },
        currentReviewConfig: plan.review_config,
      });
    }
    onClose();
  };

  const recIcon = getRecommendationIcon(summary.recommendation);
  const recColor = getRecommendationColor(summary.recommendation);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl mb-4 sm:mb-0 animate-in slide-in-from-bottom-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-semibold text-gray-900">
              {isDE ? 'Mesozyklus-Review' : 'Mesocycle Review'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Applied Success */}
        {applied && (
          <div className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-teal-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-teal-700">
              {isDE ? 'Änderungen angewendet!' : 'Changes applied!'}
            </p>
          </div>
        )}

        {!applied && (
          <>
            {/* Summary Stats */}
            <div className="p-4 space-y-3">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label={isDE ? 'Sessions' : 'Sessions'}
                  value={String(summary.sessionsCompleted)}
                  icon="🏋️"
                />
                <StatCard
                  label={isDE ? 'Abschlussrate' : 'Completion'}
                  value={`${Math.round(summary.avgCompletionRate * 100)}%`}
                  icon="✅"
                />
                <StatCard
                  label={isDE ? 'Gefühl' : 'Feeling'}
                  value={getFeelingLabel(summary.avgFeeling, isDE)}
                  icon={getFeelingIcon(summary.avgFeeling)}
                />
                <StatCard
                  label={isDE ? 'Plateaus' : 'Plateaus'}
                  value={String(summary.plateauExercises.length)}
                  icon={summary.plateauExercises.length > 0 ? '⚠️' : '✨'}
                />
              </div>

              {/* Pain warning */}
              {summary.sessionsWithPain > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-amber-700">
                    {isDE
                      ? `${summary.sessionsWithPain} Sessions mit Gelenkschmerzen`
                      : `${summary.sessionsWithPain} sessions with joint pain`}
                  </span>
                </div>
              )}

              {/* Recommendation */}
              <div className={`p-3 rounded-xl border-2 ${recColor}`}>
                <div className="flex items-center gap-2">
                  {recIcon}
                  <h4 className="text-sm font-semibold">
                    {isDE ? 'Empfehlung' : 'Recommendation'}: {getRecommendationLabel(summary.recommendation, isDE)}
                  </h4>
                </div>
                <p className="text-xs mt-1 opacity-80">
                  {isDE ? summary.summaryDE : summary.summaryEN}
                </p>
              </div>

              {/* Changes Detail Toggle */}
              {changes.changes.length > 0 && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span>
                    {isDE
                      ? `${changes.changes.length} Änderungen im Detail`
                      : `${changes.changes.length} changes in detail`}
                  </span>
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}

              {showDetails && changes.changes.length > 0 && (
                <div className="space-y-1.5 px-1">
                  {changes.changes.slice(0, 10).map((change, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">
                        {change.exerciseName}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">
                        {change.changeType === 'adjust_weight' && change.currentWeight && change.newWeight
                          ? `${change.currentWeight}→${change.newWeight} kg`
                          : change.changeType === 'replace' && change.replacementSuggestion
                            ? `→ ${change.replacementSuggestion}`
                            : isDE ? change.reasonDE : change.reasonEN}
                      </span>
                    </div>
                  ))}
                  {changes.changes.length > 10 && (
                    <p className="text-[10px] text-gray-400 text-center">
                      +{changes.changes.length - 10} {isDE ? 'weitere' : 'more'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              <button
                onClick={handleAccept}
                disabled={applyChanges.isPending}
                className="w-full py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
              >
                {applyChanges.isPending
                  ? '...'
                  : isDE ? 'Annehmen & anwenden' : 'Accept & apply'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCustomize}
                  className="flex-1 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-xl hover:bg-indigo-100 transition-colors inline-flex items-center justify-center gap-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {isDE ? 'Anpassen' : 'Customize'}
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {isDE ? 'Ablehnen' : 'Decline'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components & Helpers
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function getRecommendationLabel(rec: ReviewRecommendation, isDE: boolean): string {
  const labels: Record<ReviewRecommendation, [string, string]> = {
    continue: ['Weiter so', 'Continue'],
    deload: ['Deload-Woche', 'Deload Week'],
    swap: ['Übungen tauschen', 'Swap Exercises'],
    overhaul: ['Plan überarbeiten', 'Overhaul Plan'],
  };
  return isDE ? labels[rec][0] : labels[rec][1];
}

function getRecommendationIcon(rec: ReviewRecommendation) {
  switch (rec) {
    case 'continue': return <TrendingUp className="h-4 w-4 text-teal-500" />;
    case 'deload': return <TrendingDown className="h-4 w-4 text-blue-500" />;
    case 'swap': return <RefreshCw className="h-4 w-4 text-amber-500" />;
    case 'overhaul': return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
}

function getRecommendationColor(rec: ReviewRecommendation): string {
  switch (rec) {
    case 'continue': return 'border-teal-200 bg-teal-50 text-teal-800';
    case 'deload': return 'border-blue-200 bg-blue-50 text-blue-800';
    case 'swap': return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'overhaul': return 'border-red-200 bg-red-50 text-red-800';
  }
}

function getFeelingLabel(feeling: string, isDE: boolean): string {
  const labels: Record<string, [string, string]> = {
    easy: ['Leicht', 'Easy'],
    good: ['Gut', 'Good'],
    hard: ['Hart', 'Hard'],
    exhausted: ['Erschöpft', 'Exhausted'],
  };
  return isDE ? (labels[feeling]?.[0] ?? feeling) : (labels[feeling]?.[1] ?? feeling);
}

function getFeelingIcon(feeling: string): string {
  const icons: Record<string, string> = {
    easy: '😊', good: '💪', hard: '😤', exhausted: '😰',
  };
  return icons[feeling] ?? '🤔';
}
