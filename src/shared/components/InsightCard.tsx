/**
 * Insight Card — compact card for a single recommendation/alert.
 *
 * Severity levels:
 * - critical: red bg, bold text
 * - warning: yellow/amber bg
 * - info: gray bg
 * - success: green bg
 */

import type { Insight, InsightSeverity } from '../../lib/insights';

const SEVERITY_STYLES: Record<InsightSeverity, { bg: string; border: string; titleColor: string; msgColor: string }> = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-l-4 border-red-500',
    titleColor: 'text-red-800',
    msgColor: 'text-red-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-l-4 border-amber-400',
    titleColor: 'text-amber-800',
    msgColor: 'text-amber-600',
  },
  info: {
    bg: 'bg-gray-50',
    border: 'border-l-4 border-gray-300',
    titleColor: 'text-gray-700',
    msgColor: 'text-gray-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-l-4 border-green-400',
    titleColor: 'text-green-800',
    msgColor: 'text-green-600',
  },
};

interface Props {
  insight: Insight;
  language: 'de' | 'en';
}

export function InsightCard({ insight, language }: Props) {
  const style = SEVERITY_STYLES[insight.severity];

  return (
    <div className={`${style.bg} ${style.border} rounded-r-lg px-3 py-2.5`}>
      <div className="flex items-start gap-2">
        <span className="text-sm flex-shrink-0 mt-0.5">{insight.icon}</span>
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${style.titleColor}`}>
            {insight.title[language]}
          </p>
          <p className={`text-[11px] ${style.msgColor} mt-0.5 leading-relaxed`}>
            {insight.message[language]}
          </p>
        </div>
      </div>
    </div>
  );
}
