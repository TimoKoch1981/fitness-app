/**
 * KeyRotationStatus — Admin card showing API key rotation health.
 *
 * Displays a status badge per key (green/yellow/red) and days since rotation.
 * Expandable rotation guide with step-by-step instructions.
 */

import { useState } from 'react';
import { Key, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { useKeyRotation, type KeyRotationEntry } from '../hooks/useKeyRotation';
import { useTranslation } from '../../../i18n';

function StatusBadge({ status }: { status: KeyRotationEntry['status'] }) {
  const { t } = useTranslation();

  switch (status) {
    case 'ok':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3" />
          {t.admin?.keyRotation?.ok || 'OK'}
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <AlertTriangle className="h-3 w-3" />
          {t.admin?.keyRotation?.warning || 'Warning'}
        </span>
      );
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="h-3 w-3" />
          {t.admin?.keyRotation?.critical || 'Critical'}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          <HelpCircle className="h-3 w-3" />
          {t.admin?.keyRotation?.unknown || 'Unknown'}
        </span>
      );
  }
}

export function KeyRotationStatus() {
  const { t } = useTranslation();
  const { keys, isLoading, error, refetch } = useKeyRotation();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Key className="h-4 w-4 text-indigo-500" />
          {t.admin?.keyRotation?.title || 'API Key Rotation'}
        </h3>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2">
          {error.message}
        </p>
      )}

      {isLoading && keys.length === 0 ? (
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.name}
              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{key.name}</p>
                <p className="text-[10px] text-gray-400">
                  {key.daysOld !== null
                    ? `${key.daysOld} ${t.admin?.keyRotation?.daysOld || 'days old'}`
                    : t.admin?.keyRotation?.lastRotated || 'No rotation date'}
                  {key.rotatedAt && ` — ${new Date(key.rotatedAt).toLocaleDateString()}`}
                </p>
              </div>
              <StatusBadge status={key.status} />
            </div>
          ))}
        </div>
      )}

      {/* Rotation Guide Toggle */}
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="mt-3 w-full flex items-center justify-between py-2 px-3 text-xs text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <span>{t.admin?.keyRotation?.rotationGuide || 'Rotation Guide'}</span>
        {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {showGuide && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-3">
          <div>
            <p className="font-semibold text-gray-700 mb-1">OpenAI API Key:</p>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>Generate new key at platform.openai.com</li>
              <li>Update OPENAI_API_KEY in server .env</li>
              <li>Set OPENAI_KEY_ROTATED_AT to today (ISO format)</li>
              <li>Restart ai-proxy container</li>
              <li>Verify with test request</li>
              <li>Revoke old key in OpenAI dashboard</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Resend API Key:</p>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>Generate new key at resend.com/api-keys</li>
              <li>Update RESEND_API_KEY in server .env</li>
              <li>Set RESEND_KEY_ROTATED_AT to today (ISO format)</li>
              <li>Restart GoTrue container</li>
              <li>Test with verification email</li>
            </ol>
          </div>
          <p className="text-[10px] text-gray-400 italic">
            Schedule: Jan / Apr / Jul / Oct (quarterly)
          </p>
        </div>
      )}
    </div>
  );
}
