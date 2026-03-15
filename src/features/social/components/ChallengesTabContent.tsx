/**
 * ChallengesTabContent — Active challenges, leaderboard, create new challenge.
 */

import { useState } from 'react';
import {
  Trophy, Plus, X, Target, Flame, Clock, Medal,
  ChevronDown, ChevronUp, Loader2, Calendar,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import {
  useMyChallenges,
  useChallengeLeaderboard,
  useCreateChallenge,
  useUpdateChallengeProgress,
  useDeleteChallenge,
} from '../hooks/useChallenges';
import { useMyGroups } from '../hooks/useGroups';
import type { Challenge, ChallengeParticipant, ChallengeType } from '../types';

// ── Challenge Type Config ───────────────────────────────────────────

const CHALLENGE_TYPE_CONFIG: Record<ChallengeType, {
  icon: typeof Trophy;
  colorClass: string;
  labelDE: string;
  labelEN: string;
}> = {
  workout_count: { icon: Target, colorClass: 'bg-blue-100 text-blue-600', labelDE: 'Workouts', labelEN: 'Workouts' },
  total_volume: { icon: Flame, colorClass: 'bg-orange-100 text-orange-600', labelDE: 'Volumen', labelEN: 'Volume' },
  calories_logged: { icon: Flame, colorClass: 'bg-red-100 text-red-600', labelDE: 'Kalorien', labelEN: 'Calories' },
  streak_days: { icon: Calendar, colorClass: 'bg-green-100 text-green-600', labelDE: 'Streak', labelEN: 'Streak' },
  body_measurements: { icon: Target, colorClass: 'bg-purple-100 text-purple-600', labelDE: 'Körpermaße', labelEN: 'Body' },
  custom: { icon: Trophy, colorClass: 'bg-teal-100 text-teal-600', labelDE: 'Benutzerdefiniert', labelEN: 'Custom' },
};

// ── Create Challenge Form ───────────────────────────────────────────

function CreateChallengeForm({ onClose }: { onClose: () => void }) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const createChallenge = useCreateChallenge();
  const { data: groups } = useMyGroups();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState<ChallengeType>('workout_count');
  const [targetValue, setTargetValue] = useState('10');
  const [targetUnit, setTargetUnit] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [groupId, setGroupId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue) return;
    createChallenge.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        challenge_type: challengeType,
        target_value: Number(targetValue),
        target_unit: targetUnit || undefined,
        start_date: startDate,
        end_date: endDate,
        group_id: groupId || undefined,
        visibility: groupId ? 'group' : 'friends',
      },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-teal-100 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">
        {isDE ? 'Neue Challenge erstellen' : 'Create New Challenge'}
      </h3>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isDE ? 'Challenge-Name' : 'Challenge name'}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        required
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={isDE ? 'Beschreibung (optional)' : 'Description (optional)'}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        rows={2}
      />

      {/* Challenge type */}
      <div>
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          {isDE ? 'Typ' : 'Type'}
        </label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {(Object.entries(CHALLENGE_TYPE_CONFIG) as [ChallengeType, typeof CHALLENGE_TYPE_CONFIG[ChallengeType]][]).map(([type, cfg]) => (
            <button
              key={type}
              type="button"
              onClick={() => setChallengeType(type)}
              className={cn(
                'flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                challengeType === type
                  ? cn(cfg.colorClass, 'ring-1 ring-current')
                  : 'bg-gray-50 text-gray-500',
              )}
            >
              <cfg.icon className="h-3 w-3" />
              {isDE ? cfg.labelDE : cfg.labelEN}
            </button>
          ))}
        </div>
      </div>

      {/* Target */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {isDE ? 'Ziel' : 'Target'}
          </label>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            min="1"
            step="any"
            required
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {isDE ? 'Einheit' : 'Unit'}
          </label>
          <input
            type="text"
            value={targetUnit}
            onChange={(e) => setTargetUnit(e.target.value)}
            placeholder={isDE ? 'z.B. Workouts' : 'e.g. Workouts'}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {isDE ? 'Start' : 'Start'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {isDE ? 'Ende' : 'End'}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
      </div>

      {/* Group (optional) */}
      {groups && groups.length > 0 && (
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {isDE ? 'Gruppe (optional)' : 'Group (optional)'}
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">{isDE ? 'Keine Gruppe' : 'No group'}</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200">
          {isDE ? 'Abbrechen' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={!title.trim() || createChallenge.isPending}
          className="flex-1 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50"
        >
          {createChallenge.isPending
            ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            : (isDE ? 'Erstellen' : 'Create')
          }
        </button>
      </div>
    </form>
  );
}

// ── Challenge Card with Leaderboard ─────────────────────────────────

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [expanded, setExpanded] = useState(false);
  const { data: leaderboard } = useChallengeLeaderboard(expanded ? challenge.id : null);
  const updateProgress = useUpdateChallengeProgress();
  const deleteChallenge = useDeleteChallenge();
  const [progressInput, setProgressInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cfg = CHALLENGE_TYPE_CONFIG[challenge.challenge_type] ?? CHALLENGE_TYPE_CONFIG.custom;
  const Icon = cfg.icon;

  const now = new Date();
  const start = new Date(challenge.start_date);
  const end = new Date(challenge.end_date);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  const elapsedDays = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / 86400000));
  const timeProgressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-teal-100 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{challenge.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">
              {challenge.target_value} {challenge.target_unit ?? ''}
            </span>
            <span className="text-[10px] text-gray-300">•</span>
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {daysLeft > 0
                ? (isDE ? `${daysLeft} Tage übrig` : `${daysLeft} days left`)
                : (isDE ? 'Beendet' : 'Ended')
              }
            </span>
          </div>
          {/* Time progress bar */}
          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${timeProgressPct}%` }}
            />
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-50 pt-2">
          {challenge.description && (
            <p className="text-xs text-gray-500">{challenge.description}</p>
          )}

          {/* Leaderboard */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Medal className="h-3 w-3" />
              Leaderboard
            </p>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-1">
                {leaderboard.map((p: ChallengeParticipant, idx: number) => {
                  const pct = challenge.target_value > 0
                    ? Math.min(100, Math.round((p.current_value / challenge.target_value) * 100))
                    : 0;
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      {/* Rank */}
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                        idx === 0 && 'bg-amber-100 text-amber-700',
                        idx === 1 && 'bg-gray-200 text-gray-600',
                        idx === 2 && 'bg-orange-100 text-orange-600',
                        idx > 2 && 'bg-gray-50 text-gray-400',
                      )}>
                        {idx + 1}
                      </span>
                      {/* Name */}
                      <span className="text-xs text-gray-700 truncate flex-1">
                        {p.profile?.display_name ?? (isDE ? 'Unbekannt' : 'Unknown')}
                      </span>
                      {/* Progress bar */}
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            pct >= 100 ? 'bg-green-500' : 'bg-teal-400',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {/* Value */}
                      <span className="text-[10px] font-medium text-gray-500 w-12 text-right flex-shrink-0">
                        {p.current_value}/{challenge.target_value}
                      </span>
                      {p.completed_at && <Trophy className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-gray-300 mx-auto" />
            )}
          </div>

          {/* Update my progress */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {isDE ? 'Mein Fortschritt' : 'My Progress'}
              </label>
              <input
                type="number"
                value={progressInput}
                onChange={(e) => setProgressInput(e.target.value)}
                placeholder="0"
                step="any"
                min="0"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={() => {
                if (!progressInput) return;
                updateProgress.mutate({ challengeId: challenge.id, value: Number(progressInput) });
                setProgressInput('');
              }}
              disabled={!progressInput || updateProgress.isPending}
              className="px-3 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50"
            >
              {isDE ? 'Aktualisieren' : 'Update'}
            </button>
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            {confirmDelete ? (
              <div className="flex gap-1">
                <button
                  onClick={() => deleteChallenge.mutate(challenge.id)}
                  className="px-2 py-1 bg-red-500 text-white text-[10px] font-medium rounded-lg"
                >
                  {isDE ? 'Ja, löschen' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-lg"
                >
                  {isDE ? 'Nein' : 'No'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[10px] text-gray-300 hover:text-red-400 transition-colors"
              >
                {isDE ? 'Challenge löschen' : 'Delete challenge'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export function ChallengesTabContent() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: challenges, isLoading } = useMyChallenges();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4">
      {/* Create challenge toggle */}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
          showCreate
            ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
        )}
      >
        {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {showCreate
          ? (isDE ? 'Schließen' : 'Close')
          : (isDE ? 'Challenge erstellen' : 'Create challenge')
        }
      </button>

      {showCreate && <CreateChallengeForm onClose={() => setShowCreate(false)} />}

      {/* Challenges list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : challenges && challenges.length > 0 ? (
        <div className="space-y-2">
          {challenges.map((c: Challenge) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 space-y-2">
          <Trophy className="h-10 w-10 text-gray-200 mx-auto" />
          <p className="text-sm text-gray-400">
            {isDE
              ? 'Keine aktiven Challenges. Erstelle eine!'
              : 'No active challenges. Create one!'}
          </p>
        </div>
      )}
    </div>
  );
}
