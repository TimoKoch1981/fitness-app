import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { FeatureRequest, FeatureVote, VoteType } from '../types';

interface Props {
  request: FeatureRequest;
  myVote?: FeatureVote;
  onVote: (featureRequestId: string, voteType: VoteType) => void;
  isVoting?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-gray-100 text-gray-600',
  under_review: 'bg-blue-100 text-blue-700',
  planned: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

export function FeatureRequestCard({ request, myVote, onVote, isVoting }: Props) {
  const { t } = useTranslation();

  const statusLabel = {
    submitted: t.feedback.statusSubmitted,
    under_review: t.feedback.statusUnderReview,
    planned: t.feedback.statusPlanned,
    in_progress: t.feedback.statusInProgress,
    completed: t.feedback.statusCompleted,
    rejected: t.feedback.statusRejected,
  }[request.status] ?? request.status;

  const myVoteType = myVote?.vote_type ?? null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex gap-3">
      {/* Vote buttons */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <button
          onClick={() => onVote(request.id, 'up')}
          disabled={isVoting}
          className={`p-1.5 rounded-lg transition-colors ${
            myVoteType === 'up'
              ? 'bg-teal-100 text-teal-600'
              : 'text-gray-400 hover:text-teal-500 hover:bg-gray-100'
          }`}
          aria-label={t.feedback.upvote}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <span className={`text-sm font-bold ${
          request.vote_count > 0 ? 'text-teal-600' :
          request.vote_count < 0 ? 'text-red-500' :
          'text-gray-400'
        }`}>
          {request.vote_count}
        </span>
        <button
          onClick={() => onVote(request.id, 'down')}
          disabled={isVoting}
          className={`p-1.5 rounded-lg transition-colors ${
            myVoteType === 'down'
              ? 'bg-red-100 text-red-500'
              : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
          }`}
          aria-label={t.feedback.downvote}
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 text-sm leading-tight">{request.title}</h3>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[request.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {statusLabel}
          </span>
        </div>
        {request.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{request.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
          <span>{new Date(request.created_at).toLocaleDateString('de-DE')}</span>
          {request.author_name && <span>{request.author_name}</span>}
          {request.planned_month && (
            <span className="text-teal-500">{t.feedback.plannedMonth} {request.planned_month}</span>
          )}
        </div>
      </div>
    </div>
  );
}
