/**
 * PeriodizationSection — Embeds existing periodization view in progress dashboard.
 */
import { lazy, Suspense } from 'react';

const PeriodizationView = lazy(() =>
  import('../PeriodizationView').then(m => ({ default: m.PeriodizationView }))
);

export function PeriodizationSection() {
  return (
    <Suspense fallback={<div className="h-48 bg-gray-50 rounded-xl animate-pulse" />}>
      <PeriodizationView />
    </Suspense>
  );
}
