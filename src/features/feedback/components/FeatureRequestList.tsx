import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useFeatureRequests, useMyVotes, useVoteFeature } from '../hooks/useFeatureRequests';
import { FeatureRequestCard } from './FeatureRequestCard';
import type { FeatureRequestStatus, VoteType } from '../types';

type SortBy = 'votes' | 'newest';
type FilterBy = 'all' | 'planned' | 'completed';

const FILTER_STATUSES: Record<FilterBy, FeatureRequestStatus[] | null> = {
  all: null,
  planned: ['planned', 'in_progress'],
  completed: ['completed'],
};

interface Props {
  onSubmitNew: () => void;
}

export function FeatureRequestList({ onSubmitNew }: Props) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<SortBy>('votes');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');

  const { data: requests = [], isLoading } = useFeatureRequests(sortBy);
  const { data: myVotes = [] } = useMyVotes();
  const voteFeature = useVoteFeature();

  const handleVote = (featureRequestId: string, voteType: VoteType) => {
    voteFeature.mutate({ featureRequestId, voteType });
  };

  const filteredRequests = FILTER_STATUSES[filterBy]
    ? requests.filter((r) => FILTER_STATUSES[filterBy]!.includes(r.status))
    : requests;

  return (
    <div className="space-y-4">
      {/* Promise banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-3 text-center">
        <p className="text-xs text-teal-700 font-medium">{t.feedback.topFeaturePromise}</p>
      </div>

      {/* Sort + Filter controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {(['votes', 'newest'] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === s
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'votes' ? t.feedback.topVoted : t.feedback.newest}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', 'planned', 'completed'] as FilterBy[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterBy(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterBy === f
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? t.feedback.filterAll :
               f === 'planned' ? t.feedback.filterPlanned :
               t.feedback.filterCompleted}
            </button>
          ))}
        </div>
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="text-center py-8 text-sm text-gray-400">{t.common.loading}</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400 mb-4">{t.feedback.noFeatureRequests}</p>
          <button
            onClick={onSubmitNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="h-4 w-4" />
            {t.feedback.submitFeature}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <FeatureRequestCard
              key={req.id}
              request={req}
              myVote={myVotes.find((v) => v.feature_request_id === req.id)}
              onVote={handleVote}
              isVoting={voteFeature.isPending}
            />
          ))}
        </div>
      )}

      {/* FAB for new request */}
      {filteredRequests.length > 0 && (
        <button
          onClick={onSubmitNew}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-5 w-5" />
          {t.feedback.submitFeature}
        </button>
      )}
    </div>
  );
}
