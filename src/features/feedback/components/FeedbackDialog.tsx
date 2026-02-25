import { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, Bug, MessageSquare, Lightbulb, Send } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSubmitFeedback } from '../hooks/useFeedback';
import { useSubmitFeatureRequest } from '../hooks/useFeatureRequests';
import { collectBugContext } from '../hooks/useFeedback';
import type { FeedbackCategory, FeedbackRating } from '../types';

type Mode = 'select' | 'quick' | 'bug' | 'feature';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FeedbackDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const submitFeedback = useSubmitFeedback();
  const submitFeature = useSubmitFeatureRequest();

  const [mode, setMode] = useState<Mode>('select');
  const [category, setCategory] = useState<FeedbackCategory>('note');
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [message, setMessage] = useState('');
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const reset = () => {
    setMode('select');
    setCategory('note');
    setRating(null);
    setMessage('');
    setFeatureTitle('');
    setFeatureDescription('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmitFeedback = async () => {
    setError('');
    try {
      const context = collectBugContext();
      await submitFeedback.mutateAsync({
        category,
        rating: rating ?? undefined,
        message: message || undefined,
        page_url: context.page_url,
        user_agent: context.user_agent,
      });
      setSuccess(true);
      setTimeout(handleClose, 1500);
    } catch {
      setError(t.common.saveError);
    }
  };

  const handleSubmitFeature = async () => {
    if (!featureTitle.trim()) return;
    setError('');
    try {
      await submitFeature.mutateAsync({
        title: featureTitle.trim(),
        description: featureDescription.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(handleClose, 1500);
    } catch {
      setError(t.common.saveError);
    }
  };

  const isPending = submitFeedback.isPending || submitFeature.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'select' ? t.feedback.title :
             mode === 'quick' ? t.feedback.quickFeedback :
             mode === 'bug' ? t.feedback.bugReport :
             t.feedback.featureRequest}
          </h2>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Success State */}
          {success && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">&#10003;</div>
              <p className="text-lg font-medium text-teal-600">{t.feedback.thankYou}</p>
            </div>
          )}

          {/* Mode Selection */}
          {!success && mode === 'select' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('quick')}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <MessageSquare className="h-5 w-5 text-teal-500 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{t.feedback.quickFeedback}</p>
                  <p className="text-xs text-gray-500">{t.feedback.thumbsUp} / {t.feedback.thumbsDown}</p>
                </div>
              </button>
              <button
                onClick={() => { setCategory('bug'); setMode('bug'); }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <Bug className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{t.feedback.bugReport}</p>
                  <p className="text-xs text-gray-500">{t.feedback.categoryBug}</p>
                </div>
              </button>
              <button
                onClick={() => setMode('feature')}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{t.feedback.featureRequest}</p>
                  <p className="text-xs text-gray-500">{t.feedback.featureRequests}</p>
                </div>
              </button>
            </div>
          )}

          {/* Quick Feedback Mode */}
          {!success && mode === 'quick' && (
            <div className="space-y-4">
              {/* Rating */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setRating('up')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    rating === 'up'
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsUp className="h-5 w-5" />
                  {t.feedback.thumbsUp}
                </button>
                <button
                  onClick={() => setRating('down')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    rating === 'down'
                      ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsDown className="h-5 w-5" />
                  {t.feedback.thumbsDown}
                </button>
              </div>

              {/* Category */}
              <div className="flex gap-2">
                {(['note', 'praise', 'bug'] as FeedbackCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      category === cat
                        ? 'bg-teal-100 text-teal-700 ring-1 ring-teal-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'bug' ? t.feedback.categoryBug :
                     cat === 'note' ? t.feedback.categoryNote :
                     t.feedback.categoryPraise}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.feedback.messagePlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm min-h-20 resize-none"
              />

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                onClick={handleSubmitFeedback}
                disabled={isPending || !rating}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg disabled:opacity-50 transition-all"
              >
                <Send className="h-4 w-4" />
                {isPending ? t.common.loading : t.feedback.submitFeedback}
              </button>
            </div>
          )}

          {/* Bug Report Mode */}
          {!success && mode === 'bug' && (
            <div className="space-y-4">
              {/* Auto-context chips */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                  {t.feedback.autoContext}: {window.location.pathname}
                </span>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.feedback.bugDescription}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm min-h-28 resize-none"
                autoFocus
              />

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                onClick={handleSubmitFeedback}
                disabled={isPending || !message.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg disabled:opacity-50 transition-all"
              >
                <Send className="h-4 w-4" />
                {isPending ? t.common.loading : t.feedback.submitFeedback}
              </button>
            </div>
          )}

          {/* Feature Request Mode */}
          {!success && mode === 'feature' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.feedback.featureTitle} *
                </label>
                <input
                  type="text"
                  value={featureTitle}
                  onChange={(e) => setFeatureTitle(e.target.value)}
                  placeholder={t.feedback.featureTitlePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  required
                  autoFocus
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.feedback.featureDescription}
                </label>
                <textarea
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                  placeholder={t.feedback.featureDescriptionPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm min-h-20 resize-none"
                  maxLength={2000}
                />
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                onClick={handleSubmitFeature}
                disabled={isPending || !featureTitle.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg disabled:opacity-50 transition-all"
              >
                <Send className="h-4 w-4" />
                {isPending ? t.common.loading : t.feedback.submitFeature}
              </button>
            </div>
          )}

          {/* Back button (not on select mode) */}
          {!success && mode !== 'select' && (
            <button
              onClick={() => setMode('select')}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t.common.back}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
