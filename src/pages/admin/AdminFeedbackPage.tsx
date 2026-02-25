import { useState } from 'react';
import { AdminNav } from '../../features/admin/components/AdminNav';
import { useTranslation } from '../../i18n';
import { useAllFeedback, useFeedbackStats, useAllFeatureRequests, useUpdateFeedbackStatus, useUpdateFeatureRequestStatus } from '../../features/feedback/hooks/useAdminFeedback';
import type { FeedbackStatus, FeatureRequestStatus } from '../../features/feedback/types';

const FEEDBACK_STATUSES: FeedbackStatus[] = ['new', 'in_progress', 'resolved', 'wont_fix'];
const FEATURE_STATUSES: FeatureRequestStatus[] = ['submitted', 'under_review', 'planned', 'in_progress', 'completed', 'rejected'];

export function AdminFeedbackPage() {
  const { t } = useTranslation();
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackStatus | undefined>();
  const [activeTab, setActiveTab] = useState<'feedback' | 'features'>('feedback');

  const { data: allFeedback = [], isLoading: fbLoading } = useAllFeedback(
    feedbackFilter ? { status: feedbackFilter } : undefined
  );
  const { data: stats = [] } = useFeedbackStats();
  const { data: allFeatures = [], isLoading: frLoading } = useAllFeatureRequests();
  const updateFeedbackStatus = useUpdateFeedbackStatus();
  const updateFeatureStatus = useUpdateFeatureRequestStatus();

  const totalFeedback = stats.reduce((sum, s) => sum + (s as { count: number }).count, 0);
  const bugCount = stats.filter((s) => (s as { category: string }).category === 'bug')
    .reduce((sum, s) => sum + (s as { count: number }).count, 0);

  const statusLabel = (status: string) => {
    const key = `status${status.charAt(0).toUpperCase()}${status.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}` as keyof typeof t.feedback;
    return t.feedback[key] ?? status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900">{t.feedback.feedbackDashboard}</h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalFeedback}</p>
            <p className="text-xs text-gray-500">{t.feedback.feedbackCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-red-500">{bugCount}</p>
            <p className="text-xs text-gray-500">{t.feedback.bugCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-amber-500">{allFeatures.length}</p>
            <p className="text-xs text-gray-500">{t.feedback.featureCount}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'feedback' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t.feedback.allFeedback} ({allFeedback.length})
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'features' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t.feedback.featureRequests} ({allFeatures.length})
          </button>
        </div>

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFeedbackFilter(undefined)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!feedbackFilter ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {t.feedback.filterAll}
              </button>
              {FEEDBACK_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFeedbackFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${feedbackFilter === s ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>

            {fbLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : allFeedback.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">{t.feedback.noFeedback}</p>
            ) : (
              <div className="space-y-3">
                {allFeedback.map((fb) => (
                  <div key={fb.id} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          fb.category === 'bug' ? 'bg-red-100 text-red-600' :
                          fb.category === 'praise' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {fb.category === 'bug' ? t.feedback.categoryBug :
                           fb.category === 'praise' ? t.feedback.categoryPraise :
                           t.feedback.categoryNote}
                        </span>
                        {fb.rating && (
                          <span className="text-sm">{fb.rating === 'up' ? '👍' : '👎'}</span>
                        )}
                      </div>
                      <select
                        value={fb.status}
                        onChange={(e) => updateFeedbackStatus.mutate({ id: fb.id, status: e.target.value as FeedbackStatus })}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none"
                      >
                        {FEEDBACK_STATUSES.map((s) => (
                          <option key={s} value={s}>{statusLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                    {fb.message && <p className="text-sm text-gray-700">{fb.message}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{new Date(fb.created_at).toLocaleString('de-DE')}</span>
                      {fb.page_url && <span>{fb.page_url}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feature Requests Tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            {frLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <div className="space-y-3">
                {allFeatures.map((fr) => (
                  <div key={fr.id} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 text-sm">{fr.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">{fr.vote_count} {t.feedback.votes}</span>
                        <select
                          value={fr.status}
                          onChange={(e) => updateFeatureStatus.mutate({ id: fr.id, status: e.target.value as FeatureRequestStatus })}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none"
                        >
                          {FEATURE_STATUSES.map((s) => (
                            <option key={s} value={s}>{statusLabel(s)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {fr.description && <p className="text-xs text-gray-500">{fr.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{new Date(fr.created_at).toLocaleString('de-DE')}</span>
                      {fr.author_name && <span>{fr.author_name}</span>}
                      {fr.upvotes !== undefined && (
                        <span>👍 {fr.upvotes} / 👎 {fr.downvotes}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
