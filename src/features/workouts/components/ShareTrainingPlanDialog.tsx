/**
 * ShareTrainingPlanDialog — Modal with share options for training plans.
 *
 * Options:
 * 1. Copy as formatted text (for WhatsApp, Telegram, Email)
 * 2. Copy share link + QR code (if data fits)
 *
 * Uses compact JSON encoding for link/QR, human-readable text for clipboard.
 */

import { useState, useCallback, useMemo } from 'react';
import { X, Copy, Check, QrCode, FileText, Link, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../../i18n';
import type { TrainingPlan } from '../../../types/health';
import { planToText, planToShareURL } from '../utils/exportTrainingPlan';

/** Max QR code data length (approx, with error correction level L) */
const QR_MAX_BYTES = 2900;

interface ShareTrainingPlanDialogProps {
  plan: TrainingPlan;
  onClose: () => void;
}

export function ShareTrainingPlanDialog({ plan, onClose }: ShareTrainingPlanDialogProps) {
  const { t, language } = useTranslation();
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'qr'>('text');

  const shareURL = planToShareURL(plan);
  const shareText = planToText(plan, language);

  // Check if the URL fits in a QR code
  const qrFitsData = useMemo(() => {
    try {
      return new TextEncoder().encode(shareURL).length <= QR_MAX_BYTES;
    } catch {
      return shareURL.length <= QR_MAX_BYTES;
    }
  }, [shareURL]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  }, [shareText]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareURL;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [shareURL]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-0 sm:mx-4 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">{t.share.sharePlan}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Plan Info */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="font-medium text-gray-900 text-sm">{plan.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {plan.days_per_week}x / {language === 'de' ? 'Woche' : 'Week'} · {plan.days?.length ?? 0} {language === 'de' ? 'Tage' : 'Days'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-4 flex gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'text'
                ? 'bg-teal-50 text-teal-700'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            {t.share.copyAsText}
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'qr'
                ? 'bg-teal-50 text-teal-700'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            {t.share.qrCode}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeTab === 'text' ? (
            <div className="space-y-3">
              {/* Text Preview */}
              <div className="bg-gray-50 rounded-xl p-3 max-h-60 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {shareText}
                </pre>
              </div>

              {/* Copy Text Button */}
              <button
                onClick={handleCopyText}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-emerald-700 transition-all"
              >
                {copiedText ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t.share.copied}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t.share.copyAsText}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {qrFitsData ? (
                <>
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <QRCodeSVG
                        value={shareURL}
                        size={200}
                        level="L"
                        bgColor="#ffffff"
                        fgColor="#0d9488"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    {t.share.scanOrShare}
                  </p>
                </>
              ) : (
                <>
                  {/* Plan too large for QR */}
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-amber-700 font-medium">
                      {language === 'de'
                        ? 'Plan zu groß für QR-Code'
                        : 'Plan too large for QR code'}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {language === 'de'
                        ? 'Nutze stattdessen den Link zum Teilen.'
                        : 'Use the link to share instead.'}
                    </p>
                  </div>
                </>
              )}

              {/* Copy Link Button — always available */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-emerald-700 transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t.share.copied}
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    {t.share.copyLink}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
