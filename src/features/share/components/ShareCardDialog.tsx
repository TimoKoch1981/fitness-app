/**
 * ShareCardDialog — Modal to preview and share a progress card.
 *
 * Shows a preview of the ShareProgressCard, then lets the user
 * either download as PNG or share via Web Share API.
 */

import { useRef, useState, useCallback } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../../i18n';
import { ShareProgressCard, type ShareCardData } from './ShareProgressCard';
import { elementToBlob, shareOrDownload, downloadBlob } from '../utils/generateShareImage';

interface ShareCardDialogProps {
  data: ShareCardData;
  onClose: () => void;
}

export function ShareCardDialog({ data, onClose }: ShareCardDialogProps) {
  const { t, language } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const blob = await elementToBlob(cardRef.current);
      downloadBlob(blob, `fitbuddy-progress-${new Date().toISOString().split('T')[0]}.png`);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const blob = await elementToBlob(cardRef.current);
      const shared = await shareOrDownload(
        blob,
        'FitBuddy Progress',
        language === 'de' ? 'Mein Fitness-Fortschritt diese Woche!' : 'My fitness progress this week!',
        `fitbuddy-progress-${new Date().toISOString().split('T')[0]}.png`
      );
      if (!shared) {
        // Was downloaded as fallback — no toast needed, user sees the download
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, language]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{t.share.title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-4 flex justify-center bg-gray-50">
          <ShareProgressCard ref={cardRef} data={data} language={language} />
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t.share.downloadImage}
          </button>
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-emerald-700 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {t.share.shareNow}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
