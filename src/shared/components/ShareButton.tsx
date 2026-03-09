/**
 * ShareButton — Universal share component using Web Share API.
 * Falls back to clipboard copy on unsupported browsers.
 *
 * Usage:
 *   <ShareButton title="Workout" text="3 PRs!" getImage={async () => blob} />
 *   <ShareButton title="Streak" text="30 Tage!" />
 */

import { useState, useCallback } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface ShareButtonProps {
  /** Share dialog title */
  title: string;
  /** Share text content */
  text: string;
  /** Optional URL to share */
  url?: string;
  /** Async function that returns image blob for sharing */
  getImage?: () => Promise<Blob | null>;
  /** Optional CSS class override */
  className?: string;
  /** Compact mode (icon only) */
  compact?: boolean;
}

export function ShareButton({ title, text, url, getImage, className, compact }: ShareButtonProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [status, setStatus] = useState<'idle' | 'loading' | 'shared' | 'copied'>('idle');

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleShare = useCallback(async () => {
    setStatus('loading');
    try {
      const shareData: ShareData = {
        title,
        text: text + '\n\n#FitBuddy #Fitness',
        url: url || 'https://fudda.de',
      };

      // Try to attach image if available
      if (getImage && 'canShare' in navigator) {
        try {
          const blob = await getImage();
          if (blob) {
            const file = new File([blob], 'fitbuddy-share.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          }
        } catch {
          // Image generation failed — share without image
        }
      }

      if (canShare) {
        await navigator.share(shareData);
        setStatus('shared');
      } else {
        // Fallback: copy text to clipboard
        await navigator.clipboard.writeText(`${title}\n${text}\n${url || 'https://fudda.de'}`);
        setStatus('copied');
      }
    } catch (err: unknown) {
      // User cancelled share dialog — that's ok
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setStatus('idle');
    }

    // Reset after 2s
    setTimeout(() => setStatus('idle'), 2000);
  }, [title, text, url, getImage, canShare]);

  const label = status === 'shared'
    ? (isDE ? 'Geteilt!' : 'Shared!')
    : status === 'copied'
      ? (isDE ? 'Kopiert!' : 'Copied!')
      : status === 'loading'
        ? '...'
        : (isDE ? 'Teilen' : 'Share');

  const Icon = status === 'shared' || status === 'copied' ? Check : canShare ? Share2 : Copy;
  const isSuccess = status === 'shared' || status === 'copied';

  if (compact) {
    return (
      <button
        onClick={handleShare}
        disabled={status === 'loading'}
        className={className || `p-2 rounded-lg transition-colors ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        title={label}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={status === 'loading'}
      className={className || `flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
        isSuccess
          ? 'bg-green-100 text-green-700'
          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
      } disabled:opacity-50`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
