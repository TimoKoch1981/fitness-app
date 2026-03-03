/**
 * FeatureFlagPanel — Admin panel for viewing and toggling feature flags.
 *
 * Shows all feature flags with toggle switches, descriptions, and status.
 * Only visible to admin users.
 */

import { Sliders, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useFeatureFlags } from '../../../lib/featureFlags/FeatureFlagProvider';

export function FeatureFlagPanel() {
  const { t } = useTranslation();
  const { flags, toggleFlag } = useFeatureFlags();
  const flagEntries = Object.values(flags);

  const ffKeys = t.featureFlags;

  if (flagEntries.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center text-sm text-gray-500">
        {ffKeys?.noFlags ?? 'No feature flags configured'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Sliders className="h-4 w-4 text-indigo-500" />
        {ffKeys?.title ?? 'Feature Flags'}
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        {ffKeys?.adminOnly ?? 'Only visible to administrators'}
      </p>

      <div className="space-y-2">
        {flagEntries.map(flag => (
          <div
            key={flag.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm font-medium text-gray-700 truncate">
                {flag.name}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {flag.description}
              </div>
            </div>
            <button
              onClick={() => toggleFlag(flag.id)}
              className={`flex-shrink-0 transition-colors ${
                flag.enabled ? 'text-green-500' : 'text-gray-300'
              }`}
              aria-label={`${ffKeys?.toggle ?? 'Toggle'} ${flag.name}`}
            >
              {flag.enabled ? (
                <ToggleRight className="h-6 w-6" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
